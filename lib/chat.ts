// Implementação usando localStorage para persistência de dados
// Em um ambiente de produção, isso seria substituído por um sistema de chat em tempo real

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

  // Notificar listeners
  const evento = new CustomEvent("novaMensagem", { detail: mensagem })
  window.dispatchEvent(evento)

  return true
}

// Obter mensagens
export const obterMensagens = async (): Promise<Mensagem[]> => {
  return obterMensagensDoStorage()
}

// Escutar novas mensagens
export const escutarMensagens = (callback: (mensagem: Mensagem) => void): (() => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent
    callback(customEvent.detail)
  }

  if (typeof window !== "undefined") {
    window.addEventListener("novaMensagem", handler)

    return () => {
      window.removeEventListener("novaMensagem", handler)
    }
  }

  return () => {}
}
