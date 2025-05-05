// Serviço para backup e restauração de dados
import { localStorageService } from "./local-storage-service"
import { realtimeService, RealtimeEvent } from "./realtime-service"
import { toast } from "@/components/ui/use-toast"

export class BackupService {
  private static instance: BackupService
  private autoBackupInterval: NodeJS.Timeout | null = null
  private autoBackupFrequency = 5 * 60 * 1000 // 5 minutos
  private dailyBackupTimeout: NodeJS.Timeout | null = null
  private backupKeys: string[] = [
    "tickets",
    "guiches",
    "chat_messages",
    "usuarios",
    "configuracoes",
    "estatisticas",
    "contadores",
    "historicoAtendimentos",
  ]

  private constructor() {
    // Construtor privado para singleton
  }

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService()
    }
    return BackupService.instance
  }

  // Iniciar backup automático
  public startAutoBackup(): void {
    if (typeof window === "undefined" || this.autoBackupInterval) return

    console.log("Iniciando backup automático a cada 30 segundos")

    this.autoBackupInterval = setInterval(() => {
      this.createBackup("auto")
    }, this.autoBackupFrequency)

    // Configurar backup diário às 23:59
    this.scheduleDailyBackup()
  }

  // Parar backup automático
  public stopAutoBackup(): void {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval)
      this.autoBackupInterval = null
    }

    if (this.dailyBackupTimeout) {
      clearTimeout(this.dailyBackupTimeout)
      this.dailyBackupTimeout = null
    }
  }

  // Agendar backup diário
  private scheduleDailyBackup(): void {
    if (typeof window === "undefined") return

    const now = new Date()
    const night = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0)

    // Se já passou das 23:59, agendar para o próximo dia
    if (now > night) {
      night.setDate(night.getDate() + 1)
    }

    const timeUntilBackup = night.getTime() - now.getTime()

    this.dailyBackupTimeout = setTimeout(() => {
      this.createBackup("daily")
      // Reagendar para o próximo dia
      this.scheduleDailyBackup()
    }, timeUntilBackup)

    console.log(
      `Backup diário agendado para ${night.toLocaleString()}, em ${Math.round(timeUntilBackup / 60000)} minutos`,
    )
  }

  // Criar backup
  public createBackup(type: "manual" | "auto" | "daily"): string | null {
    if (typeof window === "undefined") return null

    try {
      const backup: Record<string, any> = {}

      // Coletar dados de todas as chaves
      this.backupKeys.forEach((key) => {
        backup[key] = localStorageService.loadData(key, null)
      })

      // Adicionar metadados
      const timestamp = new Date().toISOString()
      const backupData = {
        data: backup,
        metadata: {
          timestamp,
          type,
          version: "1.0",
          clientId: realtimeService.getSocketId() || "unknown",
        },
      }

      // Salvar backup
      const backupKey = `backup_${type}_${timestamp.replace(/[:.]/g, "-")}`
      localStorageService.saveData(backupKey, backupData)

      // Notificar sobre o backup
      if (type === "manual") {
        toast({
          title: "Backup criado com sucesso",
          description: `Backup manual criado em ${new Date(timestamp).toLocaleString()}`,
          variant: "default",
        })
      }

      console.log(`Backup ${type} criado: ${backupKey}`)

      // Notificar outros clientes sobre o backup
      if (type !== "auto") {
        realtimeService.emit(RealtimeEvent.SYSTEM_BACKUP, {
          type,
          timestamp,
          size: JSON.stringify(backupData).length,
          clientId: realtimeService.getSocketId(),
        })
      }

      // Limpar backups antigos
      this.cleanupOldBackups(type)

      return backupKey
    } catch (error) {
      console.error("Erro ao criar backup:", error)

      if (type === "manual") {
        toast({
          title: "Erro ao criar backup",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        })
      }

      return null
    }
  }

  // Restaurar backup
  public restoreBackup(backupKey: string): boolean {
    if (typeof window === "undefined") return false

    try {
      const backupData = localStorageService.loadData(backupKey, null)

      if (!backupData || !backupData.data) {
        throw new Error("Backup inválido ou corrompido")
      }

      // Restaurar dados
      Object.entries(backupData.data).forEach(([key, value]) => {
        if (value !== null) {
          localStorageService.saveData(key, value)
        }
      })

      toast({
        title: "Backup restaurado com sucesso",
        description: `Backup de ${new Date(backupData.metadata.timestamp).toLocaleString()} restaurado`,
        variant: "default",
      })

      console.log(`Backup restaurado: ${backupKey}`)

      // Notificar outros clientes sobre a restauração
      realtimeService.emit(RealtimeEvent.SYSTEM_RESTORE, {
        backupKey,
        timestamp: new Date().toISOString(),
      })

      return true
    } catch (error) {
      console.error("Erro ao restaurar backup:", error)

      toast({
        title: "Erro ao restaurar backup",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })

      return false
    }
  }

  // Limpar backups antigos
  private cleanupOldBackups(type: string): void {
    if (typeof window === "undefined") return

    try {
      const keys = localStorageService.getAllKeys()
      const backupPrefix = `backup_${type}_`
      const backupKeys = keys.filter((key) => key.startsWith(backupPrefix))

      // Manter apenas os últimos 10 backups de cada tipo
      if (backupKeys.length > 10) {
        // Ordenar por data (mais antigos primeiro)
        backupKeys.sort()

        // Remover os mais antigos
        const keysToRemove = backupKeys.slice(0, backupKeys.length - 10)
        keysToRemove.forEach((key) => {
          localStorageService.removeData(key)
        })

        console.log(`Removidos ${keysToRemove.length} backups antigos do tipo ${type}`)
      }
    } catch (error) {
      console.error("Erro ao limpar backups antigos:", error)
    }
  }

  // Listar todos os backups disponíveis
  public listBackups(): Array<{
    key: string
    type: string
    timestamp: string
    size: number
  }> {
    if (typeof window === "undefined") return []

    try {
      const keys = localStorageService.getAllKeys()
      const backupKeys = keys.filter((key) => key.startsWith("backup_"))

      return backupKeys
        .map((key) => {
          const backup = localStorageService.loadData(key, null)
          const parts = key.split("_")

          return {
            key,
            type: parts[1] || "unknown",
            timestamp: backup?.metadata?.timestamp || "unknown",
            size: JSON.stringify(backup).length,
          }
        })
        .sort((a, b) => {
          // Ordenar do mais recente para o mais antigo
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        })
    } catch (error) {
      console.error("Erro ao listar backups:", error)
      return []
    }
  }

  // Excluir um backup específico
  public deleteBackup(backupKey: string): boolean {
    if (typeof window === "undefined") return false

    try {
      localStorageService.removeData(backupKey)
      return true
    } catch (error) {
      console.error("Erro ao excluir backup:", error)
      return false
    }
  }
}

// Exportar uma instância singleton
export const backupService = BackupService.getInstance()
