import { realtimeService, RealtimeEvent } from "./realtime-service"

// Tipos
interface Mensagem {
  usuarioId: string
  usuarioNome: string
  guiche: string
  texto: string
  timestamp: number
  tipo?: string
}

// Obter mensagens do localStorage
const obterMensagensDoStorage = (): Mensagem[] => {
  if (typeof window !== "undefined") {
    const mensagens = localStorage.getItem("mensagens")
    return mensagens ? JSON.parse(mensagens) : []
  }
  return []
}

// Salvar mensagens no localStorage
const salvarMensagensNoStorage = (mensagens: Mensagem[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("mensagens", JSON.stringify(mensagens))
  }
}

// Enviar mensagem
export const enviarMensagem = async (mensagem: Mensagem): Promise<boolean> => {
  const mensagens = obterMensagensDoStorage()
  mensagens.push(mensagem)

  // Limitar a 100 mensagens
  if (mensagens.length > 100) {
    mensagens.shift()
  }

  salvarMensagensNoStorage(mensagens)

  // Emitir evento via serviço de tempo real
  realtimeService.emit(RealtimeEvent.CHAT_MESSAGE, mensagem)

  return true
}

// Obter mensagens
export const obterMensagens = async (): Promise<Mensagem[]> => {
  return obterMensagensDoStorage()
}

// Escutar novas mensagens
export const escutarMensagens = (callback: (mensagem: Mensagem) => void): (() => void) => {
  // Adicionar listener para eventos de tempo real
  realtimeService.on(RealtimeEvent.CHAT_MESSAGE, callback)

  // Também escutar eventos de localStorage para compatibilidade
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent
    callback(customEvent.detail)
  }

  if (typeof window !== "undefined") {
    window.addEventListener("novaMensagem", handler)

    return () => {
      window.removeEventListener("novaMensagem", handler)
      realtimeService.off(RealtimeEvent.CHAT_MESSAGE, callback)
    }
  }

  return () => {
    realtimeService.off(RealtimeEvent.CHAT_MESSAGE, callback)
  }
}
