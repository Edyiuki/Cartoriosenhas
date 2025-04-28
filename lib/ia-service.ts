// Interface para respostas da IA
export interface IAResponse {
  texto: string
  fonte?: string
  confianca?: number
}

// Atualizar a função processarPergunta para usar a rota de API interna
export async function processarPergunta(pergunta: string, contexto: any = {}): Promise<IAResponse> {
  try {
    // Usar a rota de API interna em vez de chamar a OpenAI diretamente
    const response = await fetch("/api/ia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pergunta,
        contexto,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`)
    }

    const data = await response.json()

    // Se a API retornar um erro, lançar exceção
    if (data.error) {
      throw new Error(data.error)
    }

    return {
      texto: data.texto,
      fonte: data.fonte,
      confianca: data.confianca || 0.95,
    }
  } catch (error) {
    console.error("Erro ao processar pergunta com a API:", error)

    // Fallback para o sistema local em caso de erro
    const perguntaLower = pergunta.toLowerCase()

    // Usar o sistema de fallback existente
    if (
      perguntaLower.includes("olá") ||
      perguntaLower.includes("oi") ||
      perguntaLower.includes("bom dia") ||
      perguntaLower.includes("boa tarde") ||
      perguntaLower.includes("boa noite")
    ) {
      return {
        texto: `Olá! Eu sou Thoth, o assistente IA do sistema de senhas do cartório. Como posso ajudar você hoje?`,
        confianca: 0.98,
      }
    }

    // Resposta genérica para perguntas não reconhecidas
    return {
      texto: `Obrigado pela sua pergunta sobre "${pergunta}". Como Thoth, o assistente IA do sistema, posso ajudar com informações sobre procedimentos do cartório, documentação necessária, análise de desempenho do sistema de atendimento, e outras questões relacionadas. Poderia fornecer mais detalhes sobre sua dúvida para que eu possa lhe dar uma resposta mais precisa?`,
      confianca: 0.75,
    }
  }
}

// Sistema de histórico de conversas
let historicoConversas: Record<
  string,
  {
    mensagens: Array<{ pergunta: string; resposta: string; timestamp: number }>
    ultimaInteracao: number
  }
> = {}

// Gerenciamento de histórico
export function salvarNaConversa(usuarioId: string, pergunta: string, resposta: string) {
  if (!historicoConversas[usuarioId]) {
    historicoConversas[usuarioId] = {
      mensagens: [],
      ultimaInteracao: Date.now(),
    }
  }

  historicoConversas[usuarioId].mensagens.push({
    pergunta,
    resposta,
    timestamp: Date.now(),
  })

  historicoConversas[usuarioId].ultimaInteracao = Date.now()

  // Limitar histórico para as últimas 20 mensagens por usuário
  if (historicoConversas[usuarioId].mensagens.length > 20) {
    historicoConversas[usuarioId].mensagens = historicoConversas[usuarioId].mensagens.slice(-20)
  }

  // Persistir histórico (em um sistema real, salvar no banco de dados)
  try {
    localStorage.setItem("thoth_historico", JSON.stringify(historicoConversas))
  } catch (error) {
    console.error("Erro ao salvar histórico de conversas:", error)
  }
}

// Carregar histórico de conversa
export function carregarHistoricoConversa(usuarioId: string) {
  try {
    const historico = localStorage.getItem("thoth_historico")
    if (historico) {
      historicoConversas = JSON.parse(historico)
    }
  } catch (error) {
    console.error("Erro ao carregar histórico de conversas:", error)
  }

  return historicoConversas[usuarioId]?.mensagens || []
}

// Gerenciar sessões ativas de chat
export function iniciarSessaoChat(usuarioId: string) {
  if (!historicoConversas[usuarioId]) {
    historicoConversas[usuarioId] = {
      mensagens: [],
      ultimaInteracao: Date.now(),
    }
  }

  return {
    mensagensIniciais: [
      {
        tipo: "resposta",
        texto: "Olá! Sou Thoth, seu assistente IA do sistema de senhas. Como posso ajudar você hoje?",
      },
    ],
  }
}
