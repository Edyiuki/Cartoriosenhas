"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { initRealtimeService, realtimeService, RealtimeEvent } from "@/lib/realtime-service"
import { backupService } from "@/lib/backup-service"
import { syncService } from "@/lib/sync-service"
import { errorMonitoring } from "@/lib/error-monitoring"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

interface RealtimeProviderProps {
  children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(true) // Assumir conectado inicialmente
  const [showReconnecting, setShowReconnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    // Inicializar serviços
    try {
      // Inicializar monitoramento de erros primeiro
      errorMonitoring.initialize()

      // Inicializar serviço de tempo real
      initRealtimeService()

      // Inicializar backup automático
      backupService.startAutoBackup()

      // Função de inicialização correta
      syncService.initialize()

      console.log("Todos os serviços inicializados com sucesso")
    } catch (error) {
      console.error("Erro ao inicializar serviços:", error)
      toast({
        title: "Erro de inicialização",
        description: "Alguns serviços não puderam ser inicializados corretamente.",
        variant: "destructive",
      })
    }

    // Configurar listeners para status de conexão
    const handleConnect = () => {
      setIsConnected(true)
      setShowReconnecting(false)
      setConnectionError(null)
      setClientId(realtimeService.getClientId())

      // Notificar apenas se reconectando (não na primeira conexão)
      if (sessionStorage.getItem("had_connection") === "true") {
        toast({
          title: "Conexão restabelecida",
          description: "Você está conectado ao servidor novamente.",
          variant: "default",
        })
      }

      sessionStorage.setItem("had_connection", "true")
    }

    const handleDisconnect = () => {
      setIsConnected(false)
      setShowReconnecting(true)

      // Notificar apenas se já teve conexão antes
      if (sessionStorage.getItem("had_connection") === "true") {
        toast({
          title: "Conexão perdida",
          description: "Tentando reconectar automaticamente...",
          variant: "destructive",
        })
      }
    }

    const handleError = (error: any) => {
      setConnectionError(error?.message || "Erro desconhecido")
      errorMonitoring.logError({
        message: error?.message || "Erro de conexão desconhecido",
        source: "realtime-service",
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
    }

    realtimeService.on(RealtimeEvent.CONNECT, handleConnect)
    realtimeService.on(RealtimeEvent.DISCONNECT, handleDisconnect)
    realtimeService.on(RealtimeEvent.ERROR, handleError)

    // Verificar status inicial
    setIsConnected(realtimeService.isConnected())
    setClientId(realtimeService.getClientId())
    if (realtimeService.isConnected()) {
      sessionStorage.setItem("had_connection", "true")
    }

    return () => {
      realtimeService.off(RealtimeEvent.CONNECT, handleConnect)
      realtimeService.off(RealtimeEvent.DISCONNECT, handleDisconnect)
      realtimeService.off(RealtimeEvent.ERROR, handleError)
    }
  }, [])

  const handleReconnect = () => {
    realtimeService.disconnect()
    realtimeService.connect()
    setShowReconnecting(true)
    setConnectionError(null)
  }

  return (
    <>
      {children}

      {/* Alerta de reconexão */}
      {showReconnecting && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert variant="destructive" className="w-72">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              Desconectado
            </AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>Tentando reconectar ao servidor...</span>
              <Button variant="outline" size="sm" className="w-full" onClick={handleReconnect}>
                <RefreshCw className="h-3 w-3 mr-2" />
                Reconectar manualmente
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Indicador de status de conexão */}
      <div className="fixed bottom-4 left-4 z-50">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
            isConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>Conectado</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>Desconectado</span>
            </>
          )}
        </div>
      </div>
    </>
  )
}
