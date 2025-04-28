// Serviço de comunicação em tempo real usando Socket.io
import { io, type Socket } from "socket.io-client"
import { toast } from "@/components/ui/use-toast"
import { fallbackService } from "./fallback-service"
import { clientConfig, supportsWebSockets } from "./socket-config"

// Tipos de eventos
export enum SocketEvent {
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  ERROR = "error",
  TICKET_CREATED = "ticket:created",
  TICKET_CALLED = "ticket:called",
  TICKET_COMPLETED = "ticket:completed",
  TICKET_CANCELLED = "ticket:cancelled",
  TICKET_DIRECTED = "ticket:directed",
  CHAT_MESSAGE = "chat:message",
  GUICHE_STATUS_CHANGED = "guiche:status-changed",
  GUICHE_UPDATED = "guiche:updated",
  SYSTEM_BACKUP = "system:backup",
  SYSTEM_RESTORE = "system:restore",
  USER_CONNECTED = "user:connected",
  USER_DISCONNECTED = "user:disconnected",
}

// Classe para gerenciar a conexão Socket.io
class SocketService {
  private static instance: SocketService
  private socket: Socket | null = null
  private listeners: Map<string, Set<Function>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectInterval = 3000 // 3 segundos
  private isInitialized = false
  private pendingEvents: Array<{ event: SocketEvent; data: any }> = []
  private usePollingOnly = true // Iniciar apenas com polling para maior compatibilidade
  private useFallback = false // Usar fallback quando Socket.io falhar completamente

  private constructor() {
    // Construtor privado para singleton
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  public connect(): void {
    if (this.socket || typeof window === "undefined") return

    try {
      console.log("Tentando conectar ao servidor Socket.io...")

      // Verificar se o ambiente suporta WebSockets
      const webSocketsSupported = supportsWebSockets()
      console.log(`WebSockets suportados: ${webSocketsSupported}`)

      // Configurar transporte com base no suporte a WebSockets
      const transports = this.usePollingOnly || !webSocketsSupported ? ["polling"] : ["polling", "websocket"]

      // Conectar ao servidor Socket.io com configurações
      this.socket = io({
        ...clientConfig,
        transports,
      })

      // Configurar handlers de eventos
      this.socket.on(SocketEvent.CONNECT, () => {
        console.log("Conectado ao servidor Socket.io")
        this.reconnectAttempts = 0
        this.notifyListeners(SocketEvent.CONNECT, null)
        this.useFallback = false

        // Mostrar toast de conexão bem-sucedida apenas se reconectando
        if (this.isInitialized) {
          toast({
            title: "Conexão restabelecida",
            description: "Você está conectado ao servidor novamente.",
            variant: "default",
          })
        }

        // Enviar eventos pendentes
        this.sendPendingEvents()

        this.isInitialized = true

        // Após 5 segundos, tentar habilitar WebSocket se estiver usando apenas polling
        if (this.usePollingOnly && webSocketsSupported) {
          setTimeout(() => {
            this.enableWebSocket()
          }, 5000)
        }
      })

      this.socket.on(SocketEvent.DISCONNECT, (reason) => {
        console.log(`Desconectado do servidor Socket.io: ${reason}`)
        this.notifyListeners(SocketEvent.DISCONNECT, reason)
      })

      // Configurar handlers para eventos específicos
      this.configureEventHandlers()

      // Configurar reconexão manual se necessário
      this.socket.on("reconnect_failed", () => {
        console.log("Falha na reconexão automática, tentando manualmente...")
        this.reconnectManually()
      })

      this.socket.on("connect_error", (error) => {
        console.error("Erro de conexão:", error)
        this.notifyListeners(SocketEvent.ERROR, error)

        // Se o erro for relacionado a WebSocket, voltar para polling apenas
        if (error.message && error.message.includes("websocket")) {
          console.log("Erro de WebSocket detectado, voltando para polling apenas")
          this.usePollingOnly = true
          this.reconnectWithPollingOnly()
          return
        }

        // Mostrar toast de erro apenas na primeira tentativa
        if (this.reconnectAttempts === 0) {
          toast({
            title: "Erro de conexão com o servidor",
            description: "Tentando reconectar automaticamente...",
            variant: "destructive",
          })
        }

        this.reconnectManually()

        // Se atingir o número máximo de tentativas, ativar o fallback
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.activateFallback()
        }
      })

      // Adicionar handler para erros gerais
      this.socket.on("error", (error) => {
        console.error("Erro no socket:", error)
        this.notifyListeners(SocketEvent.ERROR, error)
      })
    } catch (error) {
      console.error("Erro ao inicializar Socket.io:", error)
      this.reconnectManually()
    }
  }

