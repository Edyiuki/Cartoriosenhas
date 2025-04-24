"use client"

import { Input } from "@/components/ui/input"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LogOut, Users, BarChart3, Download, Upload, RefreshCw, Save, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { obterUsuarioAtual, logout, obterTodosUsuarios } from "@/lib/auth"
import { obterTodasSenhas, exportarDadosSenhas, importarDadosSenhas } from "@/lib/tickets"
import { AdminChatPanel } from "@/components/admin-chat-panel"
import { AdminAIAssistant } from "@/components/admin-ai-assistant"
import { AdminUserManagement } from "@/components/admin-user-management"
import { AdminSystemSettings } from "@/components/admin-system-settings"
import { AdminDashboardCharts } from "@/components/admin-dashboard-charts"
import Link from "next/link"
import Image from "next/image"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [estatisticas, setEstatisticas] = useState({
    totalSenhas: 0,
    senhasEmEspera: 0,
    senhasChamadas: 0,
    senhasFinalizadas: 0,
    totalUsuarios: 0,
  })
  const [carregando, setCarregando] = useState(true)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importStatus, setImportStatus] = useState("")
  const [showThothChat, setShowThothChat] = useState(false)

  useEffect(() => {
    const verificarAutenticacao = async () => {
      const user = await obterUsuarioAtual()
      if (!user || user.tipo !== "admin") {
        router.push("/admin/login")
        return
      }

      setUsuario(user)
      await carregarDados()
    }

    verificarAutenticacao()

    // Configurar atualização periódica
    const interval = setInterval(() => {
      carregarDados()
    }, 60000) // Atualiza a cada minuto

    return () => clearInterval(interval)
  }, [router])

  const carregarDados = async () => {
    setCarregando(true)
    try {
      const [senhas, usuarios] = await Promise.all([obterTodasSenhas(), obterTodosUsuarios()])

      setEstatisticas({
        totalSenhas: senhas.length,
        senhasEmEspera: senhas.filter((s) => s.status === "aguardando").length,
        senhasChamadas: senhas.filter((s) => s.status === "chamado").length,
        senhasFinalizadas: senhas.filter((s) => s.status === "finalizado").length,
        totalUsuarios: usuarios.length,
      })
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setCarregando(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/admin/login")
  }

  const handleExportarDados = () => {
    const dadosJSON = exportarDadosSenhas()
    const blob = new Blob([dadosJSON], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `backup-cartorio-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0])
    }
  }

  const handleImportarDados = async () => {
    if (!importFile) {
      setImportStatus("Selecione um arquivo para importar")
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          const success = importarDadosSenhas(e.target.result as string)
          if (success) {
            setImportStatus("Dados importados com sucesso!")
            carregarDados()
          } else {
            setImportStatus("Erro ao importar dados. Verifique o formato do arquivo.")
          }
        }
      }
      reader.readAsText(importFile)
    } catch (error) {
      setImportStatus("Erro ao processar arquivo")
      console.error("Erro ao importar dados:", error)
    }
  }

  const toggleThothChat = () => {
    setShowThothChat(!showThothChat)
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
      {/* Thoth Chat Flutuante */}
      {showThothChat && (
        <div className="fixed left-4 bottom-4 w-80 h-96 bg-white rounded-lg shadow-lg z-50 flex flex-col">
          <div className="bg-purple-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative h-6 w-6">
                <Image src="/thoth-icon.png" alt="Thoth" width={24} height={24} />
              </div>
              <span className="font-medium">Thoth - Assistente IA</span>
            </div>
            <button onClick={toggleThothChat} className="text-white hover:text-gray-200">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
            <div className="flex justify-start mb-3">
              <div className="max-w-[80%] rounded-lg p-2 bg-white border border-gray-200">
                <div className="flex items-center gap-1 mb-1">
                  <div className="relative h-5 w-5">
                    <Image src="/thoth-icon.png" alt="Thoth" width={20} height={20} />
                  </div>
                  <span className="text-xs font-medium text-purple-600">Thoth</span>
                </div>
                <p className="text-xs">
                  Olá! Como posso ajudar você hoje? Estou aqui para responder suas perguntas sobre o sistema.
                </p>
              </div>
            </div>
          </div>
          <div className="p-2 border-t">
            <div className="flex gap-2">
              <Input placeholder="Digite sua mensagem..." className="text-sm" />
              <Button size="sm" className="px-2">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Botão flutuante para abrir o chat com Thoth */}
      {!showThothChat && (
        <button
          onClick={toggleThothChat}
          className="fixed left-4 bottom-4 bg-purple-600 text-white p-3 rounded-full shadow-lg z-50 hover:bg-purple-700 transition-colors"
        >
          <div className="relative h-6 w-6">
            <Image src="/thoth-icon.png" alt="Thoth" width={24} height={24} className="animate-bounce" />
          </div>
        </button>
      )}

      <div className="container mx-auto px-4 py-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Painel do Administrador</h1>
            <p className="text-gray-600">Gerenciamento completo do sistema</p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDados}
              disabled={carregando}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} />
              Atualizar
            </Button>

            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Senhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{estatisticas.totalSenhas}</div>
              <p className="text-sm text-gray-500">Senhas emitidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge className="h-4 w-4 bg-amber-500" />
                Em Espera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{estatisticas.senhasEmEspera}</div>
              <p className="text-sm text-gray-500">Aguardando atendimento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge className="h-4 w-4 bg-green-500" />
                Finalizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{estatisticas.senhasFinalizadas}</div>
              <p className="text-sm text-gray-500">Atendimentos concluídos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{estatisticas.totalUsuarios}</div>
              <p className="text-sm text-gray-500">Usuários registrados</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
            <TabsTrigger value="ia">Assistente IA</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboardCharts />
          </TabsContent>

          <TabsContent value="estatisticas">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Análise de Produtividade
                  </CardTitle>
                  <CardDescription>Visualize estatísticas detalhadas de atendimento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Acesse o painel completo de estatísticas para visualizar dados detalhados sobre a produtividade dos
                    guichês, tempos de atendimento e análises avançadas.
                  </p>
                  <Link href="/admin/estatisticas">
                    <Button className="w-full">Ver Estatísticas Detalhadas</Button>
                  </Link>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Backup de Dados</CardTitle>
                    <CardDescription>Exporte e importe dados do sistema</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Button onClick={handleExportarDados} className="w-full flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Exportar Dados
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        Salva todas as senhas, histórico de atendimentos e configurações em um arquivo JSON.
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Importar Backup</label>
                        <Input type="file" accept=".json" onChange={handleFileChange} />
                        <Button
                          onClick={handleImportarDados}
                          variant="outline"
                          className="w-full flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Importar Dados
                        </Button>
                        {importStatus && <p className="text-xs text-center mt-1">{importStatus}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Persistência de Dados</CardTitle>
                    <CardDescription>Informações sobre armazenamento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Senhas armazenadas:</span>
                        <span>{estatisticas.totalSenhas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Usuários registrados:</span>
                        <span>{estatisticas.totalUsuarios}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Último backup:</span>
                        <span>{localStorage.getItem("ultimoBackup") || "Nunca"}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full flex items-center gap-2"
                      onClick={() => {
                        localStorage.setItem("ultimoBackup", new Date().toLocaleString())
                        setImportStatus("Backup automático realizado com sucesso!")
                      }}
                    >
                      <Save className="h-4 w-4" />
                      Realizar Backup Automático
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="usuarios">
            <AdminUserManagement />
          </TabsContent>

          <TabsContent value="mensagens">
            <AdminChatPanel usuario={usuario} />
          </TabsContent>

          <TabsContent value="ia">
            <AdminAIAssistant />
          </TabsContent>

          <TabsContent value="configuracoes">
            <AdminSystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
