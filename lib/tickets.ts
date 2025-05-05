import { v4 as uuidv4 } from "uuid"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { realtimeService, RealtimeEvent } from "./realtime-service"

// Tipos
export interface Ticket {
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

// Tipos para compatibilidade com o painel
export interface Senha {
  id: string
  numero: string
  tipo: string
  guiche?: string
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

// Modificar a função obterTickets para verificar se há dados no localStorage e fazer backup automático

// Obter tickets do localStorage com verificação de integridade
const obterTickets = (): Ticket[] => {
  if (typeof window !== "undefined") {
    try {
      const tickets = localStorage.getItem("tickets")
      const parsedTickets = tickets ? JSON.parse(tickets) : []

      // Verificar se o formato dos dados é válido
      if (!Array.isArray(parsedTickets)) {
        console.error("Formato de tickets inválido, restaurando do backup")
        return restaurarBackupAutomatico() ? obterTickets() : []
      }

      return parsedTickets
    } catch (error) {
      console.error("Erro ao obter tickets:", error)

      // Tentar restaurar do backup em caso de erro
      return restaurarBackupAutomatico() ? obterTickets() : []
    }
  }
  return []
}

// Salvar tickets no localStorage com verificação de erro
const salvarTickets = (tickets: Ticket[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("tickets", JSON.stringify(tickets))

      // Disparar evento de atualização para sincronizar entre abas
      const evento = new CustomEvent("ticketsAtualizados", { detail: { timestamp: Date.now() } })
      window.dispatchEvent(evento)

      // Fazer backup automático
      realizarBackupAutomatico()

      return true
    } catch (error) {
      console.error("Erro ao salvar tickets:", error)

      // Notificar o usuário sobre o erro
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        // Limpar dados antigos se o armazenamento estiver cheio
        limparDadosAntigos()

        // Tentar salvar novamente
        try {
          localStorage.setItem("tickets", JSON.stringify(tickets))
          return true
        } catch (retryError) {
          console.error("Erro ao salvar tickets após limpeza:", retryError)
          return false
        }
      }

      return false
    }
  }
  return false
}

// Limpar dados antigos para liberar espaço
const limparDadosAntigos = () => {
  if (typeof window !== "undefined") {
    try {
      const tickets = obterTickets()

      // Manter apenas os tickets dos últimos 30 dias
      const trintaDiasAtras = Date.now() - 30 * 24 * 60 * 60 * 1000
      const ticketsRecentes = tickets.filter(
        (ticket) =>
          ticket.status === "aguardando" || ticket.status === "chamado" || ticket.horaEmissao > trintaDiasAtras,
      )

      // Salvar tickets recentes
      localStorage.setItem("tickets", JSON.stringify(ticketsRecentes))

      // Limpar backups antigos
      const keys = Object.keys(localStorage)
      const backupKeys = keys.filter((key) => key.startsWith("backup_"))

      // Manter apenas os 5 backups mais recentes
      if (backupKeys.length > 5) {
        backupKeys.sort()
        const keysToRemove = backupKeys.slice(0, backupKeys.length - 5)
        keysToRemove.forEach((key) => localStorage.removeItem(key))
      }

      console.log("Dados antigos limpos para liberar espaço")
    } catch (error) {
      console.error("Erro ao limpar dados antigos:", error)
    }
  }
}

// Backup automático
let ultimoBackup = 0
const INTERVALO_BACKUP = 30000 // 30 segundos

const realizarBackupAutomatico = () => {
  const agora = Date.now()
  if (agora - ultimoBackup > INTERVALO_BACKUP) {
    ultimoBackup = agora

    // Salvar backup
    const backup = {
      tickets: obterTickets(),
      contadores: contadores,
      timestamp: agora,
    }

    localStorage.setItem("backup_tickets", JSON.stringify(backup))
    localStorage.setItem("ultimo_backup_auto", new Date().toISOString())

    // Emitir evento de backup
    realtimeService.emit(RealtimeEvent.SYSTEM_BACKUP, { tipo: "auto", timestamp: agora })
  }
}

