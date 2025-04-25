"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, User, Megaphone, MessageSquare } from "lucide-react"
import { enviarMensagem, obterMensagens, escutarMensagens } from "@/lib/chat"
import { obterTodosUsuarios } from "@/lib/auth"
import { formatarHora } from "@/lib/utils"

interface AdminChatPanelProps {
  usuario: {
    id: string
    nome: string
    tipo: string
  }
}

export function AdminChatPanel({ usuario }: AdminChatPanelProps) {
  const [mensagens, setMensagens] = useState<any[]>([])
  const [mensagensPrivadas, setMensagensPrivadas] = useState<Record<string, any[]>>({})
  const [novaMensagem, setNovaMensagem] = useState("")
  const [novoAnuncio, setNovoAnuncio] = useState("")
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string>("")
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [novaMensagemPrivada, setNovaMensagemPrivada] = useState("")
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatPrivadoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const carregarDados = async () => {
      const [msgs, users] = await Promise.all([obterMensagens(), obterTodosUsuarios()])

      setMensagens(msgs)
      setUsuarios(users.filter((u: any) => u.tipo !== "admin"))

      // Carregar mensagens privadas
      const mensagensPrivadasSalvas = localStorage.getItem("mensagensPrivadas")
      if (mensagensPrivadasSalvas) {
        setMensagensPrivadas(JSON.parse(mensagensPrivadasSalvas))
      }

      // Rolar para o final
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, 100)
    }

    carregarDados()

    // Configurar listener para novas mensagens
    const unsubscribe = escutarMensagens((novaMensagem) => {
      setMensagens((prev) => [...prev, novaMensagem])

      // Se for uma mensagem privada, atualizar também o estado de mensagens privadas
      if (
        novaMensagem.privada &&
        (novaMensagem.destinatarioId === usuario.id || novaMensagem.usuarioId === usuario.id)
      ) {
        const outroUsuarioId =
          novaMensagem.usuarioId === usuario.id ? novaMensagem.destinatarioId : novaMensagem.usuarioId

        setMensagensPrivadas((prev) => {
          const novasMensagens = { ...prev }
          if (!novasMensagens[outroUsuarioId]) {
            novasMensagens[outroUsuarioId] = []
          }
          novasMensagens[outroUsuarioId] = [...novasMensagens[outroUsuarioId], novaMensagem]

          // Salvar no localStorage
          localStorage.setItem("mensagensPrivadas", JSON.stringify(novasMensagens))

          return novasMensagens
        })
      }

      // Rolar para o final
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
        if (chatPrivadoRef.current) {
          chatPrivadoRef.current.scrollTop = chatPrivadoRef.current.scrollHeight
        }
      }, 100)
    })

    return () => {
      unsubscribe()
    }
  }, [usuario.id])

  useEffect(() => {
    // Rolar para o final quando mudar de usuário selecionado
    setTimeout(() => {
      if (chatPrivadoRef.current) {
        chatPrivadoRef.current.scrollTop = chatPrivadoRef.current.scrollHeight
      }
    }, 100)
  }, [usuarioSelecionado])

  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim()) return

    await enviarMensagem({
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      guiche: "Admin",
      texto: novaMensagem,
      timestamp: Date.now(),
      tipo: usuario.tipo,
    })

    setNovaMensagem("")
  }

  const handleEnviarAnuncio = async () => {
    if (!novoAnuncio.trim()) return

    await enviarMensagem({
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      guiche: "Admin",
      texto: novoAnuncio,
      timestamp: Date.now(),
      tipo: "anuncio",
    })

    setNovoAnuncio("")
  }

  const handleEnviarMensagemPrivada = async () => {
    if (!novaMensagemPrivada.trim() || !usuarioSelecionado) return

    const usuarioDestino = usuarios.find((u) => u.id === usuarioSelecionado)
    if (!usuarioDestino) return

    const novaMensagem = {
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      destinatarioId: usuarioSelecionado,
      destinatarioNome: usuarioDestino.nome,
      guiche: "Admin",
      texto: novaMensagemPrivada,
      timestamp: Date.now(),
      tipo: "mensagem",
      privada: true,
    }

    // Salvar mensagem privada
    setMensagensPrivadas((prev) => {
      const novasMensagens = { ...prev }
      if (!novasMensagens[usuarioSelecionado]) {
        novasMensagens[usuarioSelecionado] = []
      }
      novasMensagens[usuarioSelecionado] = [...novasMensagens[usuarioSelecionado], novaMensagem]

      // Salvar no localStorage
      localStorage.setItem("mensagensPrivadas", JSON.stringify(novasMensagens))

      return novasMensagens
    })

    // Simular envio (em um sistema real, isso seria enviado para o servidor)
    // e recebido pelo destinatário via websocket ou polling

    setNovaMensagemPrivada("")

    // Rolar para o final
    setTimeout(() => {
      if (chatPrivadoRef.current) {
        chatPrivadoRef.current.scrollTop = chatPrivadoRef.current.scrollHeight
      }
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent, tipo: string) => {
    if (e.key === "Enter") {
      if (tipo === "geral") {
        handleEnviarMensagem()
      } else if (tipo === "anuncio") {
        handleEnviarAnuncio()
      } else if (tipo === "privado") {
        handleEnviarMensagemPrivada()
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Sistema de Mensagens</CardTitle>
          <CardDescription>Gerencie a comunicação entre todos os usuários do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="geral" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="geral">Chat Geral</TabsTrigger>
              <TabsTrigger value="anuncios">Anúncios Globais</TabsTrigger>
              <TabsTrigger value="privado">Mensagens Privadas</TabsTrigger>
            </TabsList>

            <TabsContent value="geral">
              <div className="space-y-4">
                <div
                  ref={chatContainerRef}
                  className="h-[400px] overflow-y-auto border rounded-md p-4 bg-gray-50 space-y-3"
                >
                  {mensagens.filter((m) => !m.privada).length > 0 ? (
                    mensagens
                      .filter((m) => !m.privada)
                      .map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.usuarioId === usuario.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-2 ${
                              msg.tipo === "anuncio"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : msg.usuarioId === "sistema"
                                  ? "bg-gray-200 text-gray-700"
                                  : msg.usuarioId === usuario.id
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-white border text-gray-800"
                            }`}
                          >
                            {msg.tipo === "anuncio" && (
                              <div className="flex items-center gap-1 mb-1 text-xs font-medium text-blue-600">
                                <Megaphone className="h-3 w-3" />
                                <span>ANÚNCIO GLOBAL</span>
                              </div>
                            )}

                            {msg.usuarioId !== "sistema" && msg.usuarioId !== usuario.id && (
                              <div className="flex items-center gap-1 mb-1 text-xs text-gray-500">
                                <User className="h-3 w-3" />
                                <span>
                                  {msg.usuarioNome} ({msg.guiche})
                                </span>
                              </div>
                            )}
                            <p className="text-sm">{msg.texto}</p>
                            <div className="text-right text-xs text-gray-500 mt-1">{formatarHora(msg.timestamp)}</div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">Nenhuma mensagem ainda</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "geral")}
                  />
                  <Button onClick={handleEnviarMensagem}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="anuncios">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-1 text-blue-800">
                    <Megaphone className="h-4 w-4" />
                    Enviar Anúncio Global
                  </h3>
                  <p className="text-xs text-blue-600 mb-4">
                    Os anúncios globais são destacados para todos os usuários do sistema e podem ser usados para
                    comunicar informações importantes.
                  </p>
                  <div className="space-y-2">
                    <Input
                      placeholder="Digite o anúncio global..."
                      value={novoAnuncio}
                      onChange={(e) => setNovoAnuncio(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, "anuncio")}
                    />
                    <Button onClick={handleEnviarAnuncio} className="w-full">
                      <Megaphone className="h-4 w-4 mr-2" />
                      Enviar Anúncio Global
                    </Button>
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-gray-50">
                  <h3 className="text-sm font-medium mb-2">Histórico de Anúncios</h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {mensagens.filter((m) => m.tipo === "anuncio").length > 0 ? (
                      mensagens
                        .filter((m) => m.tipo === "anuncio")
                        .map((msg, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-2">
                            <div className="flex items-center gap-1 mb-1 text-xs font-medium text-blue-600">
                              <Megaphone className="h-3 w-3" />
                              <span>ANÚNCIO GLOBAL</span>
                            </div>
                            <p className="text-sm">{msg.texto}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-500">{msg.usuarioNome}</span>
                              <span className="text-xs text-gray-500">{formatarHora(msg.timestamp)}</span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">Nenhum anúncio enviado ainda</div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privado">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 border rounded-md p-4 bg-gray-50">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Usuários
                  </h3>
                  <Select value={usuarioSelecionado} onValueChange={setUsuarioSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.nome} ({user.tipo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-medium text-gray-500">Usuários Ativos</h4>
                    <div className="space-y-1">
                      {usuarios.map((user) => (
                        <div
                          key={user.id}
                          className={`p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                            usuarioSelecionado === user.id ? "bg-blue-50 border border-blue-100" : ""
                          }`}
                          onClick={() => setUsuarioSelecionado(user.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="text-sm">{user.nome}</span>
                          </div>
                          <div className="text-xs text-gray-500 ml-4">
                            {user.tipo === "atendente" ? `Guichê ${user.guiche}` : user.tipo}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  {usuarioSelecionado ? (
                    <div className="space-y-4">
                      <div className="bg-gray-100 p-2 rounded-md">
                        <h3 className="text-sm font-medium">
                          Conversa com {usuarios.find((u) => u.id === usuarioSelecionado)?.nome}
                        </h3>
                      </div>

                      <div
                        ref={chatPrivadoRef}
                        className="h-[300px] overflow-y-auto border rounded-md p-4 bg-gray-50 space-y-3"
                      >
                        {mensagensPrivadas[usuarioSelecionado]?.length > 0 ? (
                          mensagensPrivadas[usuarioSelecionado].map((msg, index) => (
                            <div
                              key={index}
                              className={`flex ${msg.usuarioId === usuario.id ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-2 ${
                                  msg.usuarioId === usuario.id
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-white border text-gray-800"
                                }`}
                              >
                                <p className="text-sm">{msg.texto}</p>
                                <div className="text-right text-xs text-gray-500 mt-1">
                                  {formatarHora(msg.timestamp)}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            Nenhuma mensagem trocada com este usuário
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Digite sua mensagem privada..."
                          value={novaMensagemPrivada}
                          onChange={(e) => setNovaMensagemPrivada(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, "privado")}
                        />
                        <Button onClick={handleEnviarMensagemPrivada}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center border rounded-md p-4 bg-gray-50">
                      <div className="text-center">
                        <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Selecione um usuário para iniciar uma conversa privada</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
