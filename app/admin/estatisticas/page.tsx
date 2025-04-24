"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, BarChart3, Clock, Users, Brain } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { obterUsuarioAtual } from "@/lib/auth"
import { obterEstatisticasAtendimento, obterEstatisticasGuiche, obterEstatisticasUsuario } from "@/lib/estatisticas"
import { ProdutividadeChart } from "@/components/produtividade-chart"
import { TempoAtendimentoChart } from "@/components/tempo-atendimento-chart"
import { AtendimentosPorTipoChart } from "@/components/atendimentos-por-tipo-chart"
import { IAInsightsPanel } from "@/components/ia-insights-panel"

export default function EstatisticasPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [periodoSelecionado, setPeriodoSelecionado] = useState("semanal")
  const [guicheSelecionado, setGuicheSelecionado] = useState("todos")
  const [usuarioSelecionado, setUsuarioSelecionado] = useState("todos")
  const [estatisticasGerais, setEstatisticasGerais] = useState<any>({})
  const [estatisticasGuiche, setEstatisticasGuiche] = useState<any>({})
  const [estatisticasUsuario, setEstatisticasUsuario] = useState<any>({})
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const verificarAutenticacao = async () => {
      const user = await obterUsuarioAtual()
      if (!user) {
        router.push("/")
        return
      }
      setUsuario(user)

      // Carregar lista de usuários
      const historicoAtendentes = localStorage.getItem("historicoAtendentes")
      if (historicoAtendentes) {
        const listaUsuarios = JSON.parse(historicoAtendentes)
        setUsuarios(listaUsuarios)
      }

      await carregarEstatisticas("semanal", "todos", "todos")
    }

    verificarAutenticacao()
  }, [router])

  const carregarEstatisticas = async (periodo: string, guiche: string, usuario: string) => {
    setCarregando(true)
    try {
      const [estatGerais, estatGuiche, estatUsuario] = await Promise.all([
        obterEstatisticasAtendimento(periodo),
        obterEstatisticasGuiche(periodo, guiche),
        obterEstatisticasUsuario(periodo, usuario),
      ])

      setEstatisticasGerais(estatGerais)
      setEstatisticasGuiche(estatGuiche)
      setEstatisticasUsuario(estatUsuario)
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setCarregando(false)
    }
  }

  const handleChangePeriodo = (valor: string) => {
    setPeriodoSelecionado(valor)
    carregarEstatisticas(valor, guicheSelecionado, usuarioSelecionado)
  }

  const handleChangeGuiche = (valor: string) => {
    setGuicheSelecionado(valor)
    carregarEstatisticas(periodoSelecionado, valor, usuarioSelecionado)
  }

  const handleChangeUsuario = (valor: string) => {
    setUsuarioSelecionado(valor)
    carregarEstatisticas(periodoSelecionado, guicheSelecionado, valor)
  }

  const exportarDados = () => {
    // Combinar todos os dados estatísticos
    const dadosExportacao = {
      periodo: periodoSelecionado,
      estatisticasGerais,
      estatisticasGuiche,
      estatisticasUsuario,
      dataExportacao: new Date().toISOString(),
    }

    // Converter para JSON
    const jsonString = JSON.stringify(dadosExportacao, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    // Criar link para download
    const a = document.createElement("a")
    a.href = url
    a.download = `estatisticas-${periodoSelecionado}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para a página inicial
            </Link>
            <h1 className="text-3xl font-bold text-blue-800">Análise de Produtividade</h1>
            <p className="text-gray-600">Estatísticas detalhadas de atendimento e desempenho</p>
          </div>

          <div className="flex flex-wrap gap-3">
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

            <Select value={guicheSelecionado} onValueChange={handleChangeGuiche}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o guichê" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os guichês</SelectItem>
                <SelectItem value="1">Guichê 01</SelectItem>
                <SelectItem value="2">Guichê 02</SelectItem>
                <SelectItem value="3">Guichê 03</SelectItem>
                <SelectItem value="4">Guichê 04</SelectItem>
              </SelectContent>
            </Select>

            <Select value={usuarioSelecionado} onValueChange={handleChangeUsuario}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os usuários</SelectItem>
                {usuarios
                  .filter((u) => u.tipo === "atendente")
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={exportarDados} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Atendimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {carregando ? "..." : estatisticasGerais.totalAtendimentos || 0}
              </div>
              <p className="text-sm text-gray-500">No período selecionado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tempo Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">
                {carregando ? "..." : estatisticasGerais.tempoMedioAtendimento || "0 min"}
              </div>
              <p className="text-sm text-gray-500">Por atendimento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Produtividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {carregando ? "..." : estatisticasGerais.produtividadeMedia || "0%"}
              </div>
              <p className="text-sm text-gray-500">Média geral</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Eficiência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {carregando ? "..." : estatisticasGerais.eficienciaGeral || "0%"}
              </div>
              <p className="text-sm text-gray-500">Baseada em IA</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="produtividade" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
            <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
            <TabsTrigger value="tempos">Tempos de Atendimento</TabsTrigger>
            <TabsTrigger value="tipos">Tipos de Atendimento</TabsTrigger>
            <TabsTrigger value="ia">Insights de IA</TabsTrigger>
          </TabsList>

          <TabsContent value="produtividade">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Produtividade por Guichê</CardTitle>
                  <CardDescription>
                    Comparativo de produtividade entre guichês no período {periodoSelecionado}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {carregando ? (
                    <div className="h-full flex items-center justify-center">Carregando dados...</div>
                  ) : (
                    <ProdutividadeChart dados={estatisticasGuiche.produtividadePorGuiche || []} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Atendimentos por Guichê</CardTitle>
                  <CardDescription>Quantidade de atendimentos realizados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {carregando ? (
                      <div className="h-[200px] flex items-center justify-center">Carregando dados...</div>
                    ) : (
                      (estatisticasGuiche.atendimentosPorGuiche || []).map((item: any) => (
                        <div key={item.guiche} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Guichê {item.guiche}</span>
                            <span className="font-bold">{item.total} atendimentos</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{
                                width: `${
                                  (item.total /
                                    Math.max(...estatisticasGuiche.atendimentosPorGuiche.map((g: any) => g.total), 1)) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Produtividade por Usuário</CardTitle>
                  <CardDescription>Top 5 usuários mais produtivos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {carregando ? (
                      <div className="h-[200px] flex items-center justify-center">Carregando dados...</div>
                    ) : (
                      (estatisticasUsuario.produtividadePorUsuario || [])
                        .slice(0, 5)
                        .map((item: any, index: number) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">{item.nome}</span>
                              <span className="font-bold">{item.produtividade}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-green-600 h-2.5 rounded-full"
                                style={{
                                  width: `${
                                    (Number.parseFloat(item.produtividade) /
                                      Math.max(
                                        ...estatisticasUsuario.produtividadePorUsuario.map((u: any) =>
                                          Number.parseFloat(u.produtividade),
                                        ),
                                        100,
                                      )) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tempos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Tempo Médio de Atendimento</CardTitle>
                  <CardDescription>
                    Comparativo de tempo médio por guichê no período {periodoSelecionado}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {carregando ? (
                    <div className="h-full flex items-center justify-center">Carregando dados...</div>
                  ) : (
                    <TempoAtendimentoChart dados={estatisticasGuiche.tempoMedioPorGuiche || []} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tempo Entre Atendimentos</CardTitle>
                  <CardDescription>Intervalo médio entre atendimentos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {carregando ? (
                      <div className="h-[200px] flex items-center justify-center">Carregando dados...</div>
                    ) : (
                      (estatisticasGuiche.tempoEntreAtendimentos || []).map((item: any) => (
                        <div key={item.guiche} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Guichê {item.guiche}</span>
                            <span className="font-bold">{item.tempo}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-amber-500 h-2.5 rounded-full"
                              style={{
                                width: `${
                                  (Number.parseFloat(item.tempo) /
                                    Math.max(
                                      ...estatisticasGuiche.tempoEntreAtendimentos.map((g: any) =>
                                        Number.parseFloat(g.tempo),
                                      ),
                                      1,
                                    )) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tempo por Tipo de Atendimento</CardTitle>
                  <CardDescription>Duração média por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {carregando ? (
                      <div className="h-[200px] flex items-center justify-center">Carregando dados...</div>
                    ) : (
                      (estatisticasGerais.tempoPorTipoAtendimento || []).map((item: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.tipo}</span>
                            <span className="font-bold">{item.tempo}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-purple-600 h-2.5 rounded-full"
                              style={{
                                width: `${
                                  (Number.parseFloat(item.tempo) /
                                    Math.max(
                                      ...estatisticasGerais.tempoPorTipoAtendimento.map((t: any) =>
                                        Number.parseFloat(t.tempo),
                                      ),
                                      1,
                                    )) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tipos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Distribuição por Tipo de Atendimento</CardTitle>
                  <CardDescription>
                    Quantidade de atendimentos por categoria no período {periodoSelecionado}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {carregando ? (
                    <div className="h-full flex items-center justify-center">Carregando dados...</div>
                  ) : (
                    <AtendimentosPorTipoChart dados={estatisticasGerais.atendimentosPorTipo || []} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tipos Mais Frequentes</CardTitle>
                  <CardDescription>Categorias com maior volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {carregando ? (
                      <div className="h-[200px] flex items-center justify-center">Carregando dados...</div>
                    ) : (
                      (estatisticasGerais.atendimentosPorTipo || []).map((item: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.tipo}</span>
                            <span className="font-bold">{item.quantidade} atendimentos</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{
                                width: `${
                                  (item.quantidade /
                                    Math.max(
                                      ...estatisticasGerais.atendimentosPorTipo.map((t: any) => t.quantidade),
                                      1,
                                    )) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Especialização por Guichê</CardTitle>
                  <CardDescription>Tipo de atendimento mais frequente por guichê</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {carregando ? (
                      <div className="h-[200px] flex items-center justify-center">Carregando dados...</div>
                    ) : (
                      (estatisticasGuiche.especializacaoPorGuiche || []).map((item: any) => (
                        <div key={item.guiche} className="p-3 border rounded-md">
                          <div className="font-medium">Guichê {item.guiche}</div>
                          <div className="text-sm text-gray-500">Especialização principal:</div>
                          <div className="font-bold text-blue-600">{item.tipoMaisFrequente}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {item.porcentagem} dos atendimentos deste guichê
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ia">
            <IAInsightsPanel
              periodo={periodoSelecionado}
              guiche={guicheSelecionado}
              usuario={usuarioSelecionado}
              carregando={carregando}
              estatisticas={{
                gerais: estatisticasGerais,
                guiche: estatisticasGuiche,
                usuario: estatisticasUsuario,
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
