"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Users, Database, Clock } from "lucide-react"
import { syncService } from "@/lib/sync-service"
import { backupService } from "@/lib/backup-service"
import { toast } from "@/components/ui/use-toast"

export function SyncStatusPanel() {
  const [connectedPeers, setConnectedPeers] = useState(0)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)

  // Função para formatar data
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // Função para forçar sincronização
  const forceSyncData = () => {
    syncService.broadcastDataUpdate()
    toast({
      title: "Sincronização iniciada",
      description: "Os dados estão sendo sincronizados com outros dispositivos.",
    })
  }

  // Função para criar backup manual
  const createManualBackup = async () => {
    const backupKey = await backupService.createBackup("manual")
    if (backupKey) {
      const lastBackupInfo = backupService.getLastBackup()
      if (lastBackupInfo) {
        setLastBackup(formatDate(lastBackupInfo.timestamp))
      }
    }
  }

  // Efeito para atualizar informações
  useEffect(() => {
    const updateInfo = () => {
      setConnectedPeers(syncService.getConnectedPeersCount())
      setIsActive(syncService.isActive())

      const lastBackupInfo = backupService.getLastBackup()
      if (lastBackupInfo) {
        setLastBackup(formatDate(lastBackupInfo.timestamp))
      }
    }

    // Atualizar informações iniciais
    updateInfo()

    // Configurar intervalo para atualizar informações
    const interval = setInterval(updateInfo, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Status de Sincronização
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Dispositivos conectados:</span>
            </div>
            <Badge variant={connectedPeers > 0 ? "default" : "outline"}>{connectedPeers}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Status de sincronização:</span>
            </div>
            <Badge variant={isActive ? "default" : "destructive"}>{isActive ? "Ativo" : "Inativo"}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Último backup:</span>
            </div>
            <span className="text-sm text-gray-500">{lastBackup || "Nenhum backup encontrado"}</span>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={forceSyncData} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar Agora
            </Button>
            <Button variant="outline" size="sm" onClick={createManualBackup} className="flex-1">
              <Database className="h-4 w-4 mr-2" />
              Criar Backup
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
