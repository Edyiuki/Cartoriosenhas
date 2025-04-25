"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RealTimeChat } from "@/components/real-time-chat"
import { isFirebaseConfigured } from "@/lib/firebase"
import { FirebaseConfigForm } from "@/components/firebase-config-form"

export function AdminChatPanel({ usuario }) {
  const [destinatarioSelecionado, setDestinatarioSelecionado] = useState(null)

  // Lista de atendentes (em um sistema real, isso viria do banco de dados)
  const atendentes = [
    { id: "atendente1", nome: "João Silva", tipo: "atendente" },
    { id: "atendente2", nome: "Maria Oliveira", tipo: "atendente" },
    { id: "recepcao1", nome: "Carlos Recepção", tipo: "recepcao" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Tabs defaultValue="geral" className="space-y-4">
          <TabsList>
            <TabsTrigger value="geral">Chat Geral</TabsTrigger>
            <TabsTrigger value="privado">Chat Privado</TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            {isFirebaseConfigured() ? (
              <RealTimeChat usuario={usuario} titulo="Chat Geral" privado={false} />
            ) : (
              <FirebaseConfigForm />
            )}
          </TabsContent>

          <TabsContent value="privado">
            {isFirebaseConfigured() ? (
              destinatarioSelecionado ? (
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
                    <CardDescription>Selecione um atendente para iniciar um chat privado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">Selecione um atendente na lista ao lado.</p>
                  </CardContent>
                </Card>
              )
            ) : (
              <FirebaseConfigForm />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Atendentes</CardTitle>
            <CardDescription>Selecione para chat privado</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {atendentes.map((atendente) => (
                <li key={atendente.id}>
                  <button
                    onClick={() => setDestinatarioSelecionado(atendente)}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 ${
                      destinatarioSelecionado?.id === atendente.id ? "bg-blue-50 border border-blue-200" : ""
                    }`}
                  >
                    <div className="font-medium">{atendente.nome}</div>
                    <div className="text-xs text-gray-500">
                      {atendente.tipo === "atendente" ? "Atendente" : "Recepção"}
                    </div>
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
