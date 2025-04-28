"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, X, MessageSquare, MinusCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type Mensagem = {
  tipo: "usuario" | "assistente"
  conteudo: string
  timestamp: Date
}

export function ThothFloatingChat() {
  const [aberto, setAberto] = useState(false)
  const [minimizado, setMinimizado] = useState(false)
  const [pergunta, setPergunta] = useState("")
  const [historico, setHistorico] = useState<Mensagem[]>([])
  const [carregando, setCarregando] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [historico])

  useEffect(() => {
    // Carregar histórico do localStorage
    const historicoSalvo = localStorage.getItem("thoth-chat-historico")
    if (historicoSalvo) {
      try {
        const parsedHistorico = JSON.parse(historicoSalvo)
        // Converter strings de data para objetos Date
        const historicoComDatas = parsedHistorico.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
        setHistorico(historicoComDatas)
      } catch (error) {
        console.error("Erro ao carregar histórico do chat:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Salvar histórico no localStorage
    if (historico.length > 0) {
      localStorage.setItem("thoth-chat-historico", JSON.stringify(historico))
    }
  }, [historico])

  const enviarPergunta = async () => {
    if (!pergunta.trim() || carregando) return

    const novaPergunta: Mensagem = {
      tipo: "usuario",
      conteudo: pergunta,
      timestamp: new Date(),
    }

    setHistorico([...historico, novaPergunta])
    setPergunta("")
    setCarregando(true)

    try {
      const historicoAPI = historico.map((msg) => ({
        role: msg.tipo === "usuario" ? "user" : "assistant",
        content: msg.conteudo,
      }))

      const response = await fetch("/api/ia/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pergunta: pergunta.trim(),
          historico: historicoAPI,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao processar pergunta")
      }

      const data = await response.json()

      const novaResposta: Mensagem = {
        tipo: "assistente",
        conteudo: data.resposta,
        timestamp: new Date(),
      }

      setHistorico((prev) => [...prev, novaResposta])
    } catch (error) {
      console.error("Erro ao enviar pergunta:", error)

      const mensagemErro: Mensagem = {
        tipo: "assistente",
        conteudo: "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente mais tarde.",
        timestamp: new Date(),
      }

      setHistorico((prev) => [...prev, mensagemErro])
    } finally {
      setCarregando(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviarPergunta()
    }
  }

  const toggleChat = () => {
    setAberto(!aberto)
    setMinimizado(false)

    // Focar no input quando abrir o chat
    if (!aberto) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  const toggleMinimizar = () => {
    setMinimizado(!minimizado)
  }

  const limparHistorico = () => {
    setHistorico([])
    localStorage.removeItem("thoth-chat-historico")
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {aberto ? (
        <Card
          className={cn(
            "w-80 sm:w-96 transition-all duration-300 ease-in-out shadow-lg",
            minimizado ? "h-14" : "h-[500px]",
          )}
        >
          <CardHeader className="p-3 flex flex-row items-center justify-between border-b">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/thoth-avatar.png" alt="Thoth" />
                <AvatarFallback>TH</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-semibold">Thoth Assistente</h3>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMinimizar}>
                <MinusCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleChat}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!minimizado && (
            <>
              <CardContent className="p-0 flex-grow">
                <ScrollArea className="h-[380px] p-4" ref={scrollAreaRef}>
                  {historico.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                      <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                      <p>Olá! Sou o Thoth, seu assistente virtual.</p>
                      <p className="text-sm">Como posso ajudar você hoje?</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {historico.map((msg, i) => (
                        <div key={i} className={cn("flex", msg.tipo === "usuario" ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg p-3",
                              msg.tipo === "usuario" ? "bg-primary text-primary-foreground" : "bg-muted",
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {carregando && (
                        <div className="flex justify-start">
                          <div className="bg-muted max-w-[80%] rounded-lg p-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-3 pt-2 border-t flex flex-col gap-2">
                <div className="flex w-full items-center space-x-2">
                  <Input
                    ref={inputRef}
                    placeholder="Digite sua pergunta..."
                    value={pergunta}
                    onChange={(e) => setPergunta(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={carregando}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={enviarPergunta} disabled={!pergunta.trim() || carregando}>
                    {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                {historico.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={limparHistorico} className="self-end text-xs">
                    Limpar conversa
                  </Button>
                )}
              </CardFooter>
            </>
          )}
        </Card>
      ) : (
        <Button onClick={toggleChat} size="icon" className="h-12 w-12 rounded-full shadow-lg">
          <Avatar className="h-12 w-12">
            <AvatarImage src="/thoth-avatar.png" alt="Thoth" />
            <AvatarFallback>TH</AvatarFallback>
          </Avatar>
        </Button>
      )}
    </div>
  )
}

export default ThothFloatingChat
