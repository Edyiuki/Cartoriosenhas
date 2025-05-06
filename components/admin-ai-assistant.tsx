"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Brain, Send, BarChart3, Users, Clock, ArrowRight, Globe, RefreshCw } from "lucide-react"
import { obterEstatisticasAtendimento, obterEstatisticasGuiche } from "@/lib/estatisticas"
import { processarPergunta, iniciarSessaoChat } from "@/lib/ia-service"

export function AdminAIAssistant() {
  const [pergunta, setPergunta] = useState("")
  const [historico, setHistorico] = useState<Array<{ tipo: "pergunta" | "resposta"; texto: string; fonte?: string }>>(
    [],
  )
  const [carregando, setCarregando] = useState(false)
  const [estatisticas, setEstatisticas] = useState<any>({})
  const [thothAtivo, setThothAtivo] = useState(false)
  const [sugestoes, setSugestoes] = useState<string[]>([])
  const [buscandoWeb, setBuscandoWeb] = useState(false)
  const [usuarioId, setUsuarioId] = useState<string>("")
  const [tempoResposta, setTempoResposta] = useState<number | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Gerar ID único para o usuário se não existir
    const userId =
      localStorage.getItem("thoth_user_id") || `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem("thoth_user_id", userId)
    setUsuarioId(userId)

    // Carregar estatísticas para o assistente IA usar
    const carregarDados = async () => {
      try {
        const [estatGerais, estatGuiche] = await Promise.all([
          obterEstatisticasAtendimento("semanal"),
          obterEstatisticasGuiche("semanal", "todos"),
        ])

        setEstatisticas({
          gerais: estatGerais,
          guiche: estatGuiche,
        })
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error)
      }
    }

    carregarDados()

    // Iniciar sessão de chat
    const sessao = iniciarSessaoChat(userId)
    setHistorico(sessao.mensagensIniciais)
    setSugestoes(sessao.sugestoes || [])

    // Ativar Thoth na primeira interação
    setThothAtivo(true)
    setTimeout(() => {
      setThothAtivo(false)
    }, 5000)
  }, [])

  useEffect(() => {
    // Rolar para o final quando houver novas mensagens
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [historico])

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

    setCarregando(true)
    setBuscandoWeb(true)
    setTempoResposta(null)

    try {
      // Usar o serviço de IA para processar a pergunta
      const resposta = await processarPergunta(perguntaTexto, {
        totalAtendimentos: estatisticas.gerais?.totalAtendimentos,
        tempoMedio: estatisticas.gerais?.tempoMedioAtendimento,
        produtividade: estatisticas.gerais?.produtividadeMedia,
        estatisticas: estatisticas,
        usuarioId: usuarioId,
      })

      setBuscandoWeb(false)
      setTempoResposta(resposta.tempoResposta || null)

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
          tipo: "resposta",
          texto: "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.",
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="h-full border-teal-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-amber-50 border-b border-teal-100">
            <CardTitle className="flex items-center gap-2 text-teal-800">
              <Brain className="h-5 w-5 text-amber-600" />
              Assistente IA Thoth
            </CardTitle>
            <CardDescription>Converse com o assistente IA para obter insights e ajuda com o sistema</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col h-[500px]">
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto mb-4 space-y-4 border rounded-md p-4 bg-gray-50"
            >
              {historico.map((item, index) => (
                <div key={index} className={`flex ${item.tipo === "pergunta" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      item.tipo === "pergunta"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    {item.tipo === "resposta" && (
                      <div className="flex items-center gap-1 mb-2">
                        <div
                          className={`w-6 h-6 rounded-full overflow-hidden ${thothAtivo && index === historico.length - 1 ? "animate-bounce" : ""}`}
                        >
                          <img src="/thoth-icon.png" alt="Thoth" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-sm font-medium text-amber-600">Thoth</span>

                        {item.fonte && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center">
                            <Globe className="h-3 w-3 mr-1" />
                            Fonte externa
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-line">{item.texto}</p>

                    {item.fonte && <div className="mt-2 text-xs text-gray-500 italic">Fonte: {item.fonte}</div>}
                  </div>
                </div>
              ))}

              {carregando && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-white border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden animate-bounce">
                        <img src="/thoth-icon.png" alt="Thoth" className="w-full h-full object-cover" />
                      </div>

                      {buscandoWeb ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
                          <span className="text-xs text-amber-600">Buscando informações na internet...</span>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <div
                            className="w-2 h-2 rounded-full bg-amber-600 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 rounded-full bg-amber-600 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 rounded-full bg-amber-600 animate-bounce"
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
                <div className="flex flex-wrap gap-2 mb-2">
                  {sugestoes.slice(0, 3).map((sugestao, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700"
                      onClick={() => handleEnviarPergunta(sugestao)}
                    >
                      {sugestao}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Faça uma pergunta ao assistente IA Thoth..."
                  value={pergunta}
                  onChange={(e) => setPergunta(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={carregando}
                  className="border-teal-200 focus:border-teal-400 focus:ring-teal-400"
                />
                <Button
                  onClick={() => handleEnviarPergunta()}
                  disabled={carregando || !pergunta.trim()}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {tempoResposta && (
                <div className="text-xs text-gray-500 text-right mt-1">
                  Resposta gerada em {(tempoResposta / 1000).toFixed(2)}s
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-2 border-4 border-amber-300">
              <img src="/thoth-avatar.png" alt="Thoth" className="w-full h-full object-cover" />
            </div>
            <CardTitle className="text-lg text-center">Assistente IA Thoth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-center text-gray-600 mb-4">
              Assistente de IA inspirado no deus egípcio da sabedoria e conhecimento
            </p>
            <div className="space-y-2 text-sm">
              <Button
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => {
                  handleEnviarPergunta("Qual é o desempenho atual dos guichês?")
                }}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Qual é o desempenho atual dos guichês?
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => {
                  handleEnviarPergunta("Como posso otimizar o fluxo de atendimento?")
                }}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Como posso otimizar o fluxo de atendimento?
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => {
                  handleEnviarPergunta("Quais são os tempos médios de atendimento?")
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Quais são os tempos médios de atendimento?
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => {
                  handleEnviarPergunta("Quem é você, Thoth?")
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Quem é você, Thoth?
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recursos da IA Thoth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <div className={`w-16 h-16 rounded-full overflow-hidden ${thothAtivo ? "animate-pulse" : ""}`}>
                <img src="/thoth-icon.png" alt="Thoth" className="w-full h-full object-cover" />
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="bg-amber-100 text-amber-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <span>Análise de desempenho dos guichês e atendentes</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-amber-100 text-amber-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <span>Recomendações para otimização do fluxo de trabalho</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-amber-100 text-amber-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <span>Pesquisa de soluções na internet em tempo real</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-amber-100 text-amber-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </div>
                <span>Resolução de problemas técnicos e bugs do sistema</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
