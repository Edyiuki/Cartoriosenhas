// Tipos de eventos do sistema
export enum RealtimeEvent {
  // Eventos de senhas
  TICKET_CREATED = "ticket-created",
  TICKET_CALLED = "ticket-called",
  TICKET_DIRECTED = "ticket-directed",
  TICKET_COMPLETED = "ticket-completed",
  TICKET_CANCELLED = "ticket-cancelled",

  // Eventos de guichês
  GUICHE_STATUS_CHANGED = "guiche-status-changed",
  GUICHES_UPDATED = "guiches-updated",

  // Eventos de sistema
  SYSTEM_BACKUP = "system-backup",
  SYSTEM_RESTORE = "system-restore",
  CONNECTION_STATUS = "connection-status",
  CHAT_MESSAGE = "chat-message",
}

// Status de conexão
export enum ConnectionStatus {
  CONNECTED = "connected",
  CONNECTING = "connecting",
  RECONNECTING = "reconnecting",
  DISCONNECTED = "disconnected",
  ERROR = "error",
}

// Classe para gerenciar eventos em tempo real
class RealtimeService {
  private static instance: RealtimeService
  private clientId: string | null = null

  private constructor() {
    // Construtor privado para singleton
  }

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService()
    }
    return RealtimeService.instance
  }

  public connect(): void {
    this.clientId = Math.random().toString(36).substring(2, 15)
  }

  public disconnect(): void {
    // Placeholder
  }

  public on(event: string, callback: Function): void {
    // Placeholder
  }

  public off(event: string, callback: Function): void {
    // Placeholder
  }

  public emit(event: string, data: any): void {
    // Placeholder
  }

  public onStatusChange(callback: Function): void {
    // Placeholder
  }

  public offStatusChange(callback: Function): void {
    // Placeholder
  }

  public isConnected(): boolean {
    return false // Placeholder
  }

  public getClientId(): string | null {
    return this.clientId
  }
}

// Criar instância única do serviço
export const realtimeService = RealtimeService.getInstance()

// Função para inicializar o serviço de tempo real
export function initRealtimeService(): RealtimeService {
  return realtimeService
}
