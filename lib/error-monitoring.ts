// Serviço de monitoramento de erros
import { toast } from "@/components/ui/use-toast"

// Interface para eventos de erro
interface ErrorEvent {
  message: string
  source: string
  lineno?: number
  colno?: number
  error?: Error
  timestamp: number
  userAgent?: string
  url?: string
}

// Classe para gerenciar o monitoramento de erros
class ErrorMonitoringService {
  private static instance: ErrorMonitoringService
  private isInitialized = false
  private errorLog: ErrorEvent[] = []
  private maxLogSize = 100
  private errorListeners: ((error: ErrorEvent) => void)[] = []

  private constructor() {
    // Construtor privado para singleton
  }

  public static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService()
    }
    return ErrorMonitoringService.instance
  }

  public initialize(): void {
    if (this.isInitialized || typeof window === "undefined") return

    console.log("Inicializando serviço de monitoramento de erros")

    // Configurar handler global para erros não capturados
    window.addEventListener("error", this.handleGlobalError.bind(this))

    // Configurar handler para promessas não tratadas
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection.bind(this))

    this.isInitialized = true
  }

  // Manipular erros globais
  private handleGlobalError(event: ErrorEvent): void {
    this.logError({
      message: event.message,
      source: event.filename || "unknown",
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    })
  }

  // Manipular promessas não tratadas
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))

    this.logError({
      message: error.message,
      source: "unhandled-promise-rejection",
      error,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    })
  }

  // Registrar erro
  public logError(errorEvent: ErrorEvent): void {
    console.error("Erro capturado:", errorEvent)

    // Adicionar erro ao log
    this.errorLog.unshift(errorEvent)

    // Limitar tamanho do log
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    // Notificar listeners
    this.notifyListeners(errorEvent)

    // Mostrar toast para o usuário
    this.showErrorToast(errorEvent)
  }

  // Mostrar toast de erro
  private showErrorToast(errorEvent: ErrorEvent): void {
    toast({
      title: "Erro detectado",
      description: `${errorEvent.message.substring(0, 100)}${errorEvent.message.length > 100 ? "..." : ""}`,
      variant: "destructive",
    })
  }

  // Adicionar listener de erro
  public addErrorListener(listener: (error: ErrorEvent) => void): void {
    this.errorListeners.push(listener)
  }

  // Remover listener de erro
  public removeErrorListener(listener: (error: ErrorEvent) => void): void {
    this.errorListeners = this.errorListeners.filter((l) => l !== listener)
  }

  // Notificar listeners
  private notifyListeners(errorEvent: ErrorEvent): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(errorEvent)
      } catch (error) {
        console.error("Erro ao notificar listener:", error)
      }
    })
  }

  // Obter log de erros
  public getErrorLog(): ErrorEvent[] {
    return [...this.errorLog]
  }

  // Limpar log de erros
  public clearErrorLog(): void {
    this.errorLog = []
  }
}

// Exportar uma instância singleton
export const errorMonitoring = ErrorMonitoringService.getInstance()

// Função para capturar erros em funções assíncronas
export async function tryCatch<T>(fn: () => Promise<T>, errorMessage: string): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    errorMonitoring.logError({
      message: errorMessage,
      source: "try-catch-wrapper",
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp: Date.now(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      url: typeof window !== "undefined" ? window.location.href : "unknown",
    })
    return null
  }
}
