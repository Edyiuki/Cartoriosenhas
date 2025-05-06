// Interface para respostas da IA
export interface IAResponse {
  texto: string
  fonte?: string
  confianca?: number
  tempoResposta?: number
  sugestoes?: string[]
}

// Interface para resultados de busca na web
interface WebSearchResult {
  titulo: string
  url: string
  snippet: string
}

// Função para buscar informações na web com tratamento de erro robusto
async function buscarNaWeb(query: string): Promise<WebSearchResult[]> {
  try {
    // Verificar se estamos em ambiente de produção (com API real) ou desenvolvimento
    const isDev =
      process.env.NODE_ENV === "development" ||
      (typeof window !== "undefined" && window.location.hostname === "localhost") ||
      (typeof window !== "undefined" && window.location.hostname.includes("vercel.app"))

    // Em ambiente de desenvolvimento, usamos sempre dados simulados
    if (isDev) {
      console.log("Ambiente de desenvolvimento detectado: usando simulação de busca")
      return simulateWebSearchResults(query)
    }

    // Em produção, tentamos a API real
    const apiKey = process.env.SEARCH_API_KEY
    if (!apiKey) {
      console.warn("API Key não encontrada. Usando simulação de resultados.")
      return simulateWebSearchResults(query)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // Timeout de 5 segundos

    try {
      const response = await fetch(`https://api.search.example.com/search?q=${encodeURIComponent(query)}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(`Erro na busca: ${response.status}`)
        return simulateWebSearchResults(query)
      }

      // Processar resposta da API
      const data = await response.json()
      return data.results || []
    } catch (fetchError) {
      console.log("Erro na requisição fetch, usando simulação:", fetchError)
      return simulateWebSearchResults(query)
    }
  } catch (error) {
    console.error("Erro no sistema de busca:", error)
    return simulateWebSearchResults(query)
  }
}

// Função para simular resultados de busca melhorada
function simulateWebSearchResults(query: string): WebSearchResult[] {
  // Simulação de resultados baseados na consulta
  const lowerQuery = query.toLowerCase()
  const resultados: WebSearchResult[] = []

  if (lowerQuery.includes("cartório") || lowerQuery.includes("cartorio")) {
    resultados.push({
      titulo: "Serviços de Cartório - Guia Completo 2023",
      url: "https://exemplo.com/servicos-cartorio",
      snippet:
        "Guia completo e atualizado sobre serviços de cartório, incluindo certidões, registros e autenticações. Saiba quais documentos levar e valores de taxas.",
    })
    resultados.push({
      titulo: "Documentos necessários para serviços cartorários",
      url: "https://exemplo.com/documentos-cartorio",
      snippet:
        "Lista de documentos necessários para os principais serviços de cartório no Brasil. Inclui informações sobre procurações, reconhecimento de firma e mais.",
    })
  }

  if (lowerQuery.includes("certidão") || lowerQuery.includes("certidao")) {
    resultados.push({
      titulo: "Como obter certidões em cartórios - Procedimentos 2023",
      url: "https://exemplo.com/obter-certidoes",
      snippet:
        "Passo a passo para obter diferentes tipos de certidões em cartórios brasileiros. Valores, prazos e requisitos para cada tipo de certidão.",
    })
    resultados.push({
      titulo: "Validade de certidões cartoriais - Períodos e Renovação",
      url: "https://exemplo.com/validade-certidoes",
      snippet:
        "Informações sobre prazos de validade de diferentes certidões emitidas por cartórios e como renovar documentos vencidos.",
    })
  }

  if (lowerQuery.includes("nascimento")) {
    resultados.push({
      titulo: "Certidão de Nascimento: Como emitir, 2ª via e documentos",
      url: "https://exemplo.com/certidao-nascimento",
      snippet:
        "Tudo sobre certidão de nascimento: como emitir a primeira e segunda via, quais documentos são necessários e quanto custa o serviço em 2023.",
    })
  }

  if (lowerQuery.includes("casamento")) {
    resultados.push({
      titulo: "Processo de Casamento Civil: Documentação e Etapas",
      url: "https://exemplo.com/processo-casamento",
      snippet:
        "Guia completo sobre o processo de casamento civil: documentos necessários, habilitação, cerimônia e certidão de casamento.",
    })
  }

  if (lowerQuery.includes("óbito") || lowerQuery.includes("obito")) {
    resultados.push({
      titulo: "Registro de Óbito: Procedimentos e Prazos Legais",
      url: "https://exemplo.com/registro-obito",
      snippet:
        "Informações sobre o registro de óbito, incluindo prazos legais, documentos necessários e procedimentos em diferentes situações.",
    })
  }

  if (lowerQuery.includes("sistema") || lowerQuery.includes("senhas") || lowerQuery.includes("atendimento")) {
    resultados.push({
      titulo: "Sistemas de Gerenciamento de Filas: Eficiência no Atendimento",
      url: "https://exemplo.com/sistemas-gerenciamento-filas",
      snippet:
        "Como sistemas modernos de gerenciamento de filas e senhas podem melhorar a eficiência do atendimento em cartórios e outros serviços públicos.",
    })
    resultados.push({
      titulo: "Tecnologias para Otimização de Atendimento em Cartórios",
      url: "https://exemplo.com/tecnologia-cartorios",
      snippet:
        "Tecnologias e sistemas que estão transformando o atendimento em cartórios, reduzindo tempo de espera e melhorando a experiência do cidadão.",
    })
  }

  // Resultados genéricos se nenhum tópico específico for identificado
  if (resultados.length === 0) {
    resultados.push({
      titulo: "Informações sobre Serviços Cartorários no Brasil",
      url: "https://exemplo.com/servicos-cartorarios-brasil",
      snippet: `Resultados para "${query}": Informações relevantes sobre serviços cartoriais, legislação e procedimentos atualizados.`,
    })
  }

  // Limitar a 3 resultados para não sobrecarregar
  return resultados.slice(0, 3)
}

// Função para processar pergunta com melhor tratamento de erros
export async function processarPergunta(pergunta: string, contexto: any = {}): Promise<IAResponse> {
  const startTime = Date.now()

  try {
    // Verificar conexão com a internet
    if (!navigator.onLine) {
      throw new Error("Sem conexão com a internet")
    }

    // Buscar informações relevantes na web com tratamento de erros
    let resultadosBusca: WebSearchResult[] = []
    try {
      resultadosBusca = await buscarNaWeb(pergunta)
    } catch (buscarErro) {
      console.error("Erro ao buscar na web (tratado):", buscarErro)
      // Continuar mesmo com erro na busca
    }

    // Adicionar resultados da busca ao contexto
    const contextoEnriquecido = {
      ...contexto,
      resultadosBusca: resultadosBusca.length > 0 ? resultadosBusca : undefined,
      ultimasPerguntas: obterUltimasPerguntas(contexto.usuarioId || "anonimo", 5),
    }

    // Usar a rota de API interna em vez de chamar a OpenAI diretamente
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos de timeout

      const response = await fetch("/api/ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pergunta,
          contexto: contextoEnriquecido,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data = await response.json()

      // Se a API retornar um erro, lançar exceção
      if (data.error) {
        throw new Error(data.error)
      }

      // Salvar a pergunta e resposta no histórico
      if (contexto.usuarioId) {
        salvarNaConversa(contexto.usuarioId, pergunta, data.texto)
      }

      // Gerar sugestões com base na resposta e pergunta
      const sugestoes = gerarSugestoes(pergunta, data.texto)

      return {
        texto: data.texto,
        fonte: data.fonte,
        confianca: data.confianca || 0.95,
        tempoResposta: Date.now() - startTime,
        sugestoes,
      }
    } catch (apiError) {
      console.error("Erro ao processar pergunta com API:", apiError)

      // Verificar se é um erro de timeout
      if (apiError.name === "AbortError") {
        throw new Error("Tempo limite excedido ao se comunicar com o serviço de IA")
      }

      throw apiError // Propagar para ser tratado pelo fallback
    }
  } catch (error) {
    console.error("Erro ao processar pergunta:", error)

    // Registrar o erro para análise posterior
    registrarErroIA(pergunta, error)

    // Fallback para o sistema local em caso de erro
    return gerarRespostaFallback(pergunta, startTime)
  }
}

// Função para gerar sugestões baseadas na pergunta e resposta atual
function gerarSugestoes(pergunta: string, resposta: string): string[] {
  const perguntaLower = pergunta.toLowerCase()
  const respostaLower = resposta.toLowerCase()

  // Sugestões contextuais baseadas em padrões identificados
  if (perguntaLower.includes("certidão") || respostaLower.includes("certidão")) {
    return [
      "Quanto tempo leva para emitir uma certidão?",
      "Quais documentos são necessários para 2ª via?",
      "Como solicitar certidão online?",
    ]
  }

  if (
    perguntaLower.includes("tempo") ||
    respostaLower.includes("espera") ||
    perguntaLower.includes("fila") ||
    respostaLower.includes("atendimento")
  ) {
    return [
      "Qual o horário de menor movimento?",
      "Como agendar atendimento prioritário?",
      "É possível verificar a fila remotamente?",
    ]
  }

  if (perguntaLower.includes("casamento") || respostaLower.includes("casamento")) {
    return [
      "Quais documentos para casamento civil?",
      "Quanto custa o processo de casamento?",
      "Qual o prazo para habilitação de casamento?",
    ]
  }

  if (
    perguntaLower.includes("sistema") ||
    perguntaLower.includes("digital") ||
    respostaLower.includes("online") ||
    respostaLower.includes("digital")
  ) {
    return [
      "Quais serviços estão disponíveis online?",
      "Como acessar o portal de serviços digitais?",
      "O sistema funciona em feriados?",
    ]
  }

  // Sugestões padrão caso nenhum contexto específico seja identificado
  return [
    "Quais serviços são oferecidos pelo cartório?",
    "Como funciona o sistema de senhas?",
    "Quais os horários de funcionamento?",
  ]
}

// Função para gerar resposta de fallback melhorada
function gerarRespostaFallback(pergunta: string, startTime: number): IAResponse {
  const perguntaLower = pergunta.toLowerCase()

  // Saudações
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
      tempoResposta: Date.now() - startTime,
      sugestoes: [
        "Quais serviços estão disponíveis?",
        "Como funciona o sistema de senhas?",
        "Qual o tempo médio de espera?",
      ],
    }
  }

  // Categorias comuns de perguntas
  if (perguntaLower.includes("certidão") || perguntaLower.includes("certidao")) {
    return {
      texto: `Para solicitar certidões, geralmente são necessários documentos de identificação (RG e CPF) e, dependendo do tipo de certidão, documentos específicos adicionais. O prazo de emissão varia de acordo com o tipo de certidão e a demanda atual do cartório. Posso fornecer informações mais detalhadas se você especificar qual tipo de certidão precisa.`,
      confianca: 0.85,
      tempoResposta: Date.now() - startTime,
      sugestoes: [
        "Como solicitar certidão de nascimento?",
        "Documentos para certidão de casamento",
        "Prazo para emissão de certidões",
      ],
    }
  }

  if (perguntaLower.includes("tempo") || perguntaLower.includes("espera") || perguntaLower.includes("fila")) {
    return {
      texto: `O tempo médio de espera varia conforme o horário e o dia da semana. Geralmente, o início da manhã e final da tarde têm menor movimento. O sistema de senhas ajuda a organizar o atendimento e reduzir o tempo de espera. Você pode acompanhar a fila atual através do painel digital na recepção ou pelo site do cartório.`,
      confianca: 0.82,
      tempoResposta: Date.now() - startTime,
      sugestoes: [
        "Qual o horário de menor movimento?",
        "Como funciona a senha prioritária?",
        "Posso agendar atendimento?",
      ],
    }
  }

  // Resposta genérica para perguntas não reconhecidas - mais personalizada
  return {
    texto: `Obrigado pela sua pergunta sobre "${pergunta}". Estou com dificuldades para acessar minha base de conhecimento completa neste momento. Como Thoth, posso normalmente ajudar com informações sobre procedimentos do cartório, documentação necessária, análise de desempenho do sistema de atendimento, e outras questões relacionadas. Poderia reformular sua pergunta ou tentar novamente em alguns instantes?`,
    confianca: 0.75,
    tempoResposta: Date.now() - startTime,
    sugestoes: [
      "Quais serviços o cartório oferece?",
      "Documentos necessários para registro",
      "Horário de funcionamento",
    ],
  }
}

// Função para registrar erros da IA para análise posterior
function registrarErroIA(pergunta: string, erro: any) {
  try {
    const errosAnteriores = JSON.parse(localStorage.getItem("thoth_erros") || "[]")
    const novoErro = {
      timestamp: Date.now(),
      pergunta,
      erro: erro.toString(),
      stack: erro.stack,
    }

    errosAnteriores.push(novoErro)

    // Manter apenas os últimos 50 erros
    if (errosAnteriores.length > 50) {
      errosAnteriores.shift()
    }

    localStorage.setItem("thoth_erros", JSON.stringify(errosAnteriores))
  } catch (e) {
    console.error("Erro ao registrar erro da IA:", e)
  }
}

// Sistema de histórico de conversas melhorado
let historicoConversas: Record<
  string,
  {
    mensagens: Array<{ pergunta: string; resposta: string; timestamp: number }>
    ultimaInteracao: number
    topicos: Set<string>
  }
> = {}

// Função para extrair tópicos de uma mensagem
function extrairTopicos(texto: string): string[] {
  const topicosComuns = [
    "certidão",
    "registro",
    "nascimento",
    "casamento",
    "óbito",
    "documento",
    "atendimento",
    "prazo",
    "taxa",
    "custo",
    "sistema",
    "senha",
    "guichê",
    "fila",
    "espera",
  ]

  return topicosComuns.filter((topico) => texto.toLowerCase().includes(topico.toLowerCase()))
}

// Gerenciamento de histórico melhorado
export function salvarNaConversa(usuarioId: string, pergunta: string, resposta: string) {
  if (!historicoConversas[usuarioId]) {
    historicoConversas[usuarioId] = {
      mensagens: [],
      ultimaInteracao: Date.now(),
      topicos: new Set(),
    }
  }

  // Extrair tópicos da pergunta e resposta
  const topicos = [...extrairTopicos(pergunta), ...extrairTopicos(resposta)]

  // Adicionar tópicos ao histórico do usuário
  topicos.forEach((topico) => {
    historicoConversas[usuarioId].topicos.add(topico)
  })

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
    localStorage.setItem(
      "thoth_historico",
      JSON.stringify(
        Object.fromEntries(
          Object.entries(historicoConversas).map(([id, data]) => [
            id,
            {
              ...data,
              topicos: Array.from(data.topicos),
            },
          ]),
        ),
      ),
    )
  } catch (error) {
    console.error("Erro ao salvar histórico de conversas:", error)
  }
}

// Obter últimas perguntas para contexto
export function obterUltimasPerguntas(usuarioId: string, quantidade = 5): string[] {
  try {
    carregarHistoricoConversa(usuarioId)

    if (!historicoConversas[usuarioId]) {
      return []
    }

    return historicoConversas[usuarioId].mensagens.slice(-quantidade).map((msg) => msg.pergunta)
  } catch (error) {
    console.error("Erro ao obter últimas perguntas:", error)
    return []
  }
}

// Carregar histórico de conversa com suporte a tópicos
export function carregarHistoricoConversa(usuarioId: string) {
  try {
    const historico = localStorage.getItem("thoth_historico")
    if (historico) {
      const parsed = JSON.parse(historico)

      // Converter arrays de tópicos de volta para Sets
      historicoConversas = Object.fromEntries(
        Object.entries(parsed).map(([id, data]: [string, any]) => [
          id,
          {
            ...data,
            topicos: new Set(data.topicos || []),
          },
        ]),
      )
    }
  } catch (error) {
    console.error("Erro ao carregar histórico de conversas:", error)
  }

  return historicoConversas[usuarioId]?.mensagens || []
}

// Gerenciar sessões ativas de chat com sugestões personalizadas
export function iniciarSessaoChat(usuarioId: string) {
  if (!historicoConversas[usuarioId]) {
    historicoConversas[usuarioId] = {
      mensagens: [],
      ultimaInteracao: Date.now(),
      topicos: new Set(),
    }
  }

  // Verificar se é um usuário recorrente
  const isRecorrente = historicoConversas[usuarioId].mensagens.length > 0

  // Gerar sugestões personalizadas com base no histórico
  const sugestoes = gerarSugestoesPorHistorico(usuarioId)

  return {
    mensagensIniciais: [
      {
        tipo: "resposta",
        texto: isRecorrente
          ? `Olá novamente! Sou Thoth, seu assistente IA do sistema de senhas. Como posso ajudar você hoje?`
          : "Olá! Sou Thoth, seu assistente IA do sistema de senhas. Como posso ajudar você hoje?",
      },
    ],
    sugestoes,
  }
}

// Gerar sugestões personalizadas com base no histórico
function gerarSugestoesPorHistorico(usuarioId: string): string[] {
  if (!historicoConversas[usuarioId] || historicoConversas[usuarioId].mensagens.length === 0) {
    // Sugestões padrão para novos usuários
    return [
      "Como funciona o sistema de senhas?",
      "Quais documentos são necessários para certidão de nascimento?",
      "Qual o tempo médio de atendimento?",
      "Como otimizar o fluxo de atendimento?",
    ]
  }

  // Sugestões baseadas nos tópicos discutidos anteriormente
  const topicos = Array.from(historicoConversas[usuarioId].topicos)

  if (topicos.includes("certidão") || topicos.includes("registro")) {
    return [
      "Quais documentos são necessários para certidão de nascimento?",
      "Como solicitar uma segunda via de certidão?",
      "Qual o prazo para emissão de certidões?",
      "Quais são as taxas para emissão de certidões?",
    ]
  }

  if (topicos.includes("sistema") || topicos.includes("senha") || topicos.includes("guichê")) {
    return [
      "Como otimizar o fluxo de atendimento?",
      "Qual o tempo médio de espera atual?",
      "Como funciona a prioridade de atendimento?",
      "Quais são os horários de pico de atendimento?",
    ]
  }

  // Sugestões genéricas
  return [
    "Como posso melhorar a eficiência do atendimento?",
    "Quais são as estatísticas de atendimento desta semana?",
    "Quais documentos são mais solicitados?",
    "Como reduzir o tempo de espera?",
  ]
}
