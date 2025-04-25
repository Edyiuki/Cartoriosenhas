"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, RefreshCw, CloudUpload, Download } from "lucide-react"
import { FirebaseConfigForm } from "@/components/firebase-config-form"
import { isFirebaseConfigured } from "@/lib/firebase"
import { realizarBackupAutomatico, listarBackups, configurarBackupAutomatico, restaurarBackup } from "@/lib/backup"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function AdminSystemSettings() {
  const [salvando, setSalvando] = useState(false)
  const [backupStatus, setBackupStatus] = useState("")
  const [backups, setBackups] = useState<{ id: string; nome: string; url: string; data: string }[]>([])
  const [carregandoBackups, setCarregandoBackups] = useState(false)
  const [restaurandoBackup, setRestaurandoBackup] = useState(false)
  const [backupSelecionado, setBackupSelecionado] = useState("")
  const [configuracoes, setConfiguracoes] = useState({
    // Configurações gerais
    nomeCartorio: localStorage.getItem("config_nomeCartorio") || "Cartório de Registro Civil",
    tempoAtualizacao: localStorage.getItem("config_tempoAtualizacao") || "30",
    temaEscuro: localStorage.getItem("config_temaEscuro") === "true",

    // Configurações de senhas
    prefixoGeral: localStorage.getItem("config_prefixoGeral") || "G",
    prefixoCasamento: localStorage.getItem("config_prefixoCasamento") || "C",
    prefixoAlteracao: localStorage.getItem("config_prefixoAlteracao") || "A",
    prefixoTraslado: localStorage.getItem("config_prefixoTraslado") || "T",
    prefixoObito: localStorage.getItem("config_prefixoObito") || "O",

    // Configurações de áudio
    audioAtivo: localStorage.getItem("config_audioAtivo") !== "false",
    repeticoesAudio: localStorage.getItem("config_repeticoesAudio") || "2",
    velocidadeAudio: localStorage.getItem("config_velocidadeAudio") || "0.9",

    // Configurações de notificações
    notificacoesAtivas: localStorage.getItem("config_notificacoesAtivas") !== "false",
    notificacoesDesktop: localStorage.getItem("config_notificacoesDesktop") !== "false",

    // Configurações de backup
    backupAutomatico: localStorage.getItem("config_backupAutomatico") !== "false",
    intervaloBackup: localStorage.getItem("config_intervaloBackup") || "60",
  })

  useEffect(() => {
    // Carregar backups disponíveis se o Firebase estiver configurado
    const carregarBackups = async () => {
      if (isFirebaseConfigured()) {
        setCarregandoBackups(true)
        try {
          const listaBackups = await listarBackups()
          setBackups(listaBackups)
        } catch (error) {
          console.error("Erro ao carregar backups:", error)
        } finally {
          setCarregandoBackups(false)
        }
      }
    }

    carregarBackups()
  }, [])

  // Configurar backup automático quando as configurações mudarem
  useEffect(() => {
    if (configuracoes.backupAutomatico && isFirebaseConfigured()) {
      const intervalo = Number.parseInt(configuracoes.intervaloBackup) || 60
      configurarBackupAutomatico(intervalo)
    }
  }, [configuracoes.backupAutomatico, configuracoes.intervaloBackup])

  const salvarConfiguracoes = () => {
    setSalvando(true)

    // Salvar todas as configurações no localStorage
    Object.entries(configuracoes).forEach(([chave, valor]) => {
      localStorage.setItem(`config_${chave}`, valor.toString())
    })

    // Configurar backup automático se estiver ativado
    if (configuracoes.backupAutomatico && isFirebaseConfigured()) {
      const intervalo = Number.parseInt(configuracoes.intervaloBackup) || 60
      configurarBackupAutomatico(intervalo)
    }

    // Simular tempo de salvamento
    setTimeout(() => {
      setSalvando(false)
    }, 800)
  }

  const handleChange = (chave: string, valor: string | boolean) => {
    setConfiguracoes((prev) => ({
      ...prev,
      [chave]: valor,
    }))
  }

  const handleBackupManual = async () => {
    setBackupStatus("Realizando backup...")
    try {
      const url = await realizarBackupAutomatico()
      if (url) {
        setBackupStatus(`Backup realizado com sucesso!`)

        // Atualizar lista de backups
        const listaBackups = await listarBackups()
        setBackups(listaBackups)
      } else {
        setBackupStatus("Falha ao realizar backup. Verifique a configuração do Firebase.")
      }
    } catch (error) {
      console.error("Erro ao realizar backup:", error)
      setBackupStatus(`Erro ao realizar backup: ${error.message}`)
    }
  }

  const handleRestaurarBackup = async () => {
    if (!backupSelecionado) {
      setBackupStatus("Selecione um backup para restaurar")
      return
    }

    setRestaurandoBackup(true)
    setBackupStatus("Restaurando backup...")

    try {
      const backup = backups.find((b) => b.id === backupSelecionado)
      if (!backup) {
        throw new Error("Backup não encontrado")
      }

      const sucesso = await restaurarBackup(backup.url)
      if (sucesso) {
        setBackupStatus("Backup restaurado com sucesso! A página será recarregada.")
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setBackupStatus("Falha ao restaurar backup.")
      }
    } catch (error) {
      console.error("Erro ao restaurar backup:", error)
      setBackupStatus(`Erro ao restaurar backup: ${error.message}`)
    } finally {
      setRestaurandoBackup(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="senhas">Senhas</TabsTrigger>
          <TabsTrigger value="audio">Áudio</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>Configurações básicas do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomeCartorio">Nome do Cartório</Label>
                <Input
                  id="nomeCartorio"
                  value={configuracoes.nomeCartorio}
                  onChange={(e) => handleChange("nomeCartorio", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempoAtualizacao">Tempo de Atualização (segundos)</Label>
                <Input
                  id="tempoAtualizacao"
                  type="number"
                  min="5"
                  max="120"
                  value={configuracoes.tempoAtualizacao}
                  onChange={(e) => handleChange("tempoAtualizacao", e.target.value)}
                />
                <p className="text-xs text-gray-500">Tempo para atualização automática dos dados</p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="temaEscuro">Tema Escuro</Label>
                <Switch
                  id="temaEscuro"
                  checked={configuracoes.temaEscuro}
                  onCheckedChange={(checked) => handleChange("temaEscuro", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="senhas">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Senhas</CardTitle>
              <CardDescription>Prefixos e formatação das senhas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prefixoGeral">Prefixo - Geral</Label>
                  <Input
                    id="prefixoGeral"
                    maxLength={1}
                    value={configuracoes.prefixoGeral}
                    onChange={(e) => handleChange("prefixoGeral", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prefixoCasamento">Prefixo - Casamento</Label>
                  <Input
                    id="prefixoCasamento"
                    maxLength={1}
                    value={configuracoes.prefixoCasamento}
                    onChange={(e) => handleChange("prefixoCasamento", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prefixoAlteracao">Prefixo - Alteração</Label>
                  <Input
                    id="prefixoAlteracao"
                    maxLength={1}
                    value={configuracoes.prefixoAlteracao}
                    onChange={(e) => handleChange("prefixoAlteracao", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prefixoTraslado">Prefixo - Traslado</Label>
                  <Input
                    id="prefixoTraslado"
                    maxLength={1}
                    value={configuracoes.prefixoTraslado}
                    onChange={(e) => handleChange("prefixoTraslado", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prefixoObito">Prefixo - Óbito</Label>
                  <Input
                    id="prefixoObito"
                    maxLength={1}
                    value={configuracoes.prefixoObito}
                    onChange={(e) => handleChange("prefixoObito", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Áudio</CardTitle>
              <CardDescription>Configurações para anúncios de voz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="audioAtivo">Áudio Ativo</Label>
                <Switch
                  id="audioAtivo"
                  checked={configuracoes.audioAtivo}
                  onCheckedChange={(checked) => handleChange("audioAtivo", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repeticoesAudio">Repetições de Áudio</Label>
                <Select
                  value={configuracoes.repeticoesAudio}
                  onValueChange={(value) => handleChange("repeticoesAudio", value)}
                >
                  <SelectTrigger id="repeticoesAudio">
                    <SelectValue placeholder="Selecione o número de repetições" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 vez</SelectItem>
                    <SelectItem value="2">2 vezes</SelectItem>
                    <SelectItem value="3">3 vezes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Quantas vezes o áudio será repetido</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="velocidadeAudio">Velocidade do Áudio</Label>
                <Select
                  value={configuracoes.velocidadeAudio}
                  onValueChange={(value) => handleChange("velocidadeAudio", value)}
                >
                  <SelectTrigger id="velocidadeAudio">
                    <SelectValue placeholder="Selecione a velocidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.7">Lenta</SelectItem>
                    <SelectItem value="0.9">Normal</SelectItem>
                    <SelectItem value="1.1">Rápida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>Configurações para notificações do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notificacoesAtivas">Notificações Ativas</Label>
                <Switch
                  id="notificacoesAtivas"
                  checked={configuracoes.notificacoesAtivas}
                  onCheckedChange={(checked) => handleChange("notificacoesAtivas", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notificacoesDesktop">Notificações Desktop</Label>
                <Switch
                  id="notificacoesDesktop"
                  checked={configuracoes.notificacoesDesktop}
                  onCheckedChange={(checked) => handleChange("notificacoesDesktop", checked)}
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (Notification && Notification.permission !== "granted") {
                      Notification.requestPermission()
                    }
                  }}
                >
                  Solicitar Permissão de Notificações
                </Button>
                <p className="text-xs text-gray-500 mt-1">Necessário para exibir notificações no desktop</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <FirebaseConfigForm />
            </div>

            {isFirebaseConfigured() && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CloudUpload className="h-5 w-5" />
                      Backup Automático
                    </CardTitle>
                    <CardDescription>Configure o backup automático dos dados</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="backupAutomatico">Backup Automático</Label>
                      <Switch
                        id="backupAutomatico"
                        checked={configuracoes.backupAutomatico}
                        onCheckedChange={(checked) => handleChange("backupAutomatico", checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="intervaloBackup">Intervalo de Backup (minutos)</Label>
                      <Input
                        id="intervaloBackup"
                        type="number"
                        min="15"
                        max="1440"
                        value={configuracoes.intervaloBackup}
                        onChange={(e) => handleChange("intervaloBackup", e.target.value)}
                        disabled={!configuracoes.backupAutomatico}
                      />
                      <p className="text-xs text-gray-500">Intervalo entre backups automáticos (mínimo 15 minutos)</p>
                    </div>

                    <div className="pt-2">
                      <Button onClick={handleBackupManual} className="w-full flex items-center gap-2">
                        <CloudUpload className="h-4 w-4" />
                        Realizar Backup Manual
                      </Button>
                      {backupStatus && <p className="text-xs text-center mt-2">{backupStatus}</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Restaurar Backup
                    </CardTitle>
                    <CardDescription>Restaure dados de um backup anterior</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {carregandoBackups ? (
                      <div className="text-center py-4">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Carregando backups disponíveis...</p>
                      </div>
                    ) : backups.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Nenhum backup disponível</AlertTitle>
                        <AlertDescription>
                          Realize um backup manual ou aguarde o próximo backup automático.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="backupSelecionado">Selecione um backup</Label>
                          <Select value={backupSelecionado} onValueChange={setBackupSelecionado}>
                            <SelectTrigger id="backupSelecionado">
                              <SelectValue placeholder="Selecione um backup" />
                            </SelectTrigger>
                            <SelectContent>
                              {backups.map((backup) => (
                                <SelectItem key={backup.id} value={backup.id}>
                                  {backup.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          onClick={handleRestaurarBackup}
                          variant="outline"
                          disabled={!backupSelecionado || restaurandoBackup}
                          className="w-full flex items-center gap-2"
                        >
                          {restaurandoBackup ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Restaurando...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Restaurar Backup Selecionado
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={salvarConfiguracoes} disabled={salvando} className="flex items-center gap-2">
          {salvando ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
