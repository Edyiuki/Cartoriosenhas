// Implementação usando localStorage para persistência de dados
// Em um ambiente de produção, isso seria substituído por um banco de dados real

import { v4 as uuidv4 } from "uuid"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

// Tipos
interface Ticket {
  id: string
  codigo: string
  tipo: string
  subtipo: string
  horaEmissao: number
  horaChamada?: number
  guiche?: string
  status: "aguardando" | "chamado" | "finalizado"
  direcionadoPara?: string
}

// Prefixos para os tipos de senhas
const prefixos: Record<string, string> = {
  geral: "G",
  casamento: "C",
  alteracao: "A",
  traslado: "T",
  obito: "O",
}

// Contadores para os tipos de senhas
let contadores: Record<string, number> = {}

// Inicializar contadores do localStorage
const inicializarContadores = () => {
  if (typeof window !== "undefined") {
    const contadoresSalvos = localStorage.getItem("contadores")
    if (contadoresSalvos) {
      contadores = JSON.parse(contadoresSalvos)
    } else {
      contadores = {
        geral: 0,
        casamento: 0,
        alteracao: 0,
        traslado: 0,
        obito: 0,
      }
      localStorage.setItem("contadores", JSON.stringify(contadores))
    }
  }
}

// Obter tickets do localStorage
const obterTickets = (): Ticket[] => {
  if (typeof window !== "undefined") {
    const tickets = localStorage.getItem("tickets")
    return tickets ? JSON.parse(tickets) : []
  }
  return []
}

// Salvar tickets no localStorage
const salvarTickets = (tickets: Ticket[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("tickets", JSON.stringify(tickets))

    // Disparar evento de atualização para sincronizar entre abas
    const evento = new CustomEvent("ticketsAtualizados", { detail: { timestamp: Date.now() } })
    window.dispatchEvent(evento)
  }
}

// Gerar uma nova senha
export const gerarSenha = async (tipo: string, subtipo: string): Promise<Ticket> => {
  inicializarContadores()

  // Incrementar contador
  contadores[tipo] = (contadores[tipo] || 0) + 1
  localStorage.setItem("contadores", JSON.stringify(contadores))

  // Gerar código da senha
  const codigo = `${prefixos[tipo]}${contadores[tipo].toString().padStart(3, "0")}`

  // Criar nova senha
  const novaSenha: Ticket = {
    id: uuidv4(),
    codigo,
    tipo,
    subtipo,
    horaEmissao: Date.now(),
    status: "aguardando",
  }

  // Salvar no localStorage
  const tickets = obterTickets()
  tickets.push(novaSenha)
  salvarTickets(tickets)

  return novaSenha
}

// Chamar próxima senha
export const chamarProximaSenha = async (tipo: string, subtipo: string, guiche: string): Promise<Ticket | null> => {
  const tickets = obterTickets()

  // Encontrar a próxima senha do tipo e subtipo especificados
  // Primeiro verificar se há senhas direcionadas para este guichê
  let index = tickets.findIndex(
    (t) => t.tipo === tipo && t.subtipo === subtipo && t.status === "aguardando" && t.direcionadoPara === guiche,
  )

  // Se não houver senhas direcionadas, pegar a próxima na fila
  if (index === -1) {
    index = tickets.findIndex((t) => t.tipo === tipo && t.subtipo === subtipo && t.status === "aguardando")
  }

  if (index === -1) return null

  // Atualizar status da senha
  tickets[index].status = "chamado"
  tickets[index].horaChamada = Date.now()
  tickets[index].guiche = guiche

  salvarTickets(tickets)

  // Notificar listeners (em uma implementação real, isso poderia ser um websocket)
  const evento = new CustomEvent("senhaChamada", { detail: tickets[index] })
  window.dispatchEvent(evento)

  // Armazenar a última senha chamada no localStorage para sincronização entre abas
  localStorage.setItem("ultimaSenhaChamada", JSON.stringify(tickets[index]))

  return tickets[index]
}

// Direcionar senha para um guichê específico
export const direcionarSenha = async (senhaId: string, guiche: string): Promise<boolean> => {
  const tickets = obterTickets()
  const index = tickets.findIndex((t) => t.id === senhaId)

  if (index === -1) return false

  // Atualizar direcionamento da senha
  tickets[index].direcionadoPara = guiche

  salvarTickets(tickets)

  // Notificar listeners
  const evento = new CustomEvent("senhaDirecionada", { detail: tickets[index] })
  window.dispatchEvent(evento)

  return true
}

