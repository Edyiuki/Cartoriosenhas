"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { BackupControlPanel } from "./backup-control-panel"
import { toast } from "@/components/ui/use-toast"

export function AdminSystemSettings() {
  const [settings, setSettings] = useState({
    nomeCartorio: "Cartório de Registro Civil",
    tempoMaximoAtendimento: 15,
    tempoAlertaAtendimento: 10,
    temaEscuro: false,
    volumeNotificacoes: 80,
    tiposSenha: ["Normal", "Prioritário", "Rápido"],
    idioma: "pt-BR",
    mostrarChatPublico: true,
    permitirChatAnonimo: false,
    mostrarEstatisticasPublicas: false,
    permitirReagendamento: true,
    horaInicioExpediente: "08:00",
    horaFimExpediente: "17:00",
    diasFuncionamento: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
    intervaloBackupAutomatico: 30,
  })

  useEffect(() => {
    // Carregar configurações do localStorage
    const savedSettings = localStorage.getItem("configuracoes")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const saveSettings = () => {
    localStorage.setItem("configuracoes", JSON.stringify(settings))
    toast({
      title: "Configurações salvas",
      description: "As configurações do sistema foram atualizadas com sucesso.",
    })
  }

  const resetSettings = () => {
    const defaultSettings = {
      nomeCartorio: "Cartório de Registro Civil",
      tempoMaximoAtendimento: 15,
      tempoAlertaAtendimento: 10,
      temaEscuro: false,
      volumeNotificacoes: 80,
      tiposSenha: ["Normal", "Prioritário", "Rápido"],
      idioma: "pt-BR",
      mostrarChatPublico: true,
      permitirChatAnonimo: false,
      mostrarEstatisticasPublicas: false,
      permitirReagendamento: true,
      horaInicioExpediente: "08:00",
      horaFimExpediente: "17:00",
      diasFuncionamento: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
      intervaloBackupAutomatico: 30,
    }

    setSettings(defaultSettings)
    localStorage.setItem("configuracoes", JSON.stringify(defaultSettings))

    toast({
      title: "Configurações redefinidas",
      description: "As configurações do sistema foram restauradas para os valores padrão.",
    })
  }

  const handleTipoSenhaChange = (index: number, value: string) => {
    const newTipos = [...settings.tiposSenha]
    newTipos[index] = value
    setSettings({ ...settings, tiposSenha: newTipos })
  }

  const addTipoSenha = () => {
    setSettings({
      ...settings,
      tiposSenha: [...settings.tiposSenha, `Tipo ${settings.tiposSenha.length + 1}`],
    })
  }

  const removeTipoSenha = (index: number) => {
    const newTipos = [...settings.tiposSenha]
    newTipos.splice(index, 1)
    setSettings({ ...settings, tiposSenha: newTipos })
  }

  return (
    <Tabs defaultValue="geral" className="w-full">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="geral">Geral</TabsTrigger>
        <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
        <TabsTrigger value="interface">Interface</TabsTrigger>
        <TabsTrigger value="backup">Backup e Dados</TabsTrigger>
      </TabsList>

      <TabsContent value="geral" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
            <CardDescription>Configure as informações básicas do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome-cartorio">Nome do Cartório</Label>
              <Input
                id="nome-cartorio"
                value={settings.nomeCartorio}
                onChange={(e) => setSettings({ ...settings, nomeCartorio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idioma">Idioma do Sistema</Label>
              <Select value={settings.idioma} onValueChange={(value) => setSettings({ ...settings, idioma: value })}>
                <SelectTrigger id="idioma">
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Horário de Funcionamento</Label>
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <Label htmlFor="hora-inicio">Início</Label>
                  <Input
                    id="hora-inicio"
                    type="time"
                    value={settings.horaInicioExpediente}
                    onChange={(e) => setSettings({ ...settings, horaInicioExpediente: e.target.value })}
                  />
                </div>
                <div className="w-1/2">
                  <Label htmlFor="hora-fim">Fim</Label>
                  <Input
                    id="hora-fim"
                    type="time"
                    value={settings.horaFimExpediente}
                    onChange={(e) => setSettings({ ...settings, horaFimExpediente: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={resetSettings}>
                Restaurar Padrões
              </Button>
              <Button onClick={saveSettings}>Salvar Alterações</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="atendimento" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Atendimento</CardTitle>
            <CardDescription>Configure os parâmetros de atendimento e senhas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tempo Máximo de Atendimento (minutos)</Label>
              <Slider
                value={[settings.tempoMaximoAtendimento]}
                min={5}
                max={60}
                step={1}
                onValueChange={(value) => setSettings({ ...settings, tempoMaximoAtendimento: value[0] })}
              />
              <div className="text-right text-sm">{settings.tempoMaximoAtendimento} minutos</div>
            </div>

            <div className="space-y-2">
              <Label>Tempo para Alerta de Atendimento (minutos)</Label>
              <Slider
                value={[settings.tempoAlertaAtendimento]}
                min={1}
                max={settings.tempoMaximoAtendimento}
                step={1}
                onValueChange={(value) => setSettings({ ...settings, tempoAlertaAtendimento: value[0] })}
              />
              <div className="text-right text-sm">{settings.tempoAlertaAtendimento} minutos</div>
            </div>

            <div className="space-y-2">
              <Label>Tipos de Senha</Label>
              <div className="space-y-2">
                {settings.tiposSenha.map((tipo, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={tipo} onChange={(e) => handleTipoSenhaChange(index, e.target.value)} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTipoSenha(index)}
                      disabled={settings.tiposSenha.length <= 1}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addTipoSenha} disabled={settings.tiposSenha.length >= 10}>
                  Adicionar Tipo
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="permitir-reagendamento">Permitir Reagendamento</Label>
                <p className="text-sm text-muted-foreground">Permite que senhas sejam reagendadas para outro dia</p>
              </div>
              <Switch
                id="permitir-reagendamento"
                checked={settings.permitirReagendamento}
                onCheckedChange={(checked) => setSettings({ ...settings, permitirReagendamento: checked })}
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={resetSettings}>
                Restaurar Padrões
              </Button>
              <Button onClick={saveSettings}>Salvar Alterações</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="interface" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Interface</CardTitle>
            <CardDescription>Personalize a aparência e comportamento da interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="tema-escuro">Tema Escuro</Label>
                <p className="text-sm text-muted-foreground">Ativa o modo escuro em toda a interface</p>
              </div>
              <Switch
                id="tema-escuro"
                checked={settings.temaEscuro}
                onCheckedChange={(checked) => setSettings({ ...settings, temaEscuro: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Volume das Notificações</Label>
              <Slider
                value={[settings.volumeNotificacoes]}
                min={0}
                max={100}
                step={5}
                onValueChange={(value) => setSettings({ ...settings, volumeNotificacoes: value[0] })}
              />
              <div className="text-right text-sm">{settings.volumeNotificacoes}%</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="mostrar-chat">Mostrar Chat Público</Label>
                <p className="text-sm text-muted-foreground">Exibe o chat para o público no painel de senhas</p>
              </div>
              <Switch
                id="mostrar-chat"
                checked={settings.mostrarChatPublico}
                onCheckedChange={(checked) => setSettings({ ...settings, mostrarChatPublico: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="chat-anonimo">Permitir Chat Anônimo</Label>
                <p className="text-sm text-muted-foreground">Permite que usuários não identificados enviem mensagens</p>
              </div>
              <Switch
                id="chat-anonimo"
                checked={settings.permitirChatAnonimo}
                onCheckedChange={(checked) => setSettings({ ...settings, permitirChatAnonimo: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="estatisticas-publicas">Mostrar Estatísticas Públicas</Label>
                <p className="text-sm text-muted-foreground">Exibe estatísticas básicas no painel público</p>
              </div>
              <Switch
                id="estatisticas-publicas"
                checked={settings.mostrarEstatisticasPublicas}
                onCheckedChange={(checked) => setSettings({ ...settings, mostrarEstatisticasPublicas: checked })}
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={resetSettings}>
                Restaurar Padrões
              </Button>
              <Button onClick={saveSettings}>Salvar Alterações</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="backup" className="space-y-4">
        <BackupControlPanel />
      </TabsContent>
    </Tabs>
  )
}
