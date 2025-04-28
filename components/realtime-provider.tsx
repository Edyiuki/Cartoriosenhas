"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { initRealtimeService, realtimeService, RealtimeEvent } from "@/lib/realtime-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true) // Assumir conectado inicialmente
  const [showReconnecting, setShowReconnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    // Inicializar o serviço de tempo real
    initRealtimeService()

    // Configurar listeners para status de conexão
    const handleConnect = () => {
      setIsConnected(true)
      setShowReconnecting(false)
      setConnectionError(null)
      setClientId(realtimeService.getClientId())
    }

    const handleDisconnect = () => {
      setIsConnected(false)
      setShowReconnecting(true)
    }

    const handleError = (error: any) => {
      setConnectionError(error?.message || "Erro desconhecido")
    }

    realtimeService.on(RealtimeEvent.CONNECT, handleConnect)
    realtimeService.on(RealtimeEvent.DISCONNECT, handleDisconnect)
    realtimeService.on(RealtimeEvent.ERROR, handleError)

    // Verificar status inicial
    setIsConnected(realtimeService.isConnected())
    setClientId(realtimeService.getClientId())

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
