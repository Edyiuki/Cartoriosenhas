"use server"

import { type NextRequest, NextResponse } from "next/server"
import { processarPergunta } from "@/lib/ia-service"

export async function POST(req: NextRequest) {
  try {
    const { pergunta, historico } = await req.json()

    if (!pergunta) {
      return NextResponse.json({ error: "Pergunta não fornecida" }, { status: 400 })
    }

    const resposta = await processarPergunta(pergunta, historico || [])

    return NextResponse.json({ resposta })
  } catch (error) {
    console.error("Erro ao processar pergunta:", error)
    return NextResponse.json({ error: "Erro ao processar pergunta" }, { status: 500 })
  }
}
