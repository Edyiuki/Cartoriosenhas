"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { backupService } from "@/lib/backup-service"
import { toast } from "@/components/ui/use-toast"
import { Download, Trash2, RefreshCw, Database, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export function BackupControlPanel() {
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false)
  const [backups, setBackups] = useState<
    Array<{
      key: string
      type: string
      timestamp: string
      size: number
    }>
  >([])
  const [isLoading, setIsLoading] = useState(false)

  // Carregar backups disponíveis
  const loadBackups = () => {
    setBackups(backupService.listBackups())
  }

  useEffect(() => {
    // Inicializar
    loadBackups()

    // Verificar a cada 30 segundos para atualizar a lista
    const interval = setInterval(loadBackups, 30000)

    return () => clearInterval(interval)
  }, [])

  // Alternar backup automático
  const toggleAutoBackup = () => {
    if (autoBackupEnabled) {
      backupService.stopAutoBackup()
      toast({
        title: "Backup automático desativado",
        description: "O sistema não fará mais backups automáticos.",
        variant: "default",
      })
    } else {
      backupService.startAutoBackup()
      toast({
        title: "Backup automático ativado",
        description: "O sistema fará backups automáticos a cada 30 segundos e um backup diário às 23:59.",
        variant: "default",
      })
    }

    setAutoBackupEnabled(!autoBackupEnabled)
  }

  // Criar backup manual
  const createManualBackup = () => {
    setIsLoading(true)

    try {
      backupService.createBackup("manual")
      loadBackups()
    } finally {
      setIsLoading(false)
    }
  }

  // Restaurar backup
  const restoreBackup = (backupKey: string) => {
    if (window.confirm("Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos.")) {
      setIsLoading(true)

      try {
        backupService.restoreBackup(backupKey)
        loadBackups()
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Excluir backup
  const deleteBackup = (backupKey: string) => {
    if (window.confirm("Tem certeza que deseja excluir este backup?")) {
      setIsLoading(true)

      try {
        backupService.deleteBackup(backupKey)
        loadBackups()

        toast({
          title: "Backup excluído",
          description: "O backup foi excluído com sucesso.",
          variant: "default",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Formatar o tipo de backup
  const formatBackupType = (type: string) => {
    switch (type) {
      case "manual":
        return "Manual"
      case "auto":
        return "Automático"
      case "daily":
        return "Diário"
      default:
        return type
    }
  }

  // Formatar o tamanho do backup
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Controle de Backup
        </CardTitle>
        <CardDescription>Gerencie os backups do sistema para evitar perda de dados</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch id="auto-backup" checked={autoBackupEnabled} onCheckedChange={toggleAutoBackup} />
            <Label htmlFor="auto-backup">Backup automático</Label>
          </div>

          <Button variant="outline" size="sm" onClick={createManualBackup} disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
            Criar backup agora
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    Nenhum backup encontrado
                  </TableCell>
                </TableRow>
              ) : (
                backups.map((backup) => (
                  <TableRow key={backup.key}>
                    <TableCell>
                      {new Date(backup.timestamp).toLocaleString()}
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(backup.timestamp), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{formatBackupType(backup.type)}</TableCell>
                    <TableCell>{formatSize(backup.size)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => restoreBackup(backup.key)}
                        title="Restaurar backup"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteBackup(backup.key)}
                        title="Excluir backup"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        Os backups são armazenados localmente no navegador. Recomendamos exportar backups importantes.
      </CardFooter>
    </Card>
  )
}
