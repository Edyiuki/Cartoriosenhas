"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { enviarMensagem, obterMensagens } from "@/lib/chat"
import { realtimeService, RealtimeEvent } from "@/lib/realtime-service"

interface ChatPanelProps {
  usuario: {
    id: string
    nome: string
    tipo: string
  }
}

export function ChatPanel({ usuario }: ChatPanelProps) {
  const [mensagens, setMensagens] = useState<any[]>([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const [carregando, setCarregando] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const carregarDados = async () => {
      const msgs = await obterMensagens()
      setMensagens(msgs)

      // Rolar para o final
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, 100)
    }

    carregarDados()

    // Configurar listener para novas mensagens
    const handleNovaMensagem = (novaMensagem: any) => {
      setMensagens((prev) => [...prev, novaMensagem])

      // Rolar para o final
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, 100)
    }

    // Usar o serviço de tempo real em vez do Socket.io
    realtimeService.on(RealtimeEvent.CHAT_MESSAGE, handleNovaMensagem)

    return () => {
      realtimeService.off(RealtimeEvent.CHAT_MESSAGE, handleNovaMensagem)
    }
  }, [])

  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim()) return

    setCarregando(true)

    try {
      await enviarMensagem({
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        guiche: usuario.tipo === "atendente" ? usuario.guiche : "Admin",
        texto: novaMensagem,
        timestamp: Date.now(),
        tipo: usuario.tipo,
      })

      setNovaMensagem("")
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
    } finally {
      setCarregando(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleEnviarMensagem()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto border rounded-md p-4 bg-gray-50 space-y-3">
        {mensagens.length > 0 ? (
          mensagens.map((msg, index) => (
            <div key={index} className={`flex ${msg.usuarioId === usuario.id ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-2 ${
                  msg.tipo === "anuncio"
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : msg.usuarioId === "sistema"
                      ? "bg-gray-200 text-gray-700"
                      : msg.usuarioId === usuario.id
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white border text-gray-800"
                }`}
              >
                {msg.usuarioId !== "sistema" && msg.usuarioId !== usuario.id && (
                  <div className="flex items-center gap-1 mb-1 text-xs text-gray-500">
                    <span>
                      {msg.usuarioNome} ({msg.guiche})
                    </span>
                  </div>
                )}
                <p className="text-sm">{msg.texto}</p>
                <div className="text-right text-xs text-gray-500 mt-1">{formatarHora(msg.timestamp)}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">Nenhuma mensagem ainda</div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <Input
          placeholder="Digite sua mensagem..."
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={carregando}
        />
        <Button onClick={handleEnviarMensagem} disabled={carregando}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Função auxiliar para formatar hora
function formatarHora(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