  private configureEventHandlers(): void {
    if (!this.socket) return

    // Configurar handlers para eventos específicos
    const events = [
      SocketEvent.CHAT_MESSAGE,
      SocketEvent.TICKET_CALLED,
      SocketEvent.TICKET_DIRECTED,
      SocketEvent.GUICHE_STATUS_CHANGED,
      SocketEvent.SYSTEM_BACKUP,
      SocketEvent.SYSTEM_RESTORE,
      SocketEvent.TICKET_CREATED,
      SocketEvent.TICKET_COMPLETED,
      SocketEvent.TICKET_CANCELLED,
      SocketEvent.USER_CONNECTED,
      SocketEvent.USER_DISCONNECTED,
    ]

    events.forEach((event) => {
      this.socket?.on(event, (data) => {
        this.notifyListeners(event, data)
      })
    })
  }

  private enableWebSocket(): void {
    if (!this.socket || !this.socket.connected) return

    try {
      console.log("Tentando habilitar WebSocket...")
      // @ts-ignore - acessando propriedade interna do socket.io
      this.socket.io.engine.transport.on("upgrade", (transport: any) => {
        console.log("Conexão atualizada para:", transport.name)
      })

      // @ts-ignore - acessando propriedade interna do socket.io
      this.socket.io.engine.on("upgrade", () => {
        console.log("Conexão atualizada para WebSocket")
        this.usePollingOnly = false
      })

      // @ts-ignore - acessando propriedade interna do socket.io
      this.socket.io.opts.transports = ["polling", "websocket"]
    } catch (error) {
      console.error("Erro ao habilitar WebSocket:", error)
    }
  }

  private activateFallback(): void {
    console.log("Ativando modo de fallback para comunicação")
    this.useFallback = true
    fallbackService.start()

    toast({
      title: "Modo offline ativado",
      description: "O sistema está operando em modo offline. Algumas funcionalidades podem estar limitadas.",
      variant: "warning",
    })
  }

  private reconnectWithPollingOnly(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    // Reconectar usando apenas polling
    setTimeout(() => {
      this.connect()
    }, 1000)
  }

  private reconnectManually(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Número máximo de tentativas de reconexão atingido")
      toast({
        title: "Falha na conexão",
        description: "Não foi possível conectar ao servidor. O sistema está operando em modo offline.",
        variant: "destructive",
      })
      this.activateFallback()
      return
    }

    this.reconnectAttempts++
    console.log(`Tentativa de reconexão manual ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

    setTimeout(() => {
      this.disconnect()
      this.connect()
    }, this.reconnectInterval)
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  public emit(event: SocketEvent, data: any): void {
    // Se estiver usando fallback, emitir através do fallback
    if (this.useFallback) {
      fallbackService.emit(event, data)
      return
    }

    if (!this.socket || !this.socket.connected) {
      console.warn("Socket não está conectado. Armazenando evento para envio posterior...")
      // Armazenar evento para envio posterior quando reconectar
      this.pendingEvents.push({ event, data })
      return
    }

    try {
      this.socket.emit(event, data)
    } catch (error) {
      console.error(`Erro ao emitir evento ${event}:`, error)
      this.pendingEvents.push({ event, data })
    }
  }

  private sendPendingEvents(): void {
    if (!this.socket || !this.socket.connected || this.pendingEvents.length === 0) return

    console.log(`Enviando ${this.pendingEvents.length} eventos pendentes...`)

    // Criar uma cópia dos eventos pendentes e limpar a lista original
    const events = [...this.pendingEvents]
    this.pendingEvents = []

    // Enviar eventos pendentes
    events.forEach(({ event, data }) => {
      try {
        this.socket?.emit(event, data)
        console.log(`Evento pendente enviado: ${event}`)
      } catch (error) {
        console.error(`Erro ao enviar evento pendente ${event}:`, error)
        this.pendingEvents.push({ event, data })
      }
    })
  }

  public on(event: SocketEvent, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(callback)

    // Se estiver usando fallback, registrar também no fallback
    if (this.useFallback) {
      fallbackService.on(event, callback)
    }
  }

  public off(event: SocketEvent, callback: Function): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.delete(callback)
    }

    // Se estiver usando fallback, remover também do fallback
    if (this.useFallback) {
      fallbackService.off(event, callback)
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

  // Verificar se está conectado
  public isConnected(): boolean {
    return this.socket?.connected || false
  }

  // Obter o ID do socket atual
  public getSocketId(): string | null {
    return this.socket?.id || null
  }

  // Obter o tipo de transporte atual (polling ou websocket)
  public getTransport(): string {
    if (!this.socket) return "none"
    if (this.useFallback) return "fallback"

    try {
      // @ts-ignore - acessando propriedade interna do socket.io
      return this.socket.io.engine.transport.name
    } catch (error) {
      return "unknown"
    }
  }

  // Verificar se está usando fallback
  public isFallbackActive(): boolean {
    return this.useFallback
  }
}

// Função para inicializar o serviço de socket no lado do cliente
export function initSocketService(): SocketService {
  if (typeof window !== "undefined") {
    const socketService = SocketService.getInstance()
    socketService.connect()
    return socketService
  }

  // Retornar uma instância vazia para SSR
  return SocketService.getInstance()
}

// Exportar uma instância singleton
export const socketService = SocketService.getInstance()
