"use client"

import { Label } from "@/components/ui/label"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bell, LogOut, MessageSquare, RefreshCw, ArrowRight, Users, BarChart3, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { obterProximasSenhas, reemitirChamada, direcionarSenha, obterTodasSenhas } from "@/lib/tickets"
import { obterUsuarioAtual, logout } from "@/lib/auth"
import { ChatPanel } from "@/components/chat-panel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GuicheStatusPanel } from "@/components/guiche-status-panel"

export default function DashboardRecepcaoPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [senhasEmEspera, setSenhasEmEspera] = useState<any[]>([])
  const [senhasChamadas, setSenhasChamadas] = useState<any[]>([])
  const [ultimaSenhaChamada, setUltimaSenhaChamada] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [atualizando, setAtualizando] = useState(false)
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    emEspera: 0,
    chamadas: 0,
    tempoMedioEspera: "0 min",
  })
  const [senhaSelecionada, setSenhaSelecionada] = useState<string | null>(null)
  const [guicheSelecionado, setGuicheSelecionado] = useState<string>("")

  useEffect(() => {
    const verificarAutenticacao = async () => {
      const user = await obterUsuarioAtual()
      if (!user || user.tipo !== "recepcao") {
        router.push("/recepcao/login")
        return
      }

      setUsuario(user)
      carregarDados()
    }

    verificarAutenticacao()

    // Configurar atualização periódica
    const interval = setInterval(() => {
      carregarDados()
    }, 30000) // Atualiza a cada 30 segundos

    return () => clearInterval(interval)
  }, [router])

  const carregarDados = async () => {
    setAtualizando(true)
    try {
      const [senhasEspera, senhasChamadas, todasSenhas] = await Promise.all([
        obterProximasSenhas(),
        obterProximasSenhas("chamado"),
        obterTodasSenhas(),
      ])

      setSenhasEmEspera(senhasEspera)
      setSenhasChamadas(senhasChamadas.slice(0, 10))

      // Calcular estatísticas
      const totalSenhas = todasSenhas.length
      const emEspera = senhasEspera.length
      const chamadas = todasSenhas.filter((s) => s.status === "chamado").length

      // Calcular tempo médio de espera para senhas chamadas
      const senhasChamadasComTempo = todasSenhas.filter((s) => s.status === "chamado" && s.horaChamada && s.horaEmissao)
      let tempoMedioMs = 0
      if (senhasChamadasComTempo.length > 0) {
        const tempoTotal = senhasChamadasComTempo.reduce(
          (acc, senha) => acc + (senha.horaChamada - senha.horaEmissao),
          0,
        )
        tempoMedioMs = tempoTotal / senhasChamadasComTempo.length
      }
      const tempoMedioMin = Math.round(tempoMedioMs / (1000 * 60))

      setEstatisticas({
        total: totalSenhas,
        emEspera,
        chamadas,
        tempoMedioEspera: `${tempoMedioMin} min`,
      })
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setAtualizando(false)
    }
  }

  const handleDirecionarSenha = async () => {
    if (!senhaSelecionada || !guicheSelecionado) return

    setLoading(true)
    try {
      await direcionarSenha(senhaSelecionada, guicheSelecionado)
      carregarDados()
      setSenhaSelecionada(null)
      setGuicheSelecionado("")
    } catch (error) {
      console.error("Erro ao direcionar senha:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReemitirChamada = async (senhaId: string) => {
    try {
      await reemitirChamada(senhaId)
    } catch (error) {
      console.error("Erro ao reemitir chamada:", error)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/recepcao/login")
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
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Painel da Recepção</h1>
            <p className="text-gray-600">Gerenciamento central de senhas e atendimentos</p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDados}
              disabled={atualizando}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
              Atualizar
            </Button>

            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Senhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{estatisticas.total}</div>
              <p className="text-sm text-gray-500">Senhas emitidas hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Em Espera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{estatisticas.emEspera}</div>
              <p className="text-sm text-gray-500">Senhas aguardando atendimento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Chamadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{estatisticas.chamadas}</div>
              <p className="text-sm text-gray-500">Senhas já chamadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Tempo Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{estatisticas.tempoMedioEspera}</div>
              <p className="text-sm text-gray-500">Tempo médio de espera</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="espera" className="space-y-6">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="espera">Senhas em Espera</TabsTrigger>
                <TabsTrigger value="chamadas">Senhas Chamadas</TabsTrigger>
                <TabsTrigger value="direcionar">Direcionar Senhas</TabsTrigger>
              </TabsList>

              <TabsContent value="espera">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">Senhas em Espera</CardTitle>
                    <CardDescription>
                      Total: {senhasEmEspera.length} {senhasEmEspera.length === 1 ? "senha" : "senhas"} em espera
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {senhasEmEspera.length > 0 ? (
                      <div className="space-y-3">
                        {senhasEmEspera.map((senha) => (
                          <div key={senha.id} className="flex justify-between items-center p-3 rounded-md bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="font-bold text-lg min-w-[40px] text-center text-gray-600">
                                {senha.codigo}
                              </div>
                              <div>
                                <div className="font-medium">{senha.tipo}</div>
                                <Badge
                                  className={
                                    senha.subtipo === "preferencial"
                                      ? "bg-green-500"
                                      : senha.subtipo === "tardio"
                                        ? "bg-purple-500"
                                        : senha.subtipo === "indigente"
                                          ? "bg-red-500"
                                          : ""
                                  }
                                >
                                  {senha.subtipo}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-xs text-gray-500">Tempo de espera</div>
                                <div className="text-sm">{senha.tempoEspera}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">Não há senhas em espera</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chamadas">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">Últimas Senhas Chamadas</CardTitle>
                    <CardDescription>Senhas recentemente chamadas para atendimento</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {senhasChamadas.length > 0 ? (
                      <div className="space-y-3">
                        {senhasChamadas.map((senha) => (
                          <div key={senha.id} className="flex justify-between items-center p-3 rounded-md bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="font-bold text-lg min-w-[40px] text-center text-gray-600">
                                {senha.codigo}
                              </div>
                              <div>
                                <div className="font-medium">{senha.tipo}</div>
                                <Badge
                                  className={
                                    senha.subtipo === "preferencial"
                                      ? "bg-green-500"
                                      : senha.subtipo === "tardio"
                                        ? "bg-purple-500"
                                        : senha.subtipo === "indigente"
                                          ? "bg-red-500"
                                          : ""
                                  }
                                >
                                  {senha.subtipo}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <div className="text-xs text-gray-500">Guichê</div>
                                <div className="font-semibold">{senha.guiche}</div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReemitirChamada(senha.id)}
                                className="flex items-center gap-1"
                              >
                                <Bell className="h-3 w-3" />
                                Reanunciar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">Nenhuma senha foi chamada ainda</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="direcionar">
                <Card>
                  <CardHeader>
                    <CardTitle>Direcionar Senhas</CardTitle>
                    <CardDescription>Encaminhe senhas para guichês específicos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="senha">Selecione a Senha</Label>
                      <Select value={senhaSelecionada || ""} onValueChange={setSenhaSelecionada}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma senha" />
                        </SelectTrigger>
                        <SelectContent>
                          {senhasEmEspera.map((senha) => (
                            <SelectItem key={senha.id} value={senha.id}>
                              {senha.codigo} - {senha.tipo} ({senha.subtipo})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guiche">Selecione o Guichê</Label>
                      <Select value={guicheSelecionado} onValueChange={setGuicheSelecionado}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um guichê" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Guichê 01 - Óbito Tardio</SelectItem>
                          <SelectItem value="2">Guichê 02 - Atendimentos gerais</SelectItem>
                          <SelectItem value="3">Guichê 03 - Alteração de nome e traslados</SelectItem>
                          <SelectItem value="4">Guichê 04 - Casamento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleDirecionarSenha}
                      disabled={loading || !senhaSelecionada || !guicheSelecionado}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Direcionar Senha
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>Status dos Guichês</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <GuicheStatusPanel isRecepcao={true} />
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Comunicação</span>
                </CardTitle>
                <CardDescription>Comunique-se com os atendentes</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ChatPanel usuario={usuario} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
