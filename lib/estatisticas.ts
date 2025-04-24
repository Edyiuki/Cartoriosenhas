// Implementação usando localStorage para persistência de dados
// Em um ambiente de produção, isso seria substituído por um banco de dados real

import { obterTodasSenhas } from "./tickets"

// Função auxiliar para filtrar dados por período
const filtrarPorPeriodo = (dados: any[], periodo: string) => {
  const agora = new Date()
  const inicioIntervalo = new Date()

  switch (periodo) {
    case "diario":
      inicioIntervalo.setHours(0, 0, 0, 0)
      break
    case "semanal":
      inicioIntervalo.setDate(agora.getDate() - 7)
      break
    case "mensal":
      inicioIntervalo.setMonth(agora.getMonth() - 1)
      break
    case "anual":
      inicioIntervalo.setFullYear(agora.getFullYear() - 1)
      break
    default:
      inicioIntervalo.setDate(agora.getDate() - 7) // Padrão: semanal
  }

  return dados.filter((item) => {
    const dataItem = new Date(item.horaChamada || item.horaEmissao)
    return dataItem >= inicioIntervalo
  })
}

// Obter estatísticas gerais de atendimento
export const obterEstatisticasAtendimento = async (periodo: string): Promise<any> => {
  // Obter dados de atendimento
  const todasSenhas = await obterTodasSenhas()
  const senhasFiltradas = filtrarPorPeriodo(todasSenhas, periodo)
  const senhasChamadas = senhasFiltradas.filter((s) => s.status === "chamado" && s.horaChamada)

  // Calcular total de atendimentos
  const totalAtendimentos = senhasChamadas.length

  // Calcular tempo médio de atendimento (simulado)
  let tempoMedioAtendimento = "0 min"
  if (senhasChamadas.length > 0) {
    // Em um sistema real, isso seria calculado com base em registros de início e fim de atendimento
    // Aqui estamos simulando com valores aleatórios entre 5 e 15 minutos
    const tempoMedio = Math.floor(Math.random() * 10) + 5
    tempoMedioAtendimento = `${tempoMedio} min`
  }

  // Calcular produtividade média (simulado)
  const produtividadeMedia = `${Math.floor(Math.random() * 30) + 70}%`

  // Calcular eficiência geral (simulado)
  const eficienciaGeral = `${Math.floor(Math.random() * 20) + 75}%`

  // Calcular atendimentos por tipo
  const atendimentosPorTipo = [
    { tipo: "Geral", quantidade: 0, percentual: 0 },
    { tipo: "Casamento", quantidade: 0, percentual: 0 },
    { tipo: "Alteração", quantidade: 0, percentual: 0 },
    { tipo: "Traslado", quantidade: 0, percentual: 0 },
    { tipo: "Óbito Tardio", quantidade: 0, percentual: 0 },
  ]

  senhasChamadas.forEach((senha) => {
    const tipoIndex = atendimentosPorTipo.findIndex((t) => t.tipo.toLowerCase() === senha.tipo.toLowerCase())
    if (tipoIndex !== -1) {
      atendimentosPorTipo[tipoIndex].quantidade++
    }
  })

  // Calcular percentuais
  if (totalAtendimentos > 0) {
    atendimentosPorTipo.forEach((tipo) => {
      tipo.percentual = Math.round((tipo.quantidade / totalAtendimentos) * 100)
    })
  }

  // Ordenar por quantidade (decrescente)
  atendimentosPorTipo.sort((a, b) => b.quantidade - a.quantidade)

  // Tempo por tipo de atendimento (simulado)
  const tempoPorTipoAtendimento = [
    { tipo: "Geral", tempo: `${Math.floor(Math.random() * 5) + 5} min` },
    { tipo: "Casamento", tempo: `${Math.floor(Math.random() * 5) + 10} min` },
    { tipo: "Alteração", tempo: `${Math.floor(Math.random() * 5) + 8} min` },
    { tipo: "Traslado", tempo: `${Math.floor(Math.random() * 5) + 12} min` },
    { tipo: "Óbito Tardio", tempo: `${Math.floor(Math.random() * 5) + 15} min` },
  ]

  return {
    totalAtendimentos,
    tempoMedioAtendimento,
    produtividadeMedia,
    eficienciaGeral,
    atendimentosPorTipo,
    tempoPorTipoAtendimento,
  }
}

