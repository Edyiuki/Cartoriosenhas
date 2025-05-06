"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Brain, Send, X, Minimize2, Globe, RefreshCw, AlertTriangle } from "lucide-react"
import { processarPergunta, iniciarSessaoChat } from "@/lib/ia-service"

export function ThothFloatingChat() {
  const [aberto, setAberto] = useState(false)
  const [minimizado, setMinimizado] = useState(false)
  const [pergunta, setPergunta] = useState("")
  const [historico, setHistorico] = useState<
    Array<{ tipo: "pergunta" | "resposta" | "erro"; texto: string; fonte?: string }>
  >([])
  const [carregando, setCarregando] = useState(false)
  const [buscandoWeb, setBuscandoWeb] = useState(false)
  const [usuarioId, setUsuarioId] = useState<string>("")
  const [thothAtivo, setThothAtivo] = useState(false)
  const [sugestoes, setSugestoes] = useState<string[]>([])
  const [modoOffline, setModoOffline] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Rolar para o final do chat quando novas mensagens são adicionadas
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [historico])

  useEffect(() => {
    // Gerar ID único para o usuário se não existir
    const userId =
      localStorage.getItem("thoth_user_id") || `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem("thoth_user_id", userId)
    setUsuarioId(userId)

    // Verificar se o chat deve ser aberto automaticamente
    const chatAberto = localStorage.getItem("thoth_chat_aberto") === "true"
    if (chatAberto) {
      setAberto(true)

      // Iniciar sessão de chat
      const sessao = iniciarSessaoChat(userId)
      setHistorico(sessao.mensagensIniciais)
      setSugestoes(sessao.sugestoes || [])
    }

    // Verificar status de conexão
    const verificarConexao = () => {
      setModoOffline(!navigator.onLine)
    }

    // Adicionar event listeners para status de conexão
    window.addEventListener("online", verificarConexao)
    window.addEventListener("offline", verificarConexao)
    verificarConexao() // Verificar status inicial

    return () => {
      window.removeEventListener("online", verificarConexao)
      window.removeEventListener("offline", verificarConexao)
    }
  }, [])

  // Salvar estado do chat
  useEffect(() => {
    localStorage.setItem("thoth_chat_aberto", aberto.toString())
  }, [aberto])

  const handleAbrirChat = () => {
    setAberto(true)
    setMinimizado(false)

    // Se o histórico estiver vazio, iniciar sessão
    if (historico.length === 0) {
      const sessao = iniciarSessaoChat(usuarioId)
      setHistorico(sessao.mensagensIniciais)
      setSugestoes(sessao.sugestoes || [])
    }

    // Ativar animação do Thoth
    setThothAtivo(true)
    setTimeout(() => {
      setThothAtivo(false)
    }, 3000)
  }

  const handleFecharChat = () => {
    setAberto(false)
    setMinimizado(false)
  }

  const handleMinimizarChat = () => {
    setMinimizado(!minimizado)
  }

  const handleEnviarPergunta = async (perguntaTexto: string = pergunta) => {
    if (!perguntaTexto.trim()) return

    // Limpar campo de pergunta se for a pergunta digitada
    if (perguntaTexto === pergunta) {
      setPergunta("")
    }

    // Ativar animação do Thoth
    setThothAtivo(true)

    // Adicionar pergunta ao histórico
    setHistorico((prev) => [...prev, { tipo: "pergunta", texto: perguntaTexto }])

    // Se estiver offline, responder imediatamente com mensagem de offline
    if (modoOffline) {
      setHistorico((prev) => [
        ...prev,
        {
          tipo: "erro",
          texto:
            "Parece que você está offline. Conecte-se à internet para usar o assistente Thoth com todas as funcionalidades.",
        },
      ])
      setThothAtivo(false)
      return
    }

    setCarregando(true)
    setBuscandoWeb(true)

    try {
      // Usar o serviço de IA para processar a pergunta
      const resposta = await processarPergunta(perguntaTexto, {
        usuarioId: usuarioId,
      })

      setBuscandoWeb(false)

      // Adicionar resposta ao histórico
      setHistorico((prev) => [
        ...prev,
        {
          tipo: "resposta",
          texto: resposta.texto,
          fonte: resposta.fonte,
        },
      ])

      // Atualizar sugestões baseadas na resposta
      if (resposta.sugestoes) {
        setSugestoes(resposta.sugestoes)
      }
    } catch (error) {
      console.error("Erro ao processar pergunta:", error)
      setBuscandoWeb(false)
      setHistorico((prev) => [
        ...prev,
        {
          tipo: "erro",
          texto:
            "Desculpe, ocorreu um erro ao processar sua pergunta. Nosso sistema está funcionando em modo local no momento.",
        },
      ])
    } finally {
      setCarregando(false)

      // Desativar animação do Thoth após um tempo
      setTimeout(() => {
        setThothAtivo(false)
      }, 3000)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleEnviarPergunta()
    }
  }

  if (!aberto) {
    return (
      <Button
        onClick={handleAbrirChat}
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 p-0 bg-amber-500 hover:bg-amber-600 shadow-lg"
        aria-label="Abrir assistente IA"
      >
        <Brain className="h-6 w-6 text-white" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-80 shadow-xl transition-all duration-300 ${minimizado ? "h-14" : "h-[450px]"}`}>
        <CardHeader className="p-3 flex flex-row items-center justify-between bg-gradient-to-r from-teal-50 to-amber-50 border-b border-teal-100">
          <CardTitle className="text-sm flex items-center gap-2 text-teal-800">
            <div className={`w-6 h-6 rounded-full overflow-hidden ${thothAtivo ? "animate-bounce" : ""}`}>
              <img src="/thoth-icon.png" alt="Thoth" className="w-full h-full object-cover" />
            </div>
            Assistente Thoth
            {modoOffline && (
              <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full flex items-center">
                <AlertTriangle className="h-3 w-3 mr-0.5" />
                Offline
              </span>
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleMinimizarChat}
              aria-label={minimizado ? "Expandir chat" : "Minimizar chat"}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleFecharChat} aria-label="Fechar chat">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!minimizado && (
          <CardContent className="p-3 flex flex-col h-[calc(450px-48px)]">
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto mb-3 space-y-3 border rounded-md p-3 bg-gray-50 text-sm"
            >
              {historico.map((item, index) => (
                <div key={index} className={`flex ${item.tipo === "pergunta" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[90%] rounded-lg p-2 ${
                      item.tipo === "pergunta"
                        ? "bg-blue-100 text-blue-800"
                        : item.tipo === "erro"
                          ? "bg-amber-50 border border-amber-200 text-amber-800"
                          : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    {item.tipo === "resposta" && (
                      <div className="flex items-center gap-1 mb-1">
                        <div className="w-4 h-4 rounded-full overflow-hidden">
                          <img src="/thoth-icon.png" alt="Thoth" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-medium text-amber-600">Thoth</span>

                        {item.fonte && (
                          <span className="ml-1 text-[10px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded-full flex items-center">
                            <Globe className="h-2 w-2 mr-0.5" />
                            Web
                          </span>
                        )}
                      </div>
                    )}

                    {item.tipo === "erro" && (
                      <div className="flex items-center gap-1 mb-1">
                        <div className="w-4 h-4 rounded-full overflow-hidden">
                          <img src="/thoth-icon.png" alt="Thoth" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-medium text-amber-600">Thoth</span>
                        <span className="ml-1 text-[10px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded-full flex items-center">
                          <AlertTriangle className="h-2 w-2 mr-0.5" />
                          Aviso
                        </span>
                      </div>
                    )}

                    <p className="text-xs whitespace-pre-line">{item.texto}</p>

                    {item.fonte && <div className="mt-1 text-[10px] text-gray-500 italic">Fonte: {item.fonte}</div>}
                  </div>
                </div>
              ))}

              {carregando && (
                <div className="flex justify-start">
                  <div className="max-w-[90%] rounded-lg p-2 bg-white border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full overflow-hidden animate-bounce">
                        <img src="/thoth-icon.png" alt="Thoth" className="w-full h-full object-cover" />
                      </div>

                      {buscandoWeb ? (
                        <div className="flex items-center gap-1">
                          <RefreshCw className="h-2 w-2 animate-spin text-amber-600" />
                          <span className="text-[10px] text-amber-600">Buscando informações...</span>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {sugestoes.length > 0 && !carregando && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {sugestoes.slice(0, 2).map((sugestao, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-[10px] py-0 h-6 bg-gray-50 hover:bg-gray-100 text-gray-700"
                      onClick={() => handleEnviarPergunta(sugestao)}
                    >
                      {sugestao.length > 30 ? sugestao.substring(0, 30) + "..." : sugestao}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex gap-1">
                <Input
                  placeholder="Pergunte ao Thoth..."
                  value={pergunta}
                  onChange={(e) => setPergunta(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={carregando}
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => handleEnviarPergunta()}
                  disabled={carregando || !pergunta.trim()}
                  className="h-8 w-8 p-0 bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
