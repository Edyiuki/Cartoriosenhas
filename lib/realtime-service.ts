// Serviço de comunicação em tempo real simplificado
// Esta implementação usa localStorage para comunicação entre abas
// e não depende de Socket.io ou outras bibliotecas externas

// Tipos de eventos
export enum RealtimeEvent {
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

// Classe para gerenciar a comunicação em tempo real
class RealtimeService {
  private static instance: RealtimeService
  private listeners: Map<string, Set<Function>> = new Map()
  private clientId: string = this.generateClientId()
  private pollingInterval: NodeJS.Timeout | null = null
  private pollingFrequency = 1000 // 1 segundo
  private lastEventId = 0
  private isInitialized = false
  private storageKey = "realtime_events"

  private constructor() {
    // Construtor privado para singleton
  }

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService()
    }
    return RealtimeService.instance
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  public connect(): void {
    if (typeof window === "undefined" || this.pollingInterval) return

    console.log("Iniciando serviço de tempo real...")

    // Configurar listener para eventos de storage
    window.addEventListener("storage", this.handleStorageEvent)

    // Iniciar polling para verificar novos eventos
    this.pollingInterval = setInterval(() => {
      this.checkForNewEvents()
    }, this.pollingFrequency)

    // Notificar que está conectado
    this.notifyListeners(RealtimeEvent.CONNECT, { clientId: this.clientId })

    this.isInitialized = true
  }

  public disconnect(): void {
    if (typeof window === "undefined") return

    // Remover listener para eventos de storage
    window.removeEventListener("storage", this.handleStorageEvent)

    // Parar polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }

    // Notificar que está desconectado
    this.notifyListeners(RealtimeEvent.DISCONNECT, { clientId: this.clientId })
  }

  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key !== this.storageKey) return

    try {
      const events = JSON.parse(event.newValue || "[]")
      this.processEvents(events)
    } catch (error) {
      console.error("Erro ao processar eventos de storage:", error)
    }
  }

  private checkForNewEvents(): void {
    if (typeof window === "undefined") return

    try {
      const eventsJson = localStorage.getItem(this.storageKey)
      if (!eventsJson) return

      const events = JSON.parse(eventsJson)
      this.processEvents(events)
    } catch (error) {
      console.error("Erro ao verificar novos eventos:", error)
    }
  }

  private processEvents(events: any[]): void {
    if (!Array.isArray(events)) return

    // Processar apenas eventos novos
    const newEvents = events.filter((event) => event.id > this.lastEventId)

    if (newEvents.length === 0) return

    // Atualizar último ID de evento
    this.lastEventId = Math.max(...newEvents.map((event) => event.id))

    // Notificar listeners
    newEvents.forEach((event) => {
      if (event.clientId !== this.clientId) {
        // Não processar eventos emitidos por este cliente
        this.notifyListeners(event.event, event.data)
      }
    })
  }

  public emit(event: RealtimeEvent, data: any): void {
    if (typeof window === "undefined") return

    try {
      // Obter eventos existentes
      const eventsJson = localStorage.getItem(this.storageKey)
      const events = eventsJson ? JSON.parse(eventsJson) : []

      // Adicionar novo evento
      const newEvent = {
        id: Date.now(),
        event,
        data,
        clientId: this.clientId,
        timestamp: new Date().toISOString(),
      }

      events.push(newEvent)

      // Limitar a 100 eventos para evitar problemas de armazenamento
      if (events.length > 100) {
        events.splice(0, events.length - 100)
      }

      // Salvar eventos
      localStorage.setItem(this.storageKey, JSON.stringify(events))

      // Notificar listeners locais
      this.notifyListeners(event, data)
    } catch (error) {
      console.error("Erro ao emitir evento:", error)
    }
  }

  public on(event: RealtimeEvent, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(callback)
  }

  public off(event: RealtimeEvent, callback: Function): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.delete(callback)
    }
  }

  private notifyListeners(event: RealtimeEvent, data: any): void {
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
    return this.pollingInterval !== null
  }

  // Obter o ID do cliente
  public getClientId(): string {
    return this.clientId
  }
}

// Função para inicializar o serviço de tempo real no lado do cliente
export function initRealtimeService(): RealtimeService {
  if (typeof window !== "undefined") {
    const realtimeService = RealtimeService.getInstance()
    realtimeService.connect()
    return realtimeService
  }

  // Retornar uma instância vazia para SSR
  return RealtimeService.getInstance()
}

// Exportar uma instância singleton
export const realtimeService = RealtimeService.getInstance()
