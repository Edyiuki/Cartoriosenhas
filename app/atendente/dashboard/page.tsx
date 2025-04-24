"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bell, LogOut, MessageSquare, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { obterProximasSenhas, chamarProximaSenha, reemitirChamada } from "@/lib/tickets"
import { obterUsuarioAtual, logout } from "@/lib/auth"
import { ChatPanel } from "@/components/chat-panel"

export default function DashboardPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [senhasEmEspera, setSenhasEmEspera] = useState<any[]>([])
  const [ultimaSenhaChamada, setUltimaSenhaChamada] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [atualizando, setAtualizando] = useState(false)

  useEffect(() => {
    const verificarAutenticacao = async () => {
      const user = await obterUsuarioAtual()
      if (!user) {
        router.push("/atendente/login")
        return
      }

      setUsuario(user)
      carregarSenhas()
    }

    verificarAutenticacao()

    // Configurar atualização periódica
    const interval = setInterval(() => {
      carregarSenhas()
    }, 30000) // Atualiza a cada 30 segundos

    return () => clearInterval(interval)
  }, [router])

  const carregarSenhas = async () => {
    setAtualizando(true)
    try {
      const senhas = await obterProximasSenhas()
      setSenhasEmEspera(senhas)
    } catch (error) {
      console.error("Erro ao carregar senhas:", error)
    } finally {
      setAtualizando(false)
    }
  }

  const handleChamarSenha = async (tipo: string, subtipo: string) => {
    if (!usuario) return

    setLoading(true)
    try {
      const senha = await chamarProximaSenha(tipo, subtipo, usuario.guiche)
      if (senha) {
        setUltimaSenhaChamada(senha)
        carregarSenhas()
      }
    } catch (error) {
      console.error("Erro ao chamar senha:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReemitirChamada = async () => {
    if (!ultimaSenhaChamada) return

    try {
      await reemitirChamada(ultimaSenhaChamada.id)
    } catch (error) {
      console.error("Erro ao reemitir chamada:", error)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/atendente/login")
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
            <h1 className="text-3xl font-bold text-blue-800">Painel do Atendente</h1>
            <p className="text-gray-600">
              Guichê {usuario.guiche} - {usuario.nome}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={carregarSenhas}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="chamar" className="space-y-6">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="chamar">Chamar Senhas</TabsTrigger>
                <TabsTrigger value="espera">Senhas em Espera</TabsTrigger>
              </TabsList>

              <TabsContent value="chamar" className="space-y-6">
                {ultimaSenhaChamada && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl text-blue-800">Última Senha Chamada</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-600 text-white text-3xl font-bold p-4 rounded-lg min-w-[80px] text-center">
                            {ultimaSenhaChamada.codigo}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{ultimaSenhaChamada.tipo}</h3>
                            <Badge className={ultimaSenhaChamada.subtipo === "preferencial" ? "bg-green-500" : ""}>
                              {ultimaSenhaChamada.subtipo}
                            </Badge>
                          </div>
                        </div>

                        <Button variant="outline" onClick={handleReemitirChamada} className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Chamar Novamente
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Atendimento Geral</CardTitle>
                      <CardDescription>Chamar próxima senha para atendimento geral</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full" onClick={() => handleChamarSenha("geral", "comum")} disabled={loading}>
                        Chamar Senha Comum
                      </Button>
                      <Button
                        className="w-full"
                        onClick={() => handleChamarSenha("geral", "preferencial")}
                        disabled={loading}
                      >
                        Chamar Senha Preferencial
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Casamento</CardTitle>
                      <CardDescription>Chamar próxima senha para casamento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        className="w-full"
                        onClick={() => handleChamarSenha("casamento", "comum")}
                        disabled={loading}
                      >
                        Chamar Senha Comum
                      </Button>
                      <Button
                        className="w-full"
                        onClick={() => handleChamarSenha("casamento", "preferencial")}
                        disabled={loading}
                      >
                        Chamar Senha Preferencial
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Alteração de Nome</CardTitle>
                      <CardDescription>Chamar próxima senha para alteração de nome</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        className="w-full"
                        onClick={() => handleChamarSenha("alteracao", "comum")}
                        disabled={loading}
                      >
                        Chamar Senha Comum
                      </Button>
                      <Button
                        className="w-full"
                        onClick={() => handleChamarSenha("alteracao", "preferencial")}
                        disabled={loading}
                      >
                        Chamar Senha Preferencial
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Traslado de Registro</CardTitle>
                      <CardDescription>Chamar próxima senha para traslado</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        className="w-full"
                        onClick={() => handleChamarSenha("traslado", "comum")}
                        disabled={loading}
                      >
                        Chamar Senha Comum
                      </Button>
                      <Button
                        className="w-full"
                        onClick={() => handleChamarSenha("traslado", "preferencial")}
                        disabled={loading}
                      >
                        Chamar Senha Preferencial
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Óbito Tardio</CardTitle>
                      <CardDescription>Chamar próxima senha para óbito tardio</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        className="w-full"
                        onClick={() => handleChamarSenha("obito", "tardio")}
                        disabled={loading}
                      >
                        Chamar Óbito Tardio Regular
                      </Button>

                      {usuario.guiche === "1" && (
                        <Button
                          className="w-full"
                          onClick={() => handleChamarSenha("obito", "indigente")}
                          disabled={loading}
                        >
                          Chamar Óbito Tardio Indigente
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

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
                              <Button
                                size="sm"
                                onClick={() => handleChamarSenha(senha.tipo, senha.subtipo)}
                                disabled={loading}
                              >
                                Chamar
                              </Button>
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
            </Tabs>
          </div>

          <div>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Comunicação Interna</span>
                </CardTitle>
                <CardDescription>Comunique-se com outros atendentes</CardDescription>
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
