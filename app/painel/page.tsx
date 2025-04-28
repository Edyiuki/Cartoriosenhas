"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { obterSenhaAtual, type Senha } from "@/lib/tickets"
import { obterGuiches } from "@/lib/guiches"
import { useRealtime } from "@/components/socket-provider"
import { realtimeService, RealtimeEvent } from "@/lib/realtime-service"

export default function PainelPage() {
  const [senhaAtual, setSenhaAtual] = useState<Senha | null>(null)
  const [ultimasSenhas, setUltimasSenhas] = useState<Senha[]>([])
  const [guiches, setGuiches] = useState<{ id: string; nome: string }[]>([])
  const { isConnected } = useRealtime()

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const senha = await obterSenhaAtual()
        if (senha) {
          setSenhaAtual(senha)
          setUltimasSenhas((prev) => {
            // Adicionar a senha atual ao início do array e manter apenas as últimas 3
            const novasSenhas = [senha, ...prev.filter((s) => s.id !== senha.id)]
            return novasSenhas.slice(0, 3)
          })
        }

        const guichesData = await obterGuiches()
        setGuiches(guichesData)
      } catch (error) {
        console.error("Erro ao carregar dados do painel:", error)
      }
    }

    carregarDados()
  }, [])

  useEffect(() => {
    const handleNovaSenhaChamada = (senha: Senha) => {
      setSenhaAtual(senha)
      setUltimasSenhas((prev) => {
        // Adicionar a senha atual ao início do array e manter apenas as últimas 3
        const novasSenhas = [senha, ...prev.filter((s) => s.id !== senha.id)]
        return novasSenhas.slice(0, 3)
      })
    }

    const handleGuichesAtualizados = (novosGuiches: { id: string; nome: string }[]) => {
      setGuiches(novosGuiches)
    }

    // Usar o serviço de tempo real diretamente
    realtimeService.on(RealtimeEvent.TICKET_CALLED, handleNovaSenhaChamada)
    realtimeService.on(RealtimeEvent.GUICHES_UPDATED, handleGuichesAtualizados)

    return () => {
      realtimeService.off(RealtimeEvent.TICKET_CALLED, handleNovaSenhaChamada)
      realtimeService.off(RealtimeEvent.GUICHES_UPDATED, handleGuichesAtualizados)
    }
  }, [])

  // Função para obter o nome do guichê
  const obterNomeGuiche = (guicheId: string) => {
    const guiche = guiches.find((g) => g.id === guicheId)
    return guiche ? guiche.nome : guicheId
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white p-4">
      <header className="text-center py-4 border-b border-gray-800">
        <h1 className="text-4xl font-bold">Sistema de Senhas</h1>
      </header>

      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
        <div className="md:col-span-2">
          <Card className="bg-gray-900 border-gray-800 h-full">
            <CardContent className="flex flex-col items-center justify-center h-full p-8">
              <h2 className="text-2xl mb-4">Senha Atual</h2>

              {senhaAtual ? (
                <>
                  <div className="text-9xl font-bold mb-4">{senhaAtual.numero}</div>
                  <div className="text-3xl">{senhaAtual.tipo}</div>
                  {senhaAtual.guiche && (
                    <div className="mt-4 text-4xl font-semibold">Guichê: {obterNomeGuiche(senhaAtual.guiche)}</div>
                  )}
                </>
              ) : (
                <div className="text-4xl text-gray-500">Aguardando...</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-gray-900 border-gray-800 h-full">
            <CardContent className="p-6">
              <h2 className="text-xl mb-4 text-center">Últimas Senhas</h2>

              <div className="space-y-4">
                {ultimasSenhas.length > 0 ? (
                  ultimasSenhas.map(
                    (senha, index) =>
                      index > 0 && (
                        <div key={senha.id} className="flex justify-between items-center border-b border-gray-800 pb-2">
                          <div className="text-2xl font-semibold">{senha.numero}</div>
                          <div className="text-lg">{senha.tipo}</div>
                          {senha.guiche && <div className="text-lg">Guichê: {obterNomeGuiche(senha.guiche)}</div>}
                        </div>
                      ),
                  )
                ) : (
                  <div className="text-center text-gray-500">Nenhuma senha chamada</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="text-center py-4 border-t border-gray-800">
        <p className="text-gray-500">Sistema de Gerenciamento de Senhas</p>
      </footer>
    </div>
  )
}
