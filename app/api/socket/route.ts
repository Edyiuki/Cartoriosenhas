import { Server as ServerIO } from "socket.io"
import { NextResponse } from "next/server"
import { SocketEvent } from "@/lib/socket-service"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Função auxiliar para verificar se o servidor Socket.io já está inicializado
const getIO = (res: NextResponse) => {
  // @ts-ignore - o tipo do socket não está definido corretamente
  const httpServer = res.socket?.server

  if (!httpServer) {
    throw new Error("HTTP Server não disponível")
  }

  if (!httpServer.io) {
    console.log("Inicializando servidor Socket.io")

    // Inicializar o servidor Socket.io com configurações mais seguras
    httpServer.io = new ServerIO(httpServer, {
      path: "/api/socketio",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      // Usar apenas polling inicialmente para evitar problemas de WebSocket
      transports: ["polling"],
      // Ativar WebSocket após 10 segundos para dar tempo ao cliente se conectar
      upgradeTimeout: 10000,
      // Configurações para melhorar a estabilidade
      pingTimeout: 30000,
      pingInterval: 25000,
      connectTimeout: 30000,
    })

    // Configurar eventos do servidor
    httpServer.io.on("connection", (socket) => {
      console.log(`Cliente conectado: ${socket.id}`)

      // Notificar todos os clientes sobre a nova conexão
      httpServer.io.emit(SocketEvent.USER_CONNECTED, {
        id: socket.id,
        timestamp: new Date().toISOString(),
      })

      // Configurar handlers para eventos específicos
      socket.on(SocketEvent.CHAT_MESSAGE, (data) => {
        httpServer.io.emit(SocketEvent.CHAT_MESSAGE, data)
      })

      socket.on(SocketEvent.TICKET_CALLED, (data) => {
        httpServer.io.emit(SocketEvent.TICKET_CALLED, data)
      })

      socket.on(SocketEvent.TICKET_DIRECTED, (data) => {
        httpServer.io.emit(SocketEvent.TICKET_DIRECTED, data)
      })

      socket.on(SocketEvent.GUICHE_STATUS_CHANGED, (data) => {
        httpServer.io.emit(SocketEvent.GUICHE_STATUS_CHANGED, data)
      })

      socket.on(SocketEvent.SYSTEM_BACKUP, (data) => {
        httpServer.io.emit(SocketEvent.SYSTEM_BACKUP, data)
      })

      socket.on(SocketEvent.SYSTEM_RESTORE, (data) => {
        httpServer.io.emit(SocketEvent.SYSTEM_RESTORE, data)
      })

      socket.on(SocketEvent.TICKET_CREATED, (data) => {
        httpServer.io.emit(SocketEvent.TICKET_CREATED, data)
      })

      socket.on(SocketEvent.TICKET_COMPLETED, (data) => {
        httpServer.io.emit(SocketEvent.TICKET_COMPLETED, data)
      })

      socket.on(SocketEvent.TICKET_CANCELLED, (data) => {
        httpServer.io.emit(SocketEvent.TICKET_CANCELLED, data)
      })

      socket.on("disconnect", (reason) => {
        console.log(`Cliente desconectado: ${socket.id}, motivo: ${reason}`)
        httpServer.io.emit(SocketEvent.USER_DISCONNECTED, {
          id: socket.id,
          timestamp: new Date().toISOString(),
          reason,
        })
      })

      // Adicionar handler para erros
      socket.on("error", (error) => {
        console.error(`Erro no socket ${socket.id}:`, error)
      })
    })

    // Adicionar handler para erros no servidor
    httpServer.io.engine.on("connection_error", (err) => {
      console.error("Erro de conexão no servidor Socket.io:", err)
    })
  }

  return httpServer.io
}

export async function GET(req: Request) {
  try {
    const res = new NextResponse()

    // Inicializar o servidor Socket.io
    const io = getIO(res)

    return new NextResponse("Socket.io server running", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  } catch (error) {
    console.error("Erro ao inicializar o servidor Socket.io:", error)
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}`, {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }
}

// Adicionar suporte para OPTIONS para CORS
export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
