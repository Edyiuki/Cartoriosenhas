// Implementação usando localStorage para persistência de dados
// Em um ambiente de produção, isso seria substituído por um banco de dados real

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

  // Notificar listeners
  const evento = new CustomEvent("statusGuicheAtualizado", {
    detail: { guiche, status, atualizadoPor },
  })
  window.dispatchEvent(evento)

  return true
}

// Escutar mudanças no status dos guichês
export const escutarMudancasStatus = (callback: (data: any) => void): (() => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent
    callback(customEvent.detail)
  }

  if (typeof window !== "undefined") {
    window.addEventListener("statusGuicheAtualizado", handler)

    return () => {
      window.removeEventListener("statusGuicheAtualizado", handler)
    }
  }

  return () => {}
}
