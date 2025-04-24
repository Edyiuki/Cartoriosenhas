"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { registrarAtendente } from "@/lib/auth"

export default function SelecionarAtendentePage() {
  const router = useRouter()
  const [nome, setNome] = useState("")
  const [guiche, setGuiche] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!nome.trim()) {
      setError("Por favor, informe seu nome.")
      setLoading(false)
      return
    }

    if (!guiche) {
      setError("Por favor, selecione um guichê.")
      setLoading(false)
      return
    }

    try {
      await registrarAtendente(nome, guiche)
      router.push("/atendente/dashboard")
    } catch (err) {
      setError("Erro ao registrar atendente. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para a página inicial
        </Link>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Área do Atendente</CardTitle>
            <CardDescription className="text-center">Identifique-se para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Seu nome</Label>
                <Input
                  id="nome"
                  placeholder="Digite seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guiche">Guichê</Label>
                <Select value={guiche} onValueChange={setGuiche} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o guichê" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Guichê 01 - Óbito Tardio</SelectItem>
                    <SelectItem value="2">Guichê 02 - Atendimentos gerais</SelectItem>
                    <SelectItem value="3">Guichê 03 - Alteração de nome e traslados</SelectItem>
                    <SelectItem value="4">Guichê 04 - Casamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && <div className="text-red-500 text-sm text-center">{error}</div>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">Problemas para acessar? Contate o administrador.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
