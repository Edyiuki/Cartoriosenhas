"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RealTimeChat } from "@/components/real-time-chat"
import { isFirebaseConfigured } from "@/lib/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function ChatPanel({ usuario }) {
  const [destinatarioSelecionado, setDestinatarioSelecionado] = useState(null)

  // Lista de usuários (em um sistema real, isso viria do banco de dados)
  const usuarios = [
    { id: "admin1", nome: "Administrador", tipo: "admin" },
    // Outros usuários seriam carregados dinamicamente
  ]

  if (!isFirebaseConfigured()) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Firebase não configurado</AlertTitle>
        <AlertDescription>
          O administrador precisa configurar o Firebase nas configurações do sistema para usar o chat em tempo real.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Tabs defaultValue="geral" className="space-y-4">
          <TabsList>
            <TabsTrigger value="geral">Chat Geral</TabsTrigger>
            <TabsTrigger value="privado">Chat Privado</TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <RealTimeChat usuario={usuario} titulo="Chat Geral" privado={false} />
          </TabsContent>

          <TabsContent value="privado">
            {destinatarioSelecionado ? (
              <RealTimeChat
                usuario={usuario}
                titulo={`Chat com ${destinatarioSelecionado.nome}`}
                privado={true}
                destinatario={destinatarioSelecionado}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Chat Privado</CardTitle>
                  <CardDescription>Selecione um usuário para iniciar um chat privado</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Selecione um usuário na lista ao lado.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>Selecione para chat privado</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {usuarios.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => setDestinatarioSelecionado(user)}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 ${
                      destinatarioSelecionado?.id === user.id ? "bg-blue-50 border border-blue-200" : ""
                    }`}
                  >
                    <div className="font-medium">{user.nome}</div>
                    <div className="text-xs text-gray-500">{user.tipo === "admin" ? "Administrador" : user.tipo}</div>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
