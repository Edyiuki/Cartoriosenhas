"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react"
import { analisarDadosComIA } from "@/lib/ia-analise"

interface IAInsightsPanelProps {
  periodo: string
  guiche: string
  usuario: string
  carregando: boolean
  estatisticas: {
    gerais: any
    guiche: any
    usuario: any
  }
}

export function IAInsightsPanel({ periodo, guiche, usuario, carregando, estatisticas }: IAInsightsPanelProps) {
  const [insights, setInsights] = useState<any>({})
  const [carregandoIA, setCarregandoIA] = useState(false)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null)

  useEffect(() => {
    if (!carregando) {
      gerarInsights()
    }
  }, [carregando, periodo, guiche, usuario])

  const gerarInsights = async () => {
    setCarregandoIA(true)
    try {
      const resultado = await analisarDadosComIA(periodo, guiche, usuario, estatisticas)
      setInsights(resultado)
      setUltimaAtualizacao(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("Erro ao gerar insights com IA:", error)
    } finally {
      setCarregandoIA(false)
    }
  }

  if (carregando || carregandoIA) {
    return (
      <div className="h-[400px] flex items-center justify-center flex-col gap-4">
        <Brain className="h-12 w-12 text-purple-500 animate-pulse" />
        <p className="text-lg font-medium text-gray-600">A IA está analisando os dados...</p>
        <p className="text-sm text-gray-500">Isso pode levar alguns instantes</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Análise Inteligente
          </h2>
          <p className="text-gray-500">
            Insights gerados por IA com base nos dados de {periodo}
            {ultimaAtualizacao && ` • Atualizado às ${ultimaAtualizacao}`}
          </p>
        </div>
        <Button onClick={gerarInsights} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar Análise
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Pontos Fortes
            </CardTitle>
            <CardDescription>Áreas com bom desempenho</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.pontosFortes?.map((item: string, index: number) => (
                <div key={index} className="flex gap-2 items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Pontos de Atenção
            </CardTitle>
            <CardDescription>Áreas que precisam de melhoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.pontosAtencao?.map((item: string, index: number) => (
                <div key={index} className="flex gap-2 items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Recomendações
            </CardTitle>
            <CardDescription>Sugestões para otimização</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.recomendacoes?.map((item: string, index: number) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="bg-purple-100 text-purple-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada</CardTitle>
          <CardDescription>Avaliação completa gerada pela IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Resumo Geral</h3>
            <p className="text-gray-700">{insights.resumoGeral}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Tendências Identificadas</h3>
            <div className="space-y-3">
              {insights.tendencias?.map((tendencia: any, index: number) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{tendencia.titulo}</h4>
                    <Badge
                      className={
                        tendencia.impacto === "positivo"
                          ? "bg-green-500"
                          : tendencia.impacto === "negativo"
                            ? "bg-red-500"
                            : "bg-amber-500"
                      }
                    >
                      {tendencia.impacto}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{tendencia.descricao}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Previsões</h3>
            <div className="space-y-3">
              {insights.previsoes?.map((previsao: any, index: number) => (
                <div key={index} className="flex gap-3 items-start">
                  <div
                    className={`rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 ${
                      previsao.confianca > 75
                        ? "bg-green-100 text-green-800"
                        : previsao.confianca > 50
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {previsao.confianca}%
                  </div>
                  <div>
                    <p className="font-medium">{previsao.titulo}</p>
                    <p className="text-sm text-gray-600">{previsao.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
