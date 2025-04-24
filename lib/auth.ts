// Implementação usando localStorage para persistência de dados
// Em um ambiente de produção, isso seria substituído por um sistema de autenticação real

// Obter atendente atual
export const obterUsuarioAtual = async (): Promise<any> => {
  if (typeof window === "undefined") return null

  const sessao = localStorage.getItem("sessaoAtual")
  if (!sessao) return null

  const sessaoObj = JSON.parse(sessao)

  // Verificar se a sessão expirou (24 horas)
  const agora = Date.now()
  if (agora - sessaoObj.timestamp > 24 * 60 * 60 * 1000) {
    localStorage.removeItem("sessaoAtual")
    return null
  }

  return sessaoObj
}

// Registrar atendente
export const registrarAtendente = async (nome: string, guiche: string): Promise<boolean> => {
  if (typeof window === "undefined") return false

  // Verificar se o usuário já existe
  const historicoAtendentes = localStorage.getItem("historicoAtendentes")
  const historico = historicoAtendentes ? JSON.parse(historicoAtendentes) : []

  // Procurar por um usuário com o mesmo nome
  const usuarioExistente = historico.find(
    (u: any) => u.nome.toLowerCase() === nome.toLowerCase() && u.tipo === "atendente",
  )

  // Se o usuário já existe, usar o mesmo ID
  const id = usuarioExistente ? usuarioExistente.id : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  // Salvar sessão
  localStorage.setItem(
    "sessaoAtual",
    JSON.stringify({
      id,
      nome,
      guiche,
      tipo: "atendente",
      timestamp: Date.now(),
    }),
  )

  // Se o usuário não existia, registrar no histórico
  if (!usuarioExistente) {
    historico.push({
      id,
      nome,
      guiche,
      tipo: "atendente",
      dataEntrada: Date.now(),
    })

    localStorage.setItem("historicoAtendentes", JSON.stringify(historico))
  }

  return true
}

// Registrar recepção
export const registrarRecepcao = async (nome: string): Promise<boolean> => {
  if (typeof window === "undefined") return false

  // Verificar se o usuário já existe
  const historicoAtendentes = localStorage.getItem("historicoAtendentes")
  const historico = historicoAtendentes ? JSON.parse(historicoAtendentes) : []

  // Procurar por um usuário com o mesmo nome
  const usuarioExistente = historico.find(
    (u: any) => u.nome.toLowerCase() === nome.toLowerCase() && u.tipo === "recepcao",
  )

  // Se o usuário já existe, usar o mesmo ID
  const id = usuarioExistente ? usuarioExistente.id : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  // Salvar sessão
  localStorage.setItem(
    "sessaoAtual",
    JSON.stringify({
      id,
      nome,
      tipo: "recepcao",
      timestamp: Date.now(),
    }),
  )

  // Se o usuário não existia, registrar no histórico
  if (!usuarioExistente) {
    historico.push({
      id,
      nome,
      tipo: "recepcao",
      dataEntrada: Date.now(),
    })

    localStorage.setItem("historicoAtendentes", JSON.stringify(historico))
  }

  return true
}

// Login de administrador
export const loginAdmin = async (usuario: string, senha: string): Promise<boolean> => {
  if (typeof window === "undefined") return false

  // Em um sistema real, isso seria validado contra um banco de dados
  // Aqui estamos usando credenciais fixas para demonstração
  if (usuario === "admin" && senha === "admin123") {
    // Gerar ID único para o administrador
    const id = `admin-${Date.now()}`

    // Salvar sessão
    localStorage.setItem(
      "sessaoAtual",
      JSON.stringify({
        id,
        nome: "Administrador",
        tipo: "admin",
        timestamp: Date.now(),
      }),
    )

    return true
  }

  return false
}

// Logout
export const logout = async (): Promise<void> => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("sessaoAtual")
  }
}

// Obter todos os usuários
export const obterTodosUsuarios = async (): Promise<any[]> => {
  if (typeof window === "undefined") return []

  const historicoAtendentes = localStorage.getItem("historicoAtendentes")
  return historicoAtendentes ? JSON.parse(historicoAtendentes) : []
}

// Atualizar status de um usuário
export const atualizarStatusUsuario = async (id: string, status: string): Promise<boolean> => {
  if (typeof window === "undefined") return false

  const historicoAtendentes = localStorage.getItem("historicoAtendentes")
  if (!historicoAtendentes) return false

  const historico = JSON.parse(historicoAtendentes)
  const index = historico.findIndex((u: any) => u.id === id)

  if (index === -1) return false

  historico[index].status = status
  historico[index].ultimaAtualizacao = Date.now()

  localStorage.setItem("historicoAtendentes", JSON.stringify(historico))

  return true
}

// Remover um usuário
export const removerUsuario = async (id: string): Promise<boolean> => {
  if (typeof window === "undefined") return false

  const historicoAtendentes = localStorage.getItem("historicoAtendentes")
  if (!historicoAtendentes) return false

  const historico = JSON.parse(historicoAtendentes)
  const novoHistorico = historico.filter((u: any) => u.id !== id)

  localStorage.setItem("historicoAtendentes", JSON.stringify(novoHistorico))

  return true
}
