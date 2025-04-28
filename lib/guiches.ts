import { realtimeService, RealtimeEvent } from "./realtime-service"

// Obter todos os guichês
export const obterGuiches = async (): Promise<{ id: string; nome: string }[]> => {
  if (typeof window === "undefined") return []

  // Lista padrão de guichês
  const guichesPadrao = [
    { id: "1", nome: "Guichê 1" },
    { id: "2", nome: "Guichê 2" },
    { id: "3", nome: "Guichê 3" },
    { id: "4", nome: "Guichê 4" },
  ]

  // Verificar se há configuração personalizada
  const guichesConfig = localStorage.getItem("guichesConfig")
  if (guichesConfig) {
    try {
      return JSON.parse(guichesConfig)
    } catch (error) {
      console.error("Erro ao carregar configuração de guichês:", error)
    }
  }

  return guichesPadrao
}

// Obter status dos guichês
export const obterStatusGuiches = async (): Promise<Record<string, string>> => {
  if (typeof window === "undefined") return {}

  const statusSalvo = localStorage.getItem("statusGuiches")
  if (statusSalvo) {
    return JSON.parse(statusSalvo)
  }

  // Status padrão
  const statusPadrao = {
    "1": "disponível",
    "2": "disponível",
    "3": "disponível",
    "4": "disponível",
  }

  localStorage.setItem("statusGuiches", JSON.stringify(statusPadrao))
  return statusPadrao
}

// Atualizar status de um guichê
export const atualizarStatusGuiche = async (
  guiche: string,
  status: string,
  atualizadoPor: string,
): Promise<boolean> => {
  if (typeof window === "undefined") return false

  const statusGuiches = await obterStatusGuiches()
  const novoStatus = {
    ...statusGuiches,
    [guiche]: status,
    [`${guiche}_por`]: atualizadoPor,
    [`${guiche}_hora`]: Date.now(),
  }

  localStorage.setItem("statusGuiches", JSON.stringify(novoStatus))

  // Emitir evento via serviço de tempo real
  realtimeService.emit(RealtimeEvent.GUICHE_STATUS_CHANGED, { guiche, status, atualizadoPor })

  return true
}

// Escutar mudanças no status dos guichês
export const escutarMudancasStatus = (callback: (data: any) => void): (() => void) => {
  // Adicionar listener para eventos de tempo real
  realtimeService.on(RealtimeEvent.GUICHE_STATUS_CHANGED, callback)

  // Também escutar eventos de localStorage para compatibilidade
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent
    callback(customEvent.detail)
  }

  if (typeof window !== "undefined") {
    window.addEventListener("statusGuicheAtualizado", handler)

    return () => {
      window.removeEventListener("statusGuicheAtualizado", handler)
      realtimeService.off(RealtimeEvent.GUICHE_STATUS_CHANGED, callback)
    }
  }

  return () => {
    realtimeService.off(RealtimeEvent.GUICHE_STATUS_CHANGED, callback)
  }
}