// Modificar a função gerarSenha para melhor sincronização
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

  // Tentar salvar e verificar se foi bem-sucedido
  if (!salvarTickets(tickets)) {
    throw new Error("Não foi possível salvar a nova senha")
  }

  // Emitir evento via serviço de tempo real
  realtimeService.emit(RealtimeEvent.TICKET_CREATED, novaSenha)

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

  // Emitir evento via serviço de tempo real
  realtimeService.emit(RealtimeEvent.TICKET_CALLED, tickets[index])

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

  // Emitir evento via serviço de tempo real
  realtimeService.emit(RealtimeEvent.TICKET_DIRECTED, tickets[index])

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

  // Emitir evento via serviço de tempo real
  realtimeService.emit(RealtimeEvent.TICKET_CALLED, tickets[index])

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

// Obter senha atual (para o painel)
export const obterSenhaAtual = async (): Promise<Senha | null> => {
  const tickets = obterTickets()

  // Encontrar a senha mais recentemente chamada
  const senhasChamadas = tickets
    .filter((t) => t.status === "chamado")
    .sort((a, b) => (b.horaChamada || 0) - (a.horaChamada || 0))

  if (senhasChamadas.length === 0) return null

  const senhaAtual = senhasChamadas[0]

  return {
    id: senhaAtual.id,
    numero: senhaAtual.codigo,
    tipo: senhaAtual.tipo,
    guiche: senhaAtual.guiche,
  }
}

// Escutar mudanças nas senhas
export const escutarMudancas = (callback: (senha: Ticket) => void): (() => void) => {
  // Adicionar listener para eventos de tempo real
  realtimeService.on(RealtimeEvent.TICKET_CALLED, callback)
  realtimeService.on(RealtimeEvent.TICKET_DIRECTED, callback)

  // Também escutar eventos de localStorage para compatibilidade
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
    window.addEventListener("senhaDirecionada", handler)
    window.addEventListener("ticketsAtualizados", handlerTicketsAtualizados)

    return () => {
      window.removeEventListener("senhaChamada", handler)
      window.removeEventListener("senhaDirecionada", handler)
      window.removeEventListener("ticketsAtualizados", handlerTicketsAtualizados)
      realtimeService.off(RealtimeEvent.TICKET_CALLED, callback)
      realtimeService.off(RealtimeEvent.TICKET_DIRECTED, callback)
    }
  }

  return () => {
    realtimeService.off(RealtimeEvent.TICKET_CALLED, callback)
    realtimeService.off(RealtimeEvent.TICKET_DIRECTED, callback)
  }
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

  // Emitir evento via serviço de tempo real
  realtimeService.emit(RealtimeEvent.TICKET_COMPLETED, tickets[index])

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

  // Salvar como backup manual
  localStorage.setItem("ultimo_backup_manual", new Date().toISOString())
  localStorage.setItem("backup_manual", JSON.stringify(dados))

  // Emitir evento de backup
  realtimeService.emit(RealtimeEvent.SYSTEM_BACKUP, { tipo: "manual", timestamp: Date.now() })

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
      contadores = dados.contadores
    }

    if (dados.historicoAtendimentos) {
      localStorage.setItem("historicoAtendimentos", JSON.stringify(dados.historicoAtendimentos))
    }

    // Emitir evento de backup restaurado
    realtimeService.emit(RealtimeEvent.SYSTEM_RESTORE, { tipo: "restaurado", timestamp: Date.now() })

    return true
  } catch (error) {
    console.error("Erro ao importar dados:", error)
    return false
  }
}

// Restaurar backup automático
export const restaurarBackupAutomatico = (): boolean => {
  try {
    const backupJSON = localStorage.getItem("backup_tickets")
    if (!backupJSON) return false

    const backup = JSON.parse(backupJSON)

    localStorage.setItem("tickets", JSON.stringify(backup.tickets))
    localStorage.setItem("contadores", JSON.stringify(backup.contadores))
    contadores = backup.contadores

    return true
  } catch (error) {
    console.error("Erro ao restaurar backup automático:", error)
    return false
  }
}

// Verificar e restaurar backup se necessário
export const verificarERestaurarBackup = (): void => {
  try {
    const tickets = obterTickets()
    if (tickets.length === 0) {
      // Tentar restaurar do backup automático
      restaurarBackupAutomatico()
    }
  } catch (error) {
    console.error("Erro ao verificar backup:", error)
  }
}

// Inicializar verificação de backup
if (typeof window !== "undefined") {
  setTimeout(() => {
    verificarERestaurarBackup()
  }, 1000)
}
