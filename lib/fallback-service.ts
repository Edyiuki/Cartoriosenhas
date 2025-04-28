// Serviço de fallback para quando o Socket.io falhar
import type { SocketEvent } from "./socket-service"

// Interface para os listeners de eventos
interface EventListeners {
  [event: string]: ((data: any) => void)[]
}

// Classe para gerenciar a comunicação de fallback usando localStorage
export class FallbackService {
  private static instance: FallbackService
  private listeners: Map<string, Set<Function>> = new Map()
  private localStorageKey = "fallback_events"
  private pollingInterval: NodeJS.Timeout | null = null
  private pollingFrequency = 2000 // 2 segundos

  private constructor() {
    // Construtor privado para singleton
  }

  public static getInstance(): FallbackService {
    if (!FallbackService.instance) {
      FallbackService.instance = new FallbackService()
    }
    return FallbackService.instance
  }

  public start(): void {
    if (typeof window === "undefined" || this.pollingInterval) return

    // Iniciar polling para verificar novos eventos
    this.pollingInterval = setInterval(() => {
      this.checkForNewEvents()
    }, this.pollingFrequency)

    console.log("Serviço de fallback iniciado")
  }

  public stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  public emit(event: SocketEvent, data: any): void {
    if (typeof window === "undefined") return

    try {
      // Obter eventos existentes
      const events = this.getEvents()

      // Adicionar novo evento
      events.push({
        id: this.generateId(),
        event,
        data,
        timestamp: new Date().toISOString(),
      })

      // Limitar a 100 eventos para evitar problemas de armazenamento
      if (events.length > 100) {
        events.shift()
      }

      // Salvar eventos
      localStorage.setItem(this.localStorageKey, JSON.stringify(events))
    } catch (error) {
      console.error("Erro ao emitir evento de fallback:", error)
    }
  }

  public on(event: SocketEvent, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(callback)
  }

  public off(event: SocketEvent, callback: Function): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.delete(callback)
    }
  }

  private checkForNewEvents(): void {
    if (typeof window === "undefined") return

    try {
      // Obter eventos existentes
      const events = this.getEvents()

      // Verificar se há novos eventos
      if (events.length === 0) return

      // Processar eventos
      events.forEach((event) => {
        this.notifyListeners(event.event, event.data)
      })

      // Limpar eventos processados
      localStorage.setItem(this.localStorageKey, JSON.stringify([]))
    } catch (error) {
      console.error("Erro ao verificar novos eventos:", error)
    }
  }

  private notifyListeners(event: SocketEvent, data: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Erro ao executar callback para evento ${event}:`, error)
        }
      })
    }
  }

  private getEvents(): any[] {
    try {
      const eventsJson = localStorage.getItem(this.localStorageKey)
      return eventsJson ? JSON.parse(eventsJson) : []
    } catch (error) {
      console.error("Erro ao obter eventos do localStorage:", error)
      return []
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
}

// Exportar uma instância singleton
export const fallbackService = FallbackService.getInstance()
