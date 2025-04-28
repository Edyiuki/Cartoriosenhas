"use client"

import type React from "react"

import { useEffect, useState, createContext, useContext } from "react"
import { realtimeService, ConnectionStatus } from "@/lib/realtime-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

// Criar contexto para o serviço de tempo real
const RealtimeContext = createContext<{
  isConnected: boolean
  connectionStatus: ConnectionStatus
  reconnect: () => void
}>({
  isConnected: false,
  connectionStatus: ConnectionStatus.DISCONNECTED,
  reconnect: () => {},
})

// Hook para usar o contexto de tempo real
export function useRealtime() {
  return useContext(RealtimeContext)
}

// Hook para compatibilidade com código existente
export function useSocket() {
  const realtime = useRealtime()
  return {
    socket: {
      on: realtimeService.on.bind(realtimeService),
      off: realtimeService.off.bind(realtimeService),
      emit: realtimeService.emit.bind(realtimeService),
      connected: realtime.isConnected,
    },
    isConnected: realtime.isConnected,
  }
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED)
  const [showReconnecting, setShowReconnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    // Configurar listeners para status de conexão
    const handleStatusChange = (status: ConnectionStatus) => {
      setConnectionStatus(status)
      setIsConnected(status === ConnectionStatus.CONNECTED)
      setShowReconnecting(status === ConnectionStatus.CONNECTING || status === ConnectionStatus.RECONNECTING)
      setConnectionError(status === ConnectionStatus.ERROR ? "Erro de conexão" : null)
    }

    realtimeService.onStatusChange(handleStatusChange)

    // Iniciar conexão
    realtimeService.connect()

    return () => {
      realtimeService.offStatusChange(handleStatusChange)
    }
  }, [])

  const handleReconnect = () => {
    realtimeService.reconnect()
    setShowReconnecting(true)
    setConnectionError(null)
  }

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        connectionStatus,
        reconnect: handleReconnect,
      }}
    >
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
    </RealtimeContext.Provider>
  )
}
