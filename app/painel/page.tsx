"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Volume2 } from "lucide-react"
import { obterSenhasChamadas, obterProximasSenhas, escutarMudancas } from "@/lib/tickets"
import { formatarHora } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function PainelPage() {
  const [senhasChamadas, setSenhasChamadas] = useState<any[]>([])
  const [proximasSenhas, setProximasSenhas] = useState<any[]>([])
  const [ultimaSenhaChamada, setUltimaSenhaChamada] = useState<any>(null)
  const [audioAtivo, setAudioAtivo] = useState(true)
  const [senhasAnunciadas, setSenhasAnunciadas] = useState<Record<string, number>>({})

  useEffect(() => {
    // Carregar senhas iniciais
    const carregarSenhas = async () => {
      const chamadas = await obterSenhasChamadas()
      const proximas = await obterProximasSenhas()

      setSenhasChamadas(chamadas)
      setProximasSenhas(proximas)

      if (chamadas.length > 0) {
        setUltimaSenhaChamada(chamadas[0])
      }

      // Verificar se há uma última senha chamada no localStorage
      const ultimaSenhaChamadaJSON = localStorage.getItem("ultimaSenhaChamada")
      if (ultimaSenhaChamadaJSON) {
        try {
          const senha = JSON.parse(ultimaSenhaChamadaJSON)
          setUltimaSenhaChamada(senha)

          // Recuperar contagem de anúncios do localStorage
          const anunciosJSON = localStorage.getItem("senhasAnunciadas")
          const anuncios = anunciosJSON ? JSON.parse(anunciosJSON) : {}
          setSenhasAnunciadas(anuncios)

          // Anunciar senha se o áudio estiver ativo e não tiver sido anunciada duas vezes
          if (audioAtivo && (!anuncios[senha.id] || anuncios[senha.id] < 2)) {
            anunciarSenha(senha)
          }
        } catch (error) {
          console.error("Erro ao processar última senha chamada:", error)
        }
      }
    }

    carregarSenhas()

    // Configurar listener para mudanças
    const unsubscribe = escutarMudancas((novaSenha) => {
      // Atualizar senhas chamadas
      setSenhasChamadas((prev) => {
        const novaLista = [novaSenha, ...prev].slice(0, 10)
        return novaLista
      })

      // Atualizar próximas senhas
      setProximasSenhas((prev) => {
        const novaLista = [...prev]
        const index = novaLista.findIndex((s) => s.id === novaSenha.id)
        if (index !== -1) {
          novaLista.splice(index, 1)
        }
        return novaLista
      })

      // Definir última senha chamada
      setUltimaSenhaChamada(novaSenha)

      // Anunciar senha se o áudio estiver ativo
      if (audioAtivo) {
        // Verificar quantas vezes a senha já foi anunciada
        setSenhasAnunciadas((prev) => {
          const novoEstado = { ...prev }
          novoEstado[novaSenha.id] = 0 // Iniciar contagem para nova senha

          // Salvar no localStorage
          localStorage.setItem("senhasAnunciadas", JSON.stringify(novoEstado))

          return novoEstado
        })

        anunciarSenha(novaSenha)
      }
    })

    // Configurar listener para eventos de storage para sincronização entre abas
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "ultimaSenhaChamada" && event.newValue) {
        try {
          const novaSenha = JSON.parse(event.newValue)

          // Atualizar senhas chamadas
          setSenhasChamadas((prev) => {
            const novaLista = [novaSenha, ...prev].slice(0, 10)
            return novaLista
          })

          // Definir última senha chamada
          setUltimaSenhaChamada(novaSenha)

          // Anunciar senha se o áudio estiver ativo
          if (audioAtivo) {
            // Verificar quantas vezes a senha já foi anunciada
            const anunciosJSON = localStorage.getItem("senhasAnunciadas")
            const anuncios = anunciosJSON ? JSON.parse(anunciosJSON) : {}

            if (!anuncios[novaSenha.id] || anuncios[novaSenha.id] < 2) {
              anunciarSenha(novaSenha)
            }
          }
        } catch (error) {
          console.error("Erro ao processar última senha chamada do storage:", error)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Configurar atualização periódica
    const interval = setInterval(() => {
      carregarSenhas()
    }, 30000) // Atualiza a cada 30 segundos

    return () => {
      unsubscribe()
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [audioAtivo])

  const anunciarSenha = (senha: any) => {
    if (!window.speechSynthesis) return

    const texto = `Senha ${senha.codigo}, ${senha.tipo} ${senha.subtipo}, guichê ${senha.guiche}`
    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = "pt-BR"
    utterance.rate = 0.9

    window.speechSynthesis.speak(utterance)

    // Incrementar contador de anúncios
    setSenhasAnunciadas((prev) => {
      const novoEstado = { ...prev }
      novoEstado[senha.id] = (novoEstado[senha.id] || 0) + 1

      // Salvar no localStorage
      localStorage.setItem("senhasAnunciadas", JSON.stringify(novoEstado))

      return novoEstado
    })
  }

  const toggleAudio = () => {
    setAudioAtivo(!audioAtivo)
  }

  const reanunciarSenha = () => {
    if (ultimaSenhaChamada) {
      anunciarSenha(ultimaSenhaChamada)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-6">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800">Painel de Senhas</h1>
          <div className="flex items-center gap-4">
            <Button
              variant={audioAtivo ? "default" : "outline"}
              size="sm"
              onClick={toggleAudio}
              className="flex items-center gap-2"
            >
              <Volume2 className="h-4 w-4" />
              {audioAtivo ? "Áudio Ativo" : "Áudio Desativado"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={reanunciarSenha}
              disabled={!ultimaSenhaChamada}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Reanunciar
            </Button>
          </div>
        </header>

        {ultimaSenhaChamada && (
          <Card className="mb-8 bg-blue-50 border-blue-200 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-blue-800">Senha Chamada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 text-white text-4xl font-bold p-6 rounded-lg min-w-[120px] text-center">
                    {ultimaSenhaChamada.codigo}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{ultimaSenhaChamada.tipo}</h3>
                    <Badge className={ultimaSenhaChamada.subtipo === "preferencial" ? "bg-green-500" : ""}>
                      {ultimaSenhaChamada.subtipo}
                    </Badge>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Guichê</div>
                  <div className="bg-gray-100 text-gray-800 text-3xl font-bold p-4 rounded-lg min-w-[80px]">
                    {ultimaSenhaChamada.guiche}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-500">Chamada às</div>
                  <div className="text-lg font-medium">{formatarHora(ultimaSenhaChamada.horaChamada)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader className="pb-2 bg-blue-50">
              <CardTitle className="text-xl text-blue-800">Últimas Senhas Chamadas</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {senhasChamadas.length > 0 ? (
                <div className="space-y-3">
                  {senhasChamadas.map((senha, index) => (
                    <div
                      key={senha.id}
                      className={`flex justify-between items-center p-3 rounded-md ${
                        index === 0 ? "bg-blue-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`font-bold text-lg min-w-[40px] text-center ${
                            index === 0 ? "text-blue-600" : "text-gray-600"
                          }`}
                        >
                          {senha.codigo}
                        </div>
                        <div>
                          <div className="font-medium">{senha.tipo}</div>
                          <Badge
                            className={
                              senha.subtipo === "preferencial"
                                ? "bg-green-500"
                                : senha.subtipo === "tardio"
                                  ? "bg-purple-500"
                                  : senha.subtipo === "indigente"
                                    ? "bg-red-500"
                                    : ""
                            }
                          >
                            {senha.subtipo}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Guichê</div>
                          <div className="font-semibold">{senha.guiche}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Hora</div>
                          <div className="text-sm">{formatarHora(senha.horaChamada)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Nenhuma senha foi chamada ainda</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 bg-blue-50">
              <CardTitle className="text-xl text-blue-800">Próximas Senhas</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {proximasSenhas.length > 0 ? (
                <div className="space-y-3">
                  {proximasSenhas.map((senha, index) => (
                    <div key={senha.id} className="flex justify-between items-center p-3 rounded-md bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-lg min-w-[40px] text-center text-gray-600">{senha.codigo}</div>
                        <div>
                          <div className="font-medium">{senha.tipo}</div>
                          <Badge
                            className={
                              senha.subtipo === "preferencial"
                                ? "bg-green-500"
                                : senha.subtipo === "tardio"
                                  ? "bg-purple-500"
                                  : senha.subtipo === "indigente"
                                    ? "bg-red-500"
                                    : ""
                            }
                          >
                            {senha.subtipo}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Emitida</div>
                        <div className="text-sm">{formatarHora(senha.horaEmissao)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Não há senhas em espera</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
