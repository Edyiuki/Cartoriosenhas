import { NextResponse } from "next/server"
import { eventStore, sendEventToAll } from "@/lib/event-store"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Rota para receber eventos SSE
export async function GET(req: Request) {
  const url = new URL(req.url)
  const clientId = url.searchParams.get("clientId") || "anonymous"

  // Configurar resposta SSE
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  })

  const res = new NextResponse(
    new ReadableStream({
      start(controller) {
        // Armazenar o controlador para uso posterior
        eventStore.clients.set(clientId, { res: controller, headers })

        // Enviar evento de conexão
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({
              id: ++eventStore.lastId,
              event: "connect",
              payload: { clientId },
              timestamp: new Date().toISOString(),
            })}\n\n`,
          ),
        )

        // Enviar heartbeat a cada 30 segundos para manter a conexão viva
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(`:heartbeat\n\n`))
          } catch (error) {
            console.error(`Erro ao enviar heartbeat para cliente ${clientId}:`, error)
            clearInterval(heartbeatInterval)
          }
        }, 30000)

        // Limpar quando o cliente desconectar
        req.signal.addEventListener("abort", () => {
          clearInterval(heartbeatInterval)
          eventStore.clients.delete(clientId)
          console.log(`Cliente desconectado: ${clientId}`)

          // Notificar outros clientes sobre a desconexão
          sendEventToAll("user:disconnected", { clientId })
        })
      },
    }),
    { headers },
  )

  // Notificar outros clientes sobre a nova conexão
  sendEventToAll("user:connected", { clientId })

  return res
}

// Rota para publicar eventos
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { event, payload } = body

    if (!event) {
      return NextResponse.json({ error: "Evento não especificado" }, { status: 400 })
    }

    // Publicar evento para todos os clientes
    sendEventToAll(event, payload)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao publicar evento:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 })
  }
}
