"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { initSocketService, socketService, SocketEvent } from "@/lib/socket-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [showReconnecting, setShowReconnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [transport, setTransport] = useState<string>("none")
  const [socketId, setSocketId] = useState<string | null>(null)

  useEffect(() => {
    // Inicializar o serviço de socket
    initSocketService()

    // Configurar listeners para status de conexão
    const handleConnect = () => {
      setIsConnected(true)
      setShowReconnecting(false)
      setConnectionError(null)
      setSocketId(socketService.getSocketId())

      // Atualizar informações de transporte a cada segundo
      const intervalId = setInterval(() => {
        setTransport(socketService.getTransport())
      }, 1000)

      return () => clearInterval(intervalId)
    }

    const handleDisconnect = () => {
      setIsConnected(false)
      setShowReconnecting(true)
      setTransport("none")
    }

    const handleError = (error: any) => {
      setConnectionError(error?.message || "Erro desconhecido")
    }

    socketService.on(SocketEvent.CONNECT, handleConnect)
    socketService.on(SocketEvent.DISCONNECT, handleDisconnect)
    socketService.on(SocketEvent.ERROR, handleError)

    // Verificar status inicial
    setIsConnected(socketService.isConnected())
    if (socketService.isConnected()) {
      setSocketId(socketService.getSocketId())
      setTransport(socketService.getTransport())
    }

    // Atualizar informações de transporte a cada segundo se conectado
    const intervalId = setInterval(() => {
      if (socketService.isConnected()) {
        setTransport(socketService.getTransport())
      }
    }, 1000)

    return () => {
      socketService.off(SocketEvent.CONNECT, handleConnect)
      socketService.off(SocketEvent.DISCONNECT, handleDisconnect)
      socketService.off(SocketEvent.ERROR, handleError)
      clearInterval(intervalId)
    }
  }, [])

  const handleReconnect = () => {
    socketService.disconnect()
    socketService.connect()
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
              <span>Conectado ({transport})</span>
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
