"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { obterSenhaAtual, obterSenhasChamadas, type Senha } from "@/lib/tickets"
import { obterGuiches } from "@/lib/guiches"
import { realtimeService, RealtimeEvent } from "@/lib/realtime-service"
import { RefreshCw, Volume2, VolumeX, AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { errorMonitoring, tryCatch } from "@/lib/error-monitoring"

export default function PainelPage() {
  const [senhaAtual, setSenhaAtual] = useState<Senha | null>(null)
  const [ultimasSenhas, setUltimasSenhas] = useState<Senha[]>([])
  const [guiches, setGuiches] = useState<{ id: string; nome: string }[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [audioSupported, setAudioSupported] = useState(true)
  const [animateSenha, setAnimateSenha] = useState(false)
  const lastCalledSenhaRef = useRef<string | null>(null)
  const synth = useRef<SpeechSynthesis | null>(null)
  const voicesLoaded = useRef<boolean>(false)
  const availableVoices = useRef<SpeechSynthesisVoice[]>([])

  // Verificar suporte à síntese de voz
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("speechSynthesis" in window) {
        synth.current = window.speechSynthesis
        setAudioSupported(true)

        // Carregar vozes disponíveis
        const loadVoices = () => {
          availableVoices.current = synth.current?.getVoices() || []
          voicesLoaded.current = true
          console.log(`${availableVoices.current.length} vozes disponíveis`)
        }

        // Algumas navegadores carregam as vozes de forma assíncrona
        if (synth.current.onvoiceschanged !== undefined) {
          synth.current.onvoiceschanged = loadVoices
        }

        // Tentar carregar vozes imediatamente também
        loadVoices()

        // Carregar preferência de áudio do localStorage
        const savedAudioPref = localStorage.getItem("painel_audio_enabled")
        if (savedAudioPref !== null) {
          setAudioEnabled(savedAudioPref === "true")
        }
      } else {
        setAudioSupported(false)
        setAudioEnabled(false)
        console.warn("Síntese de voz não suportada neste navegador")
      }
    }

    return () => {
      // Cancelar qualquer fala em andamento ao desmontar o componente
      if (synth.current) {
        synth.current.cancel()
      }
    }
  }, [])

  // Função para falar a senha chamada
  const speakSenha = (senha: Senha) => {
    if (!audioEnabled || !audioSupported || !synth.current) return

    try {
      // Cancelar qualquer fala em andamento
      synth.current.cancel()

      // Criar o texto a ser falado
      const guicheNome = senha.guiche ? obterNomeGuiche(senha.guiche) : ""
      const textoParaFalar = `Senha ${senha.numero.split("").join(" ")}. ${senha.tipo}. Guichê ${guicheNome}.`

      // Criar um novo objeto de fala
      const utterance = new SpeechSynthesisUtterance(textoParaFalar)

      // Configurar a voz (mais robótica)
      utterance.rate = 0.9 // Velocidade um pouco mais lenta
      utterance.pitch = 0.8 // Tom mais baixo para soar mais robótico
      utterance.volume = 1.0

      // Tentar encontrar uma voz em português
      if (voicesLoaded.current && availableVoices.current.length > 0) {
        const ptVoice = availableVoices.current.find((voice) => voice.lang.includes("pt") || voice.lang.includes("PT"))

        if (ptVoice) {
          utterance.voice = ptVoice
        }
      }

      // Falar
      synth.current.speak(utterance)
    } catch (error) {
      console.error("Erro ao sintetizar voz:", error)
      errorMonitoring.logError({
        message: "Erro ao sintetizar voz",
        source: "painel-page",
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
    }
  }

  const carregarDados = async () => {
    setIsLoading(true)
    try {
      // Obter senha atual
      const senha = await tryCatch(async () => await obterSenhaAtual(), "Erro ao obter senha atual")

      // Obter últimas senhas chamadas
      const senhasChamadas =
        (await tryCatch(async () => await obterSenhasChamadas(), "Erro ao obter senhas chamadas")) || []

      // Atualizar estado
      if (senha) {
        setSenhaAtual(senha)

        // Verificar se é uma nova senha para falar e animar
        if (senha.id !== lastCalledSenhaRef.current) {
          lastCalledSenhaRef.current = senha.id
          speakSenha(senha)

          // Animar a senha atual
          setAnimateSenha(true)
          setTimeout(() => setAnimateSenha(false), 3000)
        }
      }

      setUltimasSenhas(senhasChamadas)

      // Obter guichês
      const guichesData = (await tryCatch(async () => await obterGuiches(), "Erro ao obter guichês")) || []

      setGuiches(guichesData)
    } catch (error) {
      console.error("Erro ao carregar dados do painel:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível atualizar as senhas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()

    // Configurar listeners para eventos de tempo real
    const handleNovaSenhaChamada = (senha: Senha) => {
      setSenhaAtual(senha)

      // Atualizar últimas senhas
      setUltimasSenhas((prev) => {
        const novasSenhas = [senha, ...prev.filter((s) => s.id !== senha.id)]
        return novasSenhas.slice(0, 4)
      })

      // Falar a nova senha e animar
      if (senha.id !== lastCalledSenhaRef.current) {
        lastCalledSenhaRef.current = senha.id
        speakSenha(senha)

        // Animar a senha atual
        setAnimateSenha(true)
        setTimeout(() => setAnimateSenha(false), 3000)
      }
    }

    // Escutar eventos de tempo real
    realtimeService.on(RealtimeEvent.TICKET_CALLED, handleNovaSenhaChamada)
    realtimeService.on(RealtimeEvent.CONNECT, () => setIsConnected(true))
    realtimeService.on(RealtimeEvent.DISCONNECT, () => setIsConnected(false))

    // Verificar status inicial de conexão
    setIsConnected(realtimeService.isConnected())

    // Configurar intervalo para atualização automática a cada 30 segundos
    const intervalId = setInterval(() => {
      carregarDados()
    }, 30000)

    return () => {
      realtimeService.off(RealtimeEvent.TICKET_CALLED, handleNovaSenhaChamada)
      realtimeService.off(RealtimeEvent.CONNECT)
      realtimeService.off(RealtimeEvent.DISCONNECT)
      clearInterval(intervalId)
    }
  }, [])

  // Função para obter o nome do guichê
  const obterNomeGuiche = (guicheId: string) => {
    const guiche = guiches.find((g) => g.id === guicheId)
    return guiche ? guiche.nome : guicheId
  }

  // Função para alternar o áudio
  const toggleAudio = () => {
    if (!audioSupported) {
      toast({
        title: "Áudio não suportado",
        description: "Seu navegador não suporta síntese de voz",
        variant: "destructive",
      })
      return
    }

    const newState = !audioEnabled
    setAudioEnabled(newState)
    localStorage.setItem("painel_audio_enabled", newState.toString())

    toast({
      title: newState ? "Áudio ativado" : "Áudio desativado",
      description: newState ? "As senhas serão chamadas em voz alta" : "As senhas não serão mais chamadas em voz alta",
      variant: "default",
    })
  }

  // Função para chamar novamente a senha atual
  const rechamarSenhaAtual = () => {
    if (senhaAtual) {
      speakSenha(senhaAtual)

      // Animar a senha atual
      setAnimateSenha(true)
      setTimeout(() => setAnimateSenha(false), 3000)

      toast({
        title: "Senha chamada novamente",
        description: `Senha ${senhaAtual.numero} chamada novamente`,
        variant: "default",
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white p-4">
      <header className="text-center py-4 border-b border-gray-800 flex justify-between items-center">
        <div className="flex-1"></div>
        <h1 className="text-4xl font-bold flex-1">Sistema de Senhas</h1>
        <div className="flex-1 flex justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAudio}
            disabled={!audioSupported}
            title={audioEnabled ? "Desativar áudio" : "Ativar áudio"}
            className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={carregarDados}
            disabled={isLoading}
            title="Atualizar senhas"
            className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      {!audioSupported && (
        <Alert variant="warning" className="mt-4 bg-yellow-900 border-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Síntese de voz não suportada</AlertTitle>
          <AlertDescription>
            Seu navegador não suporta a síntese de voz. As senhas não serão chamadas em voz alta.
          </AlertDescription>
        </Alert>
      )}

      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
        <div className="md:col-span-2">
          <Card
            className={`bg-gray-900 border-gray-800 h-full transition-all duration-500 ${
              animateSenha ? "border-4 border-green-500 shadow-lg shadow-green-900/50" : ""
            }`}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-8">
              <h2 className="text-2xl mb-4">Senha Atual</h2>

              {senhaAtual ? (
                <>
                  <div
                    className={`text-9xl font-bold mb-4 transition-all duration-500 ${
                      animateSenha ? "scale-110 text-green-400" : ""
                    }`}
                  >
                    {senhaAtual.numero}
                  </div>
                  <div className="text-3xl">{senhaAtual.tipo}</div>
                  {senhaAtual.guiche && (
                    <div
                      className={`mt-4 text-4xl font-semibold transition-all duration-500 ${
                        animateSenha ? "text-green-400" : ""
                      }`}
                    >
                      Guichê: {obterNomeGuiche(senhaAtual.guiche)}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="mt-8 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                    onClick={rechamarSenhaAtual}
                  >
                    Chamar Novamente
                  </Button>
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
                        <div
                          key={senha.id}
                          className="flex justify-between items-center border-b border-gray-800 pb-2 hover:bg-gray-800 p-2 rounded transition-colors"
                        >
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
        <div
          className={`inline-flex items-center gap-1 px-2 py-1 mt-2 rounded text-xs ${isConnected ? "bg-green-900 text-green-100" : "bg-red-900 text-red-100"}`}
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}></span>
          <span>{isConnected ? "Conectado" : "Desconectado"}</span>
        </div>
      </footer>
    </div>
  )
}
