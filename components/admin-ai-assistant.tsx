"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Brain, Send, BarChart3, Users, Clock, ArrowRight } from "lucide-react"
import { obterEstatisticasAtendimento, obterEstatisticasGuiche } from "@/lib/estatisticas"
import { processarPergunta } from "@/lib/ia-service"

export function AdminAIAssistant() {
  const [pergunta, setPergunta] = useState("")
  const [historico, setHistorico] = useState<Array<{ tipo: "pergunta" | "resposta"; texto: string }>>([])
  const [carregando, setCarregando] = useState(false)
  const [estatisticas, setEstatisticas] = useState<any>({})
  const [thothAtivo, setThothAtivo] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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

    // Adicionar mensagem inicial do assistente
    setHistorico([
      {
        tipo: "resposta",
        texto:
          "Olá! Sou Thoth, seu assistente IA do sistema de senhas. Como posso ajudar você hoje? Posso fornecer análises sobre o desempenho dos guichês, sugerir otimizações ou responder perguntas sobre o sistema.",
      },
    ])

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

  const handleEnviarPergunta = async () => {
    if (!pergunta.trim()) return

    // Ativar animação do Thoth
    setThothAtivo(true)

    // Adicionar pergunta ao histórico
    setHistorico((prev) => [...prev, { tipo: "pergunta", texto: pergunta }])

    setCarregando(true)

    try {
      // Usar o serviço de IA para processar a pergunta
      const resposta = await processarPergunta(pergunta, {
        totalAtendimentos: estatisticas.gerais?.totalAtendimentos,
        tempoMedio: estatisticas.gerais?.tempoMedioAtendimento,
        produtividade: estatisticas.gerais?.produtividadeMedia,
        estatisticas: estatisticas,
      })

      // Formatar resposta com fonte se disponível
      const textoResposta = resposta.fonte ? `${resposta.texto}\n\n_Fonte: ${resposta.fonte}_` : resposta.texto

      // Adicionar resposta ao histórico
      setHistorico((prev) => [...prev, { tipo: "resposta", texto: textoResposta }])
    } catch (error) {
      console.error("Erro ao processar pergunta:", error)
      setHistorico((prev) => [
        ...prev,
        {
          tipo: "resposta",
          texto: "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.",
        },
      ])
    } finally {
      setCarregando(false)
      setPergunta("")

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
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-line">{item.texto}</p>
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
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Faça uma pergunta ao assistente IA Thoth..."
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={carregando}
              />
              <Button onClick={handleEnviarPergunta} disabled={carregando || !pergunta.trim()}>
                <Send className="h-4 w-4" />
              </Button>
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
                  setPergunta("Qual é o desempenho atual dos guichês?")
                  handleEnviarPergunta()
                }}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Qual é o desempenho atual dos guichês?
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => {
                  setPergunta("Como posso otimizar o fluxo de atendimento?")
                  handleEnviarPergunta()
                }}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Como posso otimizar o fluxo de atendimento?
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => {
                  setPergunta("Quais são os tempos médios de atendimento?")
                  handleEnviarPergunta()
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Quais são os tempos médios de atendimento?
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => {
                  setPergunta("Quem é você, Thoth?")
                  handleEnviarPergunta()
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
                <span>Pesquisa de soluções na internet e uso de outras IAs</span>
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
