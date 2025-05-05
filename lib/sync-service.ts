// Serviço de sincronização aprimorado para resolver conflitos de dados
import { realtimeService, RealtimeEvent } from "./realtime-service"
import { backupService } from "./backup-service"
import { localStorageService } from "./local-storage-service"
import { toast } from "@/components/ui/use-toast"

// Tipos de eventos de sincronização
export enum SyncEvent {
  REQUEST_SYNC = "sync:request",
  PROVIDE_SYNC = "sync:provide",
  SYNC_COMPLETE = "sync:complete",
  SYNC_ERROR = "sync:error",
  DATA_CHANGED = "sync:data-changed",
  PEER_CONNECTED = "sync:peer-connected",
  PEER_DISCONNECTED = "sync:peer-disconnected",
}

// Interface para metadados de sincronização
interface SyncMetadata {
  version: number
  timestamp: number
  clientId: string
}

// Classe para gerenciar a sincronização de dados
class SyncService {
  private static instance: SyncService
  private isInitialized = false
  private syncInProgress = false
  private lastSyncTime = 0
  private syncInterval: NodeJS.Timeout | null = null
  private syncIntervalTime = 5 * 60 * 1000 // 5 minutos
  private dataKeys = [
    "tickets",
    "guiches",
    "contadores",
    "historicoAtendimentos",
    "chat_messages",
    "usuarios",
    "configuracoes",
  ]
  private clientId = ""
  private connectedPeers: Set<string> = new Set() // Rastrear peers conectados

  private constructor() {
    // Construtor privado para singleton
    if (typeof window !== "undefined") {
      this.clientId = this.generateClientId()
    }
  }

