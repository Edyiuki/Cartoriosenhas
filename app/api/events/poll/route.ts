import { NextResponse } from "next/server"
import { getEventsSince } from "@/lib/event-store"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const lastEventId = Number.parseInt(url.searchParams.get("lastEventId") || "0", 10)
    const clientId = url.searchParams.get("clientId") || "anonymous"

    // Obter eventos desde o último ID
    const events = getEventsSince(lastEventId)

    return NextResponse.json({ success: true, events })
  } catch (error) {
    console.error("Erro ao verificar eventos perdidos:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 })
  }
}
