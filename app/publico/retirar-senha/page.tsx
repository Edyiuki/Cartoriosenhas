"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Printer, ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { gerarSenha } from "@/lib/tickets"
import { TicketDisplay } from "@/components/ticket-display"

export default function RetirarSenhaPage() {
  const router = useRouter()
  const [senhaGerada, setSenhaGerada] = useState<any>(null)

  const handleGerarSenha = async (tipo: string, subtipo: string) => {
    const novaSenha = await gerarSenha(tipo, subtipo)
    setSenhaGerada(novaSenha)
  }

  const handleImprimir = () => {
    window.print()
  }

  const handleVoltar = () => {
    setSenhaGerada(null)
  }

  if (senhaGerada) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center bg-blue-50">
            <CardTitle className="text-2xl text-blue-800">Senha Gerada</CardTitle>
            <CardDescription>Guarde sua senha e aguarde a chamada</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-4">
            <TicketDisplay ticket={senhaGerada} />

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Emitida em: {new Date().toLocaleTimeString()}</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button onClick={handleImprimir} className="w-full flex items-center justify-center gap-2">
              <Printer className="h-4 w-4" />
              Imprimir Senha
            </Button>
            <Button variant="outline" onClick={handleVoltar} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para a página inicial
        </Link>

        <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">Retirar Senha</h1>

        <Tabs defaultValue="geral" className="max-w-3xl mx-auto">
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="casamento">Casamento</TabsTrigger>
            <TabsTrigger value="alteracao">Alteração</TabsTrigger>
            <TabsTrigger value="traslado">Traslado</TabsTrigger>
            <TabsTrigger value="obito">Óbito Tardio</TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Atendimento Geral</span>
                    <Badge>Comum</Badge>
                  </CardTitle>
                  <CardDescription>Atendimento para serviços gerais</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Escolha esta opção para atendimentos gerais sem prioridade.</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleGerarSenha("geral", "comum")}>
                    Gerar Senha
                  </Button>
                </CardFooter>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Atendimento Geral</span>
                    <Badge className="bg-green-500">Preferencial</Badge>
                  </CardTitle>
                  <CardDescription>Atendimento prioritário</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Para idosos, gestantes, pessoas com deficiência ou com crianças de colo.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleGerarSenha("geral", "preferencial")}>
                    Gerar Senha
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="casamento">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Casamento</span>
                    <Badge>Comum</Badge>
                  </CardTitle>
                  <CardDescription>Emissão ou entrada de documentos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Para processos de habilitação, certidões e outros serviços relacionados a casamento.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleGerarSenha("casamento", "comum")}>
                    Gerar Senha
                  </Button>
                </CardFooter>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Casamento</span>
                    <Badge className="bg-green-500">Preferencial</Badge>
                  </CardTitle>
                  <CardDescription>Atendimento prioritário</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Para idosos, gestantes, pessoas com deficiência ou com crianças de colo.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleGerarSenha("casamento", "preferencial")}>
                    Gerar Senha
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alteracao">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Alteração de Nome</span>
                    <Badge>Comum</Badge>
                  </CardTitle>
                  <CardDescription>Processos de alteração de nome</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Para retificações, averbações e outros processos de alteração de nome.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleGerarSenha("alteracao", "comum")}>
                    Gerar Senha
                  </Button>
                </CardFooter>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Alteração de Nome</span>
                    <Badge className="bg-green-500">Preferencial</Badge>
                  </CardTitle>
                  <CardDescription>Atendimento prioritário</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Para idosos, gestantes, pessoas com deficiência ou com crianças de colo.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleGerarSenha("alteracao", "preferencial")}>
                    Gerar Senha
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="traslado">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Traslado de Registro</span>
                    <Badge>Comum</Badge>
                  </CardTitle>
                  <CardDescription>Traslado de registros</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Para traslados de registros de nascimento, casamento ou óbito.</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleGerarSenha("traslado", "comum")}>
                    Gerar Senha
                  </Button>
                </CardFooter>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Traslado de Registro</span>
                    <Badge className="bg-green-500">Preferencial</Badge>
                  </CardTitle>
                  <CardDescription>Atendimento prioritário</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Para idosos, gestantes, pessoas com deficiência ou com crianças de colo.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleGerarSenha("traslado", "preferencial")}>
                    Gerar Senha
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="obito">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Óbito Tardio</span>
                    <Badge className="bg-purple-500">Regular</Badge>
                  </CardTitle>
                  <CardDescription>Atendimento para registro de óbito tardio</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Para registros de óbito tardio regular.</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleGerarSenha("obito", "tardio")}>
                    Gerar Senha
                  </Button>
                </CardFooter>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Óbito Tardio</span>
                    <Badge className="bg-red-500">Indigente</Badge>
                  </CardTitle>
                  <CardDescription>Exclusivo para Guichê 01</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Para registros de óbito tardio de indigentes (exclusivo Guichê 01).</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleGerarSenha("obito", "indigente")}>
                    Gerar Senha
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
