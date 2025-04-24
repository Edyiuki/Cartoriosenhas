"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { obterEstatisticasAtendimento, obterEstatisticasGuiche } from "@/lib/estatisticas"
import { ProdutividadeChart } from "@/components/produtividade-chart"
import { TempoAtendimentoChart } from "@/components/tempo-atendimento-chart"
import { AtendimentosPorTipoChart } from "@/components/atendimentos-por-tipo-chart"

export function AdminDashboardCharts() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState("semanal")
  const [carregando, setCarregando] = useState(true)
  const [estatisticas, setEstatisticas] = useState<any>({
    gerais: {},
    guiche: {},
  })

  useEffect(() => {
    carregarDados(periodoSelecionado)
  }, [])

  const carregarDados = async (periodo: string) => {
    setCarregando(true)
    try {
      const [estatGerais, estatGuiche] = await Promise.all([
        obterEstatisticasAtendimento(periodo),
        obterEstatisticasGuiche(periodo, "todos"),
      ])

      setEstatisticas({
        gerais: estatGerais,
        guiche: estatGuiche,
      })
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setCarregando(false)
    }
  }

  const handleChangePeriodo = (valor: string) => {
    setPeriodoSelecionado(valor)
    carregarDados(valor)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard de Desempenho</h2>
        <Select value={periodoSelecionado} onValueChange={handleChangePeriodo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="diario">Diário</SelectItem>
            <SelectItem value="semanal">Semanal</SelectItem>
            <SelectItem value="mensal">Mensal</SelectItem>
            <SelectItem value="anual">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="produtividade" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
          <TabsTrigger value="tempos">Tempos de Atendimento</TabsTrigger>
          <TabsTrigger value="tipos">Tipos de Atendimento</TabsTrigger>
        </TabsList>

        <TabsContent value="produtividade">
          <Card>
            <CardHeader>
              <CardTitle>Produtividade por Guichê</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {carregando ? (
                <div className="h-full flex items-center justify-center">Carregando dados...</div>
              ) : (
                <ProdutividadeChart dados={estatisticas.guiche.produtividadePorGuiche || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tempos">
          <Card>
            <CardHeader>
              <CardTitle>Tempo Médio de Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {carregando ? (
                <div className="h-full flex items-center justify-center">Carregando dados...</div>
              ) : (
                <TempoAtendimentoChart dados={estatisticas.guiche.tempoMedioPorGuiche || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tipos">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo de Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {carregando ? (
                <div className="h-full flex items-center justify-center">Carregando dados...</div>
              ) : (
                <AtendimentosPorTipoChart dados={estatisticas.gerais.atendimentosPorTipo || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
