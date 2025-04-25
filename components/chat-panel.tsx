"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, User, Megaphone } from "lucide-react"
import { enviarMensagem, obterMensagens, escutarMensagens } from "@/lib/chat"
import { formatarHora } from "@/lib/utils"
import { GuicheStatusPanel } from "@/components/guiche-status-panel"

interface ChatPanelProps {
  usuario: {
    id: string
    nome: string
    guiche?: string
    tipo?: string
  }
}

export function ChatPanel({ usuario }: ChatPanelProps) {
  const [mensagens, setMensagens] = useState<any[]>([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [anuncioGlobal, setAnuncioGlobal] = useState("")
  const isRecepcao = usuario.tipo === "recepcao"

  useEffect(() => {
    const carregarMensagens = async () => {
      const msgs = await obterMensagens()
      setMensagens(msgs)

      // Rolar para o final
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, 100)
    }

    carregarMensagens()

    // Configurar listener para novas mensagens
    const unsubscribe = escutarMensagens((novaMensagem) => {
      setMensagens((prev) => [...prev, novaMensagem])

      // Rolar para o final
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, 100)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim()) return

    await enviarMensagem({
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      guiche: usuario.guiche || "Recepção",
      texto: novaMensagem,
      timestamp: Date.now(),
      tipo: usuario.tipo || "atendente",
    })

    setNovaMensagem("")
  }

  const handleEnviarAnuncioGlobal = async () => {
    if (!anuncioGlobal.trim()) return

    await enviarMensagem({
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      guiche: "Recepção",
      texto: anuncioGlobal,
      timestamp: Date.now(),
      tipo: "anuncio",
    })

    setAnuncioGlobal("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEnviarMensagem()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {isRecepcao && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
            <Megaphone className="h-4 w-4" />
            Anúncio Global
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enviar anúncio para todos..."
              value={anuncioGlobal}
              onChange={(e) => setAnuncioGlobal(e.target.value)}
            />
            <Button onClick={handleEnviarAnuncioGlobal}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Os anúncios globais são destacados para todos os atendentes e recepcionistas.
          </p>
        </div>
      )}

      {!isRecepcao && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Status dos Guichês</h3>
          <GuicheStatusPanel />
        </div>
      )}

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 space-y-3 border rounded-md p-3 bg-gray-50"
        style={{ maxHeight: "300px" }}
      >
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
                {msg.tipo === "anuncio" && (
                  <div className="flex items-center gap-1 mb-1 text-xs font-medium text-blue-600">
                    <Megaphone className="h-3 w-3" />
                    <span>ANÚNCIO GLOBAL</span>
                  </div>
                )}

                {msg.usuarioId !== "sistema" && msg.usuarioId !== usuario.id && (
                  <div className="flex items-center gap-1 mb-1 text-xs text-gray-500">
                    <User className="h-3 w-3" />
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

      <div className="flex gap-2">
        <Input
          placeholder="Digite sua mensagem..."
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleEnviarMensagem}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