  private generateClientId(): string {
    // Gerar ID único para este cliente
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  public initialize(): void {
    if (this.isInitialized || typeof window === "undefined") return

    console.log("Inicializando serviço de sincronização")

    // Configurar listeners para eventos de sincronização
    realtimeService.on(RealtimeEvent.CONNECT, this.handleConnect.bind(this))
    realtimeService.on(SyncEvent.REQUEST_SYNC, this.handleSyncRequest.bind(this))
    realtimeService.on(SyncEvent.PROVIDE_SYNC, this.handleSyncData.bind(this))
    realtimeService.on(SyncEvent.SYNC_ERROR, this.handleSyncError.bind(this))
    realtimeService.on(SyncEvent.DATA_CHANGED, this.handleDataChanged.bind(this))
    realtimeService.on(SyncEvent.PEER_CONNECTED, this.handlePeerConnected.bind(this))
    realtimeService.on(SyncEvent.PEER_DISCONNECTED, this.handlePeerDisconnected.bind(this))

    // Iniciar verificação periódica de sincronização
    this.syncInterval = setInterval(() => {
      this.checkAndRequestSync()
    }, this.syncIntervalTime)

    // Anunciar conexão para outros peers
    this.announceConnection()

    this.isInitialized = true
  }

  public shutdown(): void {
    if (!this.isInitialized) return

    // Remover listeners
    realtimeService.off(RealtimeEvent.CONNECT, this.handleConnect.bind(this))
    realtimeService.off(SyncEvent.REQUEST_SYNC, this.handleSyncRequest.bind(this))
    realtimeService.off(SyncEvent.PROVIDE_SYNC, this.handleSyncData.bind(this))
    realtimeService.off(SyncEvent.SYNC_ERROR, this.handleSyncError.bind(this))
    realtimeService.off(SyncEvent.DATA_CHANGED, this.handleDataChanged.bind(this))
    realtimeService.off(SyncEvent.PEER_CONNECTED, this.handlePeerConnected.bind(this))
    realtimeService.off(SyncEvent.PEER_DISCONNECTED, this.handlePeerDisconnected.bind(this))

    // Parar intervalo de sincronização
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    this.isInitialized = false
  }

  // Manipular evento de conexão
  private handleConnect(): void {
    // Ao conectar, verificar se precisa sincronizar
    setTimeout(() => {
      this.requestSync()
      // Anunciar conexão para outros peers
      this.announceConnection()
    }, 2000) // Aguardar 2 segundos para garantir que a conexão está estável
  }

  // Anunciar conexão para outros peers
  private announceConnection(): void {
    if (!realtimeService.isConnected()) return

    realtimeService.emit(SyncEvent.PEER_CONNECTED, {
      clientId: this.clientId,
      timestamp: Date.now(),
    })
  }

  // Manipular conexão de peer
  private handlePeerConnected(data: any): void {
    if (data.clientId === this.clientId) return

    console.log(`Peer conectado: ${data.clientId}`)
    this.connectedPeers.add(data.clientId)

    // Responder anunciando nossa presença
    realtimeService.emit(SyncEvent.PEER_CONNECTED, {
      clientId: this.clientId,
      timestamp: Date.now(),
      isResponse: true,
    })
  }

  // Manipular desconexão de peer
  private handlePeerDisconnected(data: any): void {
    if (data.clientId === this.clientId) return

    console.log(`Peer desconectado: ${data.clientId}`)
    this.connectedPeers.delete(data.clientId)
  }

  // Verificar se é necessário sincronizar e solicitar sincronização
  private checkAndRequestSync(): void {
    if (this.syncInProgress) return

    const now = Date.now()
    if (now - this.lastSyncTime > this.syncIntervalTime) {
      this.requestSync()
    }
  }

  // Solicitar sincronização de dados
  public requestSync(): void {
    if (this.syncInProgress || !realtimeService.isConnected()) return

    console.log("Solicitando sincronização de dados")
    this.syncInProgress = true

    // Enviar solicitação de sincronização
    realtimeService.emit(SyncEvent.REQUEST_SYNC, {
      clientId: this.clientId,
      timestamp: Date.now(),
    })

    // Definir timeout para caso não receba resposta
    setTimeout(() => {
      if (this.syncInProgress) {
        console.log("Timeout na sincronização")
        this.syncInProgress = false
      }
    }, 10000) // 10 segundos de timeout
  }

  // Manipular solicitação de sincronização
  private handleSyncRequest(data: any): void {
    if (!realtimeService.isConnected()) return

    // Verificar se a solicitação não é do próprio cliente
    if (data.clientId === this.clientId) return

    console.log("Recebida solicitação de sincronização de", data.clientId)

    // Coletar dados para sincronização
    this.collectDataAndRespond(data.clientId)
  }

  // Coletar dados e responder à solicitação de sincronização
  private async collectDataAndRespond(requestClientId: string): Promise<void> {
    try {
      const syncData: Record<string, any> = {}
      const syncMetadata: Record<string, SyncMetadata> = {}

      // Coletar dados e metadados para cada chave
      for (const key of this.dataKeys) {
        // Usar loadData em vez de getItem
        const data = await localStorageService.loadData(key, null)
        if (data) {
          syncData[key] = data

          // Obter metadados de sincronização
          const metadataKey = `${key}_metadata`
          // Usar loadData em vez de getItem
          const metadata = await localStorageService.loadData<SyncMetadata>(metadataKey, {
            version: 1,
            timestamp: Date.now(),
            clientId: this.clientId,
          })

          syncMetadata[key] = metadata
        }
      }

      // Enviar dados para o cliente que solicitou
      realtimeService.emit(SyncEvent.PROVIDE_SYNC, {
        clientId: requestClientId,
        providerId: this.clientId,
        timestamp: Date.now(),
        data: syncData,
        metadata: syncMetadata,
      })
    } catch (error) {
      console.error("Erro ao coletar dados para sincronização:", error)

      // Notificar erro
      realtimeService.emit(SyncEvent.SYNC_ERROR, {
        clientId: requestClientId,
        error: "Erro ao coletar dados para sincronização",
        timestamp: Date.now(),
      })
    }
  }

  // Manipular dados de sincronização recebidos
  private async handleSyncData(data: any): Promise<void> {
    // Verificar se os dados são para este cliente
    if (data.clientId !== this.clientId) return

    console.log("Recebidos dados de sincronização de", data.providerId)

    try {
      // Verificar se há dados para sincronizar
      if (!data.data || !data.metadata) {
        throw new Error("Dados de sincronização inválidos")
      }

      // Mesclar dados recebidos com dados locais
      await this.mergeData(data.data, data.metadata)

      // Atualizar timestamp da última sincronização
      this.lastSyncTime = Date.now()
      this.syncInProgress = false

      // Notificar que a sincronização foi concluída
      toast({
        title: "Sincronização concluída",
        description: "Os dados foram sincronizados com sucesso",
        variant: "default",
      })

      console.log("Sincronização concluída com sucesso")
    } catch (error) {
      console.error("Erro ao processar dados de sincronização:", error)
      this.syncInProgress = false

      // Notificar erro de sincronização
      toast({
        title: "Erro de sincronização",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    }
  }

  // Mesclar dados recebidos com dados locais
  private async mergeData(
    receivedData: Record<string, any>,
    receivedMetadata: Record<string, SyncMetadata>,
  ): Promise<void> {
    // Para cada tipo de dado
    for (const key of Object.keys(receivedData)) {
      if (!receivedData[key]) continue

      try {
        // Obter dados e metadados locais
        // Usar loadData em vez de getItem
        const localData = await localStorageService.loadData(key, null)
        const metadataKey = `${key}_metadata`
        // Usar loadData em vez de getItem
        const localMetadata = await localStorageService.loadData<SyncMetadata>(metadataKey, {
          version: 0,
          timestamp: 0,
          clientId: this.clientId,
        })

        // Verificar se os dados recebidos são mais recentes
        if (this.isNewerData(receivedMetadata[key], localMetadata)) {
          console.log(`Atualizando dados de ${key} com versão mais recente`)

          // Salvar dados recebidos
          // Usar saveData em vez de setItem
          await localStorageService.saveData(key, receivedData[key])

          // Atualizar metadados
          // Usar saveData em vez de setItem
          await localStorageService.saveData(metadataKey, {
            version: receivedMetadata[key].version,
            timestamp: Date.now(),
            clientId: this.clientId,
          })
        } else {
          console.log(`Mantendo dados locais de ${key} (versão mais recente)`)
        }
      } catch (error) {
        console.error(`Erro ao mesclar dados de ${key}:`, error)
      }
    }

    // Criar backup após sincronização
    backupService.createBackup("sync")
  }

  // Verificar se os dados recebidos são mais recentes
  private isNewerData(received: SyncMetadata, local: SyncMetadata): boolean {
    // Verificar versão primeiro
    if (received.version > local.version) {
      return true
    } else if (received.version < local.version) {
      return false
    }

    // Se versões iguais, verificar timestamp
    return received.timestamp > local.timestamp
  }

  // Manipular mudanças de dados
  private handleDataChanged(data: any): void {
    if (data.clientId === this.clientId) return

    console.log(`Recebida notificação de alteração de dados para ${data.key}`)

    // Solicitar sincronização para obter os dados atualizados
    this.requestSync()
  }

  // Manipular erro de sincronização
  private handleSyncError(data: any): void {
    console.error("Erro de sincronização:", data)
    this.syncInProgress = false

    // Notificar usuário sobre o erro
    if (data.clientId === this.clientId) {
      toast({
        title: "Erro de sincronização",
        description: data.error || "Ocorreu um erro ao sincronizar os dados",
        variant: "destructive",
      })
    }
  }

  // Notificar outros clientes sobre mudanças de dados
  public notifyDataChanged(key: string): void {
    if (!realtimeService.isConnected()) return

    realtimeService.emit(SyncEvent.DATA_CHANGED, {
      clientId: this.clientId,
      key,
      timestamp: Date.now(),
    })
  }

  // Forçar sincronização manual
  public forceSyncNow(): void {
    this.syncInProgress = false
    this.requestSync()
  }

  // Verificar se a sincronização está em andamento
  public isSyncing(): boolean {
    return this.syncInProgress
  }

  // Obter timestamp da última sincronização
  public getLastSyncTime(): number {
    return this.lastSyncTime
  }

  // Obter ID do cliente
  public getClientId(): string {
    return this.clientId
  }

  // Métodos necessários para o painel de status de sincronização
  public getConnectedPeersCount(): number {
    return this.connectedPeers.size
  }

  public isActive(): boolean {
    return this.isInitialized
  }

  public broadcastDataUpdate(): void {
    // Notificar mudanças em todas as chaves de dados
    for (const key of this.dataKeys) {
      this.notifyDataChanged(key)
    }

    // Solicitar sincronização imediata
    this.forceSyncNow()
  }
}

// Exportar uma instância singleton
export const syncService = SyncService.getInstance()
