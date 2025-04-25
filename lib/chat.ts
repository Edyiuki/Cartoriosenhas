import { ref, push, onValue, get, query, orderByChild, limitToLast } from "firebase/database"
import { db, isFirebaseConfigured } from "./firebase"

// Tipos
export interface Mensagem {
  usuarioId: string
  usuarioNome: string
  guiche: string
  texto: string
  timestamp: number
  tipo?: string
  destinatarioId?: string
  destinatarioNome?: string
  privada?: boolean
}

// Fallback para localStorage quando o Firebase não estiver configurado
const obterMensagensDoStorage = (): Mensagem[] => {
  if (typeof window !== "undefined") {
    const mensagens = localStorage.getItem("mensagens")
    return mensagens ? JSON.parse(mensagens) : []
  }
  return []
}

const salvarMensagensNoStorage = (mensagens: Mensagem[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("mensagens", JSON.stringify(mensagens))
  }
}

// Enviar mensagem
export const enviarMensagem = async (mensagem: Mensagem): Promise<boolean> => {
  try {
    if (isFirebaseConfigured() && db) {
      // Usar Firebase Realtime Database
      const mensagensRef = ref(db, "mensagens")
      await push(mensagensRef, mensagem)

      // Se for mensagem privada, salvar também na coleção de mensagens privadas
      if (mensagem.privada && mensagem.destinatarioId) {
        const chatId = [mensagem.usuarioId, mensagem.destinatarioId].sort().join("_")
        const mensagensPrivadasRef = ref(db, `mensagensPrivadas/${chatId}`)
        await push(mensagensPrivadasRef, mensagem)
      }

      return true
    } else {
      // Fallback para localStorage
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
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    return false
  }
}

// Obter mensagens
export const obterMensagens = async (): Promise<Mensagem[]> => {
  try {
    if (isFirebaseConfigured() && db) {
      // Usar Firebase Realtime Database
      const mensagensRef = query(ref(db, "mensagens"), orderByChild("timestamp"), limitToLast(100))
      const snapshot = await get(mensagensRef)

      if (snapshot.exists()) {
        const mensagens: Mensagem[] = []
        snapshot.forEach((childSnapshot) => {
          mensagens.push(childSnapshot.val())
        })
        return mensagens.sort((a, b) => a.timestamp - b.timestamp)
      }
      return []
    } else {
      // Fallback para localStorage
      return obterMensagensDoStorage()
    }
  } catch (error) {
    console.error("Erro ao obter mensagens:", error)
    return []
  }
}

// Obter mensagens privadas entre dois usuários
export const obterMensagensPrivadas = async (usuarioId1: string, usuarioId2: string): Promise<Mensagem[]> => {
  try {
    if (isFirebaseConfigured() && db) {
      // Usar Firebase Realtime Database
      const chatId = [usuarioId1, usuarioId2].sort().join("_")
      const mensagensRef = query(ref(db, `mensagensPrivadas/${chatId}`), orderByChild("timestamp"))
      const snapshot = await get(mensagensRef)

      if (snapshot.exists()) {
        const mensagens: Mensagem[] = []
        snapshot.forEach((childSnapshot) => {
          mensagens.push(childSnapshot.val())
        })
        return mensagens.sort((a, b) => a.timestamp - b.timestamp)
      }
      return []
    } else {
      // Fallback para localStorage
      const mensagensPrivadasSalvas = localStorage.getItem("mensagensPrivadas")
      if (mensagensPrivadasSalvas) {
        const todasMensagensPrivadas = JSON.parse(mensagensPrivadasSalvas)
        return todasMensagensPrivadas[usuarioId2] || []
      }
      return []
    }
  } catch (error) {
    console.error("Erro ao obter mensagens privadas:", error)
    return []
  }
}

// Escutar novas mensagens
export const escutarMensagens = (callback: (mensagem: Mensagem) => void): (() => void) => {
  if (isFirebaseConfigured() && db) {
    // Usar Firebase Realtime Database
    const mensagensRef = ref(db, "mensagens")
    const unsubscribe = onValue(
      mensagensRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          const mensagens = Object.values(data) as Mensagem[]
          const ultimaMensagem = mensagens[mensagens.length - 1]
          callback(ultimaMensagem)
        }
      },
      { onlyOnce: false },
    )

    return unsubscribe
  } else {
    // Fallback para localStorage e eventos personalizados
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
}

// Escutar mensagens privadas
export const escutarMensagensPrivadas = (
  usuarioId1: string,
  usuarioId2: string,
  callback: (mensagem: Mensagem) => void,
): (() => void) => {
  if (isFirebaseConfigured() && db) {
    // Usar Firebase Realtime Database
    const chatId = [usuarioId1, usuarioId2].sort().join("_")
    const mensagensRef = ref(db, `mensagensPrivadas/${chatId}`)

    const unsubscribe = onValue(
      mensagensRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          const mensagens = Object.values(data) as Mensagem[]
          const ultimaMensagem = mensagens[mensagens.length - 1]
          callback(ultimaMensagem)
        }
      },
      { onlyOnce: false },
    )

    return unsubscribe
  } else {
    // Fallback para localStorage
    return () => {}
  }
}