// Reemitir chamada de uma senha
export const reemitirChamada = async (id: string): Promise<boolean> => {
  const tickets = obterTickets()
  const index = tickets.findIndex((t) => t.id === id)

  if (index === -1) return false

  // Atualizar horário da chamada
  tickets[index].horaChamada = Date.now()

  salvarTickets(tickets)

  // Notificar listeners
  const evento = new CustomEvent("senhaChamada", { detail: tickets[index] })
  window.dispatchEvent(evento)

  // Armazenar a última senha chamada no localStorage para sincronização entre abas
  localStorage.setItem("ultimaSenhaChamada", JSON.stringify(tickets[index]))

  return true
}

// Obter senhas chamadas recentemente
export const obterSenhasChamadas = async (): Promise<Ticket[]> => {
  const tickets = obterTickets()

  return tickets
    .filter((t) => t.status === "chamado")
    .sort((a, b) => (b.horaChamada || 0) - (a.horaChamada || 0))
    .slice(0, 10)
}

// Obter próximas senhas em espera
export const obterProximasSenhas = async (status = "aguardando"): Promise<any[]> => {
  const tickets = obterTickets()

  return tickets
    .filter((t) => t.status === status)
    .sort((a, b) => a.horaEmissao - b.horaEmissao)
    .map((t) => ({
      ...t,
      tempoEspera: formatDistanceToNow(t.horaEmissao, { locale: ptBR, addSuffix: true }),
    }))
}

// Obter todas as senhas
export const obterTodasSenhas = async (): Promise<Ticket[]> => {
  return obterTickets()
}

// Escutar mudanças nas senhas
export const escutarMudancas = (callback: (senha: Ticket) => void): (() => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent
    callback(customEvent.detail)
  }

  const handlerTicketsAtualizados = () => {
    // Verificar se há uma nova senha chamada
    const ultimaSenhaChamadaJSON = localStorage.getItem("ultimaSenhaChamada")
    if (ultimaSenhaChamadaJSON) {
      try {
        const ultimaSenhaChamada = JSON.parse(ultimaSenhaChamadaJSON)
        callback(ultimaSenhaChamada)
      } catch (error) {
        console.error("Erro ao processar última senha chamada:", error)
      }
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("senhaChamada", handler)
    window.addEventListener("ticketsAtualizados", handlerTicketsAtualizados)

    return () => {
      window.removeEventListener("senhaChamada", handler)
      window.removeEventListener("ticketsAtualizados", handlerTicketsAtualizados)
    }
  }

  return () => {}
}

// Finalizar atendimento de uma senha
export const finalizarAtendimento = async (id: string, usuarioId: string): Promise<boolean> => {
  const tickets = obterTickets()
  const index = tickets.findIndex((t) => t.id === id)

  if (index === -1) return false

  // Atualizar status da senha
  tickets[index].status = "finalizado"

  // Registrar o atendimento no histórico
  const historicoAtendimentos = localStorage.getItem("historicoAtendimentos") || "[]"
  const historico = JSON.parse(historicoAtendimentos)

  historico.push({
    senhaId: id,
    usuarioId,
    dataHora: Date.now(),
    tempoAtendimento: tickets[index].horaChamada ? Date.now() - tickets[index].horaChamada : 0,
    senha: tickets[index],
  })

  localStorage.setItem("historicoAtendimentos", JSON.stringify(historico))

  salvarTickets(tickets)

  return true
}

// Backup de dados
export const exportarDadosSenhas = (): string => {
  const tickets = obterTickets()
  const contadores = localStorage.getItem("contadores") || "{}"
  const historicoAtendimentos = localStorage.getItem("historicoAtendimentos") || "[]"

  const dados = {
    tickets,
    contadores: JSON.parse(contadores),
    historicoAtendimentos: JSON.parse(historicoAtendimentos),
    dataExportacao: new Date().toISOString(),
  }

  return JSON.stringify(dados, null, 2)
}

// Importar backup de dados
export const importarDadosSenhas = (dadosJSON: string): boolean => {
  try {
    const dados = JSON.parse(dadosJSON)

    if (dados.tickets) {
      localStorage.setItem("tickets", JSON.stringify(dados.tickets))
    }

    if (dados.contadores) {
      localStorage.setItem("contadores", JSON.stringify(dados.contadores))
    }

    if (dados.historicoAtendimentos) {
      localStorage.setItem("historicoAtendimentos", JSON.stringify(dados.historicoAtendimentos))
    }

    return true
  } catch (error) {
    console.error("Erro ao importar dados:", error)
    return false
  }
}
