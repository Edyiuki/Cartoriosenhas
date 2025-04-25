"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { db, isRealtimeDatabaseAvailable, isFirebaseConfigured } from "@/lib/firebase"
import { ref, onValue, push, set } from "firebase/database"

interface Mensagem {
  id: string
  texto: string
  usuario: {
    id: string
    nome: string
    tipo: string
  }
  timestamp: number
  privada: boolean
  destinatario?: {
    id: string
    nome: string
  }
}

interface RealTimeChatProps {
  usuario: {
    id: string
    nome: string
    tipo: string
  }
  titulo?: string
  privado?: boolean
  destinatario?: {
    id: string
    nome: string
  }
}

export function RealTimeChat({ usuario, titulo = "Chat", privado = false, destinatario }: RealTimeChatProps) {
  const [mensagem, setMensagem] = useState("")
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Verificar se o Firebase está configurado
  const firebaseDisponivel = isFirebaseConfigured() && isRealtimeDatabaseAvailable()

  useEffect(() => {
    if (!firebaseDisponivel) {
      setErro("Firebase não configurado ou Realtime Database não disponível")
      setCarregando(false)
      return
    }

    try {
      // Referência para o nó de mensagens no Realtime Database
      const mensagensRef = ref(db, "mensagens")

      // Ouvir mudanças nas mensagens
      const unsubscribe = onValue(mensagensRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const mensagensArray: Mensagem[] = Object.entries(data).map(([id, value]: [string, any]) => ({
            id,
            ...value,
          }))

          // Filtrar mensagens conforme o tipo de usuário e privacidade
          const mensagensFiltradas = mensagensArray.filter((msg) => {
            // Mensagens públicas são visíveis para todos
            if (!msg.privada) return true

            // Mensagens privadas são visíveis apenas para o remetente e o destinatário
            if (msg.privada) {
              return msg.usuario.id === usuario.id || (msg.destinatario && msg.destinatario.id === usuario.id)
            }

            return false
          })

          // Ordenar por timestamp
          mensagensFiltradas.sort((a, b) => a.timestamp - b.timestamp)

          setMensagens(mensagensFiltradas)
        } else {
          setMensagens([])
        }
        setCarregando(false)
      })

      // Limpar listener ao desmontar
      return () => {
        unsubscribe()
      }
    } catch (error) {
      console.error("Erro ao configurar chat em tempo real:", error)
      setErro("Erro ao conectar ao chat em tempo real")
      setCarregando(false)
    }
  }, [firebaseDisponivel, usuario.id])

  // Rolar para o final quando novas mensagens chegarem
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [mensagens])

  const enviarMensagem = () => {
    if (!mensagem.trim() || !firebaseDisponivel) return

    try {
      // Referência para o nó de mensagens
      const mensagensRef = ref(db, "mensagens")

      // Criar nova mensagem
      const novaMensagem = {
        texto: mensagem,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          tipo: usuario.tipo,
        },
        timestamp: Date.now(),
        privada: !!privado,
      }

      // Adicionar destinatário se for mensagem privada
      if (privado && destinatario) {
        novaMensagem.destinatario = {
          id: destinatario.id,
          nome: destinatario.nome,
        }
      }

      // Adicionar mensagem ao banco de dados
      const novaMensagemRef = push(mensagensRef)
      set(novaMensagemRef, novaMensagem)

      // Limpar campo de mensagem
      setMensagem("")
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      setErro("Erro ao enviar mensagem")
    }
  }

  const formatarData = (timestamp: number) => {
    const data = new Date(timestamp)
    return data.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (!firebaseDisponivel) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Firebase não configurado</AlertTitle>
        <AlertDescription>
          Configure o Firebase nas configurações do sistema para usar o chat em tempo real.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {erro && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {carregando ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">Carregando mensagens...</p>
          </div>
        ) : (
          <div ref={chatContainerRef} className="flex flex-col gap-2 p-4 overflow-y-auto h-[300px]">
            {mensagens.length === 0 ? (
              <p className="text-sm text-gray-500 text-center">Nenhuma mensagem ainda.</p>
            ) : (
              mensagens.map((msg) => (
                <div key={msg.id} className={`flex ${msg.usuario.id === usuario.id ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-2 ${
                      msg.usuario.id === usuario.id ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs font-medium">
                        {msg.usuario.id === usuario.id ? "Você" : msg.usuario.nome}
                        {msg.privada && " (privado)"}
                      </span>
                      <span className="text-xs text-gray-500">{formatarData(msg.timestamp)}</span>
                    </div>
                    <p className="text-sm">{msg.texto}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t p-2">
        <div className="flex w-full gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                enviarMensagem()
              }
            }}
            disabled={carregando || !!erro}
          />
          <Button onClick={enviarMensagem} disabled={!mensagem.trim() || carregando || !!erro} className="px-3">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
