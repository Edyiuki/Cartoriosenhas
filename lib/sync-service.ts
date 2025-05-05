// Serviço de sincronização para garantir que o sistema funcione em modo multiusuário
import { realtimeService, RealtimeEvent } from "./realtime-service"
import { backupService } from "./backup-service"
import { localStorageService } from "./local-storage-service"

// Tipos de eventos de sincronização
export enum SyncEvent {
  DATA_UPDATED = "sync:data-updated",
  DATA_REQUESTED = "sync:data-requested",
  DATA_RESPONSE = "sync:data-response",
  PEER_CONNECTED = "sync:peer-connected",
  PEER_DISCONNECTED = "sync:peer-disconnected",
}

// Classe para gerenciar a sincronização entre múltiplos usuários
class SyncService {
  private static instance: SyncService
  private isInitialized = false
  private lastSyncTimestamp = 0
  private syncInterval: NodeJS.Timeout | null = null
  private connectedPeers: Set<string> = new Set()

  private constructor() {
    // Construtor privado para singleton
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  public initialize(): void {
    if (this.isInitialized || typeof window === "undefined") return

    console.log("Inicializando serviço de sincronização...")

    // Configurar listeners para eventos de sincronização
    realtimeService.on(SyncEvent.DATA_UPDATED, this.handleDataUpdated)
    realtimeService.on(SyncEvent.DATA_REQUESTED, this.handleDataRequested)
    realtimeService.on(SyncEvent.DATA_RESPONSE, this.handleDataResponse)
    realtimeService.on(SyncEvent.PEER_CONNECTED, this.handlePeerConnected)
    realtimeService.on(SyncEvent.PEER_DISCONNECTED, this.handlePeerDisconnected)
    realtimeService.on(RealtimeEvent.CONNECT, this.handleConnect)
    realtimeService.on(RealtimeEvent.DISCONNECT, this.handleDisconnect)

    // Iniciar intervalo de sincronização
    this.syncInterval = setInterval(() => {
      this.checkForUpdates()
    }, 60000) // Verificar atualizações a cada minuto

    this.isInitialized = true

    // Anunciar conexão para outros peers
    this.announceConnection()

    // Solicitar dados atualizados ao se conectar
    this.requestLatestData()
  }

  public shutdown(): void {
    if (!this.isInitialized) return

    // Remover listeners
    realtimeService.off(SyncEvent.DATA_UPDATED, this.handleDataUpdated)
    realtimeService.off(SyncEvent.DATA_REQUESTED, this.handleDataRequested)
    realtimeService.off(SyncEvent.DATA_RESPONSE, this.handleDataResponse)
    realtimeService.off(SyncEvent.PEER_CONNECTED, this.handlePeerConnected)
    realtimeService.off(SyncEvent.PEER_DISCONNECTED, this.handlePeerDisconnected)
    realtimeService.off(RealtimeEvent.CONNECT, this.handleConnect)
    realtimeService.off(RealtimeEvent.DISCONNECT, this.handleDisconnect)

    // Parar intervalo de sincronização
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    this.isInitialized = false
  }

  private handleConnect = () => {
    // Anunciar conexão para outros peers
    this.announceConnection()

    // Solicitar dados atualizados ao se conectar
    this.requestLatestData()
  }

  private handleDisconnect = () => {
    // Limpar lista de peers conectados
    this.connectedPeers.clear()
  }

  private announceConnection = () => {
    realtimeService.emit(SyncEvent.PEER_CONNECTED, {
      clientId: realtimeService.getClientId(),
      timestamp: Date.now(),
    })
  }

  private handlePeerConnected = (data: any) => {
    if (data.clientId !== realtimeService.getClientId()) {
      console.log(`Peer conectado: ${data.clientId}`)
      this.connectedPeers.add(data.clientId)
    }
  }

  private handlePeerDisconnected = (data: any) => {
    if (data.clientId !== realtimeService.getClientId()) {
      console.log(`Peer desconectado: ${data.clientId}`)
      this.connectedPeers.delete(data.clientId)
    }
  }

  private requestLatestData = () => {
    realtimeService.emit(SyncEvent.DATA_REQUESTED, {
      clientId: realtimeService.getClientId(),
      timestamp: Date.now(),
    })
  }

  private handleDataRequested = (data: any) => {
    if (data.clientId === realtimeService.getClientId()) return

    // Enviar dados atuais para o peer que solicitou
    const currentData = this.getCurrentData()
    realtimeService.emit(SyncEvent.DATA_RESPONSE, {
      clientId: realtimeService.getClientId(),
      targetClientId: data.clientId,
      timestamp: Date.now(),
      data: currentData,
    })
  }

  private handleDataResponse = (data: any) => {
    if (data.clientId === realtimeService.getClientId() || data.targetClientId !== realtimeService.getClientId()) return

    // Verificar se os dados recebidos são mais recentes
    if (data.timestamp > this.lastSyncTimestamp) {
      console.log("Recebendo dados atualizados de outro peer")
      this.updateLocalData(data.data)
      this.lastSyncTimestamp = data.timestamp
    }
  }

  private handleDataUpdated = (data: any) => {
    if (data.clientId === realtimeService.getClientId()) return

    // Atualizar dados locais com os dados recebidos
    console.log("Recebendo atualização de dados de outro peer")
    this.updateLocalData(data.data)
    this.lastSyncTimestamp = data.timestamp
  }

  private checkForUpdates = () => {
    // Verificar se há atualizações de dados
    const currentTimestamp = Date.now()
    if (currentTimestamp - this.lastSyncTimestamp > 60000) {
      // Se passou mais de 1 minuto desde a última sincronização
      this.requestLatestData()
    }
  }

  private getCurrentData = () => {
    // Obter todos os dados relevantes do localStorage
    return {
      tickets: localStorageService.getItem("tickets") || [],
      guiches: localStorageService.getItem("guiches") || [],
      users: localStorageService.getItem("users") || [],
      settings: localStorageService.getItem("settings") || {},
      stats: localStorageService.getItem("stats") || {},
    }
  }

  private updateLocalData = (data: any) => {
    // Atualizar dados locais com os dados recebidos
    if (data.tickets) localStorageService.setItem("tickets", data.tickets)
    if (data.guiches) localStorageService.setItem("guiches", data.guiches)
    if (data.users) localStorageService.setItem("users", data.users)
    if (data.settings) localStorageService.setItem("settings", data.settings)
    if (data.stats) localStorageService.setItem("stats", data.stats)

    // Criar um backup após receber dados atualizados
    backupService.createBackup("sync")
  }

  public broadcastDataUpdate = () => {
    // Enviar atualização de dados para todos os peers
    const currentData = this.getCurrentData()
    realtimeService.emit(SyncEvent.DATA_UPDATED, {
      clientId: realtimeService.getClientId(),
      timestamp: Date.now(),
      data: currentData,
    })
  }

  public getConnectedPeersCount = (): number => {
    return this.connectedPeers.size
  }

  public isActive = (): boolean => {
    return this.isInitialized
  }
}

// Exportar uma instância singleton
export const syncService = SyncService.getInstance()