// Obter estatísticas por guichê
export const obterEstatisticasGuiche = async (periodo: string, guiche: string): Promise<any> => {
  // Obter dados de atendimento
  const todasSenhas = await obterTodasSenhas()
  const senhasFiltradas = filtrarPorPeriodo(todasSenhas, periodo)
  const senhasChamadas = senhasFiltradas.filter((s) => s.status === "chamado" && s.horaChamada)

  // Filtrar por guichê específico se necessário
  const senhasFiltro = guiche !== "todos" ? senhasChamadas.filter((s) => s.guiche === guiche) : senhasChamadas

  // Produtividade por guichê (simulado)
  const produtividadePorGuiche = []
  for (let i = 1; i <= 4; i++) {
    if (guiche !== "todos" && guiche !== i.toString()) continue

    const senhasGuiche = senhasChamadas.filter((s) => s.guiche === i.toString())
    const atendimentos = senhasGuiche.length
    const produtividade = Math.floor(Math.random() * 30) + 70 // 70-100%

    produtividadePorGuiche.push({
      guiche: i.toString(),
      produtividade,
      atendimentos,
      periodo,
    })
  }

  // Atendimentos por guichê
  const atendimentosPorGuiche = []
  for (let i = 1; i <= 4; i++) {
    if (guiche !== "todos" && guiche !== i.toString()) continue

    const senhasGuiche = senhasChamadas.filter((s) => s.guiche === i.toString())
    atendimentosPorGuiche.push({
      guiche: i.toString(),
      total: senhasGuiche.length,
    })
  }

  // Tempo médio por guichê (simulado)
  const tempoMedioPorGuiche = []
  for (let i = 1; i <= 4; i++) {
    if (guiche !== "todos" && guiche !== i.toString()) continue

    tempoMedioPorGuiche.push({
      guiche: i.toString(),
      tempoMedio: Math.floor(Math.random() * 10) + 5, // 5-15 minutos
      tempoMinimo: Math.floor(Math.random() * 3) + 2, // 2-5 minutos
      tempoMaximo: Math.floor(Math.random() * 15) + 15, // 15-30 minutos
    })
  }

  // Tempo entre atendimentos (simulado)
  const tempoEntreAtendimentos = []
  for (let i = 1; i <= 4; i++) {
    if (guiche !== "todos" && guiche !== i.toString()) continue

    tempoEntreAtendimentos.push({
      guiche: i.toString(),
      tempo: `${Math.floor(Math.random() * 3) + 1} min`,
    })
  }

  // Especialização por guichê (simulado)
  const especializacaoPorGuiche = []
  const tiposAtendimento = ["Geral", "Casamento", "Alteração", "Traslado", "Óbito Tardio"]
  for (let i = 1; i <= 4; i++) {
    if (guiche !== "todos" && guiche !== i.toString()) continue

    const tipoIndex = (i - 1) % tiposAtendimento.length
    especializacaoPorGuiche.push({
      guiche: i.toString(),
      tipoMaisFrequente: tiposAtendimento[tipoIndex],
      porcentagem: `${Math.floor(Math.random() * 30) + 50}%`,
    })
  }

  return {
    produtividadePorGuiche,
    atendimentosPorGuiche,
    tempoMedioPorGuiche,
    tempoEntreAtendimentos,
    especializacaoPorGuiche,
  }
}

// Obter estatísticas por usuário
export const obterEstatisticasUsuario = async (periodo: string, usuarioId: string): Promise<any> => {
  // Em um sistema real, isso seria obtido do banco de dados
  // Aqui estamos simulando dados

  // Obter lista de usuários
  const historicoAtendentes = localStorage.getItem("historicoAtendentes")
  const atendentes = historicoAtendentes ? JSON.parse(historicoAtendentes) : []
  const atendentesFiltrados =
    usuarioId !== "todos"
      ? atendentes.filter((a: any) => a.id === usuarioId)
      : atendentes.filter((a: any) => a.tipo === "atendente")

  // Produtividade por usuário (simulado)
  const produtividadePorUsuario = atendentesFiltrados.map((atendente: any) => ({
    id: atendente.id,
    nome: atendente.nome,
    guiche: atendente.guiche || "N/A",
    produtividade: `${Math.floor(Math.random() * 30) + 70}%`,
    atendimentos: Math.floor(Math.random() * 50) + 10,
  }))

  // Ordenar por produtividade (decrescente)
  produtividadePorUsuario.sort((a: any, b: any) => {
    const prodA = Number.parseInt(a.produtividade.replace("%", ""))
    const prodB = Number.parseInt(b.produtividade.replace("%", ""))
    return prodB - prodA
  })

  // Tempo médio por usuário (simulado)
  const tempoMedioPorUsuario = atendentesFiltrados.map((atendente: any) => ({
    id: atendente.id,
    nome: atendente.nome,
    tempoMedio: `${Math.floor(Math.random() * 10) + 5} min`,
  }))

  return {
    produtividadePorUsuario,
    tempoMedioPorUsuario,
  }
}

// Registrar atendimento concluído
export const registrarAtendimentoConcluido = async (
  senhaId: string,
  usuarioId: string,
  tempoAtendimento: number,
): Promise<boolean> => {
  // Em um sistema real, isso seria salvo no banco de dados
  // Aqui estamos apenas simulando o registro

  // Obter histórico de atendimentos
  const historicoAtendimentos = localStorage.getItem("historicoAtendimentos")
  const historico = historicoAtendimentos ? JSON.parse(historicoAtendimentos) : []

  // Adicionar novo registro
  historico.push({
    senhaId,
    usuarioId,
    tempoAtendimento,
    dataHora: Date.now(),
  })

  // Salvar histórico atualizado
  localStorage.setItem("historicoAtendimentos", JSON.stringify(historico))

  return true
}
