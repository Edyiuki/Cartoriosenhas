import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Importar função para enviar eventos (definida em outro arquivo)
import { sendEventToAll } from "@/lib/event-store"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { events, clientId } = body

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: "Formato de eventos inválido" }, { status: 400 })
    }

    // Publicar cada evento
    const results = events.map((eventData) => {
      const { event, payload } = eventData
      if (!event) {
        return { success: false, error: "Evento não especificado" }
      }

      try {
        sendEventToAll(event, payload)
        return { success: true, event }
      } catch (error) {
        return {
          success: false,
          event,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        }
      }
    })

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Erro ao publicar eventos:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 })
  }
}
