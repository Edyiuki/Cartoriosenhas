import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { pergunta, contexto } = await request.json()

    // Verificar se a pergunta foi fornecida
    if (!pergunta) {
      return NextResponse.json({ error: "Pergunta não fornecida" }, { status: 400 })
    }

    // Verificar se a chave de API da OpenAI está disponível e é válida
    const apiKey = process.env.OPENAI_API_KEY

    // Se não houver chave de API ou se for uma chave de placeholder, usar o fallback local
    if (!apiKey || apiKey === "admin123" || apiKey.length < 20) {
      console.warn("Chave de API OpenAI não configurada ou inválida. Usando resposta local.")
      return NextResponse.json(gerarRespostaLocal(pergunta))
    }

    // Preparar o contexto para a IA
    const contextoFormatado = prepararContextoParaIA(pergunta, contexto)

    // Usar o AI SDK para gerar resposta
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: pergunta,
        system: contextoFormatado,
        maxTokens: 1000,
      })

      // Processar a resposta para extrair fonte se mencionada
      const { textoProcessado, fonte } = processarResposta(text)

      return NextResponse.json({
        texto: textoProcessado,
        fonte: fonte,
        confianca: 0.98,
      })
    } catch (openaiError) {
      console.error("Erro ao chamar OpenAI:", openaiError)

      // Tentar fallback para modelo mais simples
      try {
        const { text } = await generateText({
          model: openai("gpt-3.5-turbo"),
          prompt: pergunta,
          system: contextoFormatado,
          maxTokens: 800,
        })

        const { textoProcessado, fonte } = processarResposta(text)

        return NextResponse.json({
          texto: textoProcessado,
          fonte: fonte,
          confianca: 0.85,
        })
      } catch (fallbackError) {
        console.error("Erro no modelo de fallback:", fallbackError)
        return NextResponse.json(gerarRespostaLocal(pergunta))
      }
    }
  } catch (error) {
    console.error("Erro ao processar pergunta:", error)
    return NextResponse.json(gerarRespostaLocal(request.body?.pergunta || ""), { status: 200 })
  }
}

// Função para preparar o contexto para a IA
function prepararContextoParaIA(pergunta: string, contexto: any): string {
  // Extrair informações relevantes do contexto
  const { totalAtendimentos, tempoMedio, produtividade, resultadosBusca, ultimasPerguntas = [] } = contexto || {}

  // Construir contexto de estatísticas
  let contextoEstatisticas = ""
  if (totalAtendimentos || tempoMedio || produtividade) {
    contextoEstatisticas = `
    Estatísticas do sistema:
    - Total de atendimentos: ${totalAtendimentos || "Não disponível"}
    - Tempo médio de atendimento: ${tempoMedio || "Não disponível"}
    - Produtividade média: ${produtividade || "Não disponível"}
    `
  }

  // Construir contexto de busca na web
  let contextoBusca = ""
  if (resultadosBusca && resultadosBusca.length > 0) {
    contextoBusca = `
    Informações relevantes encontradas na web:
    ${resultadosBusca
      .map(
        (resultado: any, index: number) =>
          `[${index + 1}] ${resultado.titulo}
       URL: ${resultado.url}
       ${resultado.snippet}`,
      )
      .join("\n\n")}
    `
  }

  // Construir contexto de histórico de perguntas
  let contextoHistorico = ""
  if (ultimasPerguntas.length > 0) {
    contextoHistorico = `
    Perguntas recentes do usuário:
    ${ultimasPerguntas.map((p: string) => `- ${p}`).join("\n")}
    `
  }

  // Instruções para a IA
  return `Você é Thoth, um assistente IA avançado para o sistema de gerenciamento de senhas de cartório.
  
  Sua personalidade:
  - Você é prestativo, informativo e profissional
  - Você é especialista em procedimentos cartorários e no sistema de senhas
  - Você é capaz de analisar dados e fornecer insights úteis
  - Você é conciso mas completo em suas respostas
  
  Conhecimentos específicos:
  - Procedimentos cartorários (certidões, registros, autenticações)
  - Documentação necessária para diferentes serviços
  - Análise de desempenho do sistema de atendimento
  - Otimização de fluxo de trabalho em cartórios
  
  ${contextoEstatisticas}
  
  ${contextoBusca}
  
  ${contextoHistorico}
  
  Ao responder:
  1. Seja direto e objetivo, mas forneça informações completas
  2. Se usar informações da web, cite a fonte no formato [Fonte: título do site]
  3. Se não tiver certeza sobre algo, indique isso claramente
  4. Evite repetir informações que já foram discutidas em perguntas anteriores
  5. Personalize sua resposta para o contexto específico do cartório e sistema de senhas
  
  Responda à seguinte pergunta do usuário: "${pergunta}"`
}

// Função para processar a resposta e extrair fonte
function processarResposta(texto: string): { textoProcessado: string; fonte?: string } {
  // Verificar se a resposta menciona uma fonte
  const regex = /\[Fonte: ([^\]]+)\]/
  const match = texto.match(regex)

  if (match && match[1]) {
    // Extrair a fonte e remover a marcação da resposta
    const fonte = match[1].trim()
    const textoProcessado = texto.replace(regex, "").trim()
    return { textoProcessado, fonte }
  }

  return { textoProcessado: texto }
}

// Função para gerar respostas locais quando a API falhar
function gerarRespostaLocal(pergunta: string): { texto: string; confianca: number } {
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
    }
  }

  // Perguntas sobre o sistema
  if (perguntaLower.includes("sistema") || perguntaLower.includes("como funciona") || perguntaLower.includes("ajuda")) {
    return {
      texto: `O Sistema de Senhas do Cartório permite gerenciar o fluxo de atendimento, desde a emissão de senhas até a chamada e finalização do atendimento. Os usuários podem retirar senhas, os atendentes podem chamar as próximas senhas, e a recepção pode direcionar senhas para guichês específicos. Todos os dados são sincronizados em tempo real entre os usuários.`,
      confianca: 0.9,
    }
  }

  // Perguntas sobre documentos
  if (perguntaLower.includes("documento") || perguntaLower.includes("certidão") || perguntaLower.includes("registro")) {
    return {
      texto: `Para serviços de cartório, geralmente são necessários documentos como RG, CPF, comprovante de residência e documentos específicos dependendo do serviço (certidão de nascimento, casamento, etc.). Para informações mais detalhadas sobre um serviço específico, por favor especifique qual serviço você precisa.`,
      confianca: 0.85,
    }
  }

  // Perguntas sobre tempo de espera
  if (perguntaLower.includes("tempo") || perguntaLower.includes("espera") || perguntaLower.includes("fila")) {
    return {
      texto: `O tempo médio de espera varia conforme o horário e o dia da semana. Geralmente, o início da manhã e final da tarde têm menor movimento. O sistema de senhas ajuda a organizar o atendimento e reduzir o tempo de espera. Você pode acompanhar a fila atual através do painel digital na recepção ou pelo site do cartório.`,
      confianca: 0.88,
    }
  }

  // Resposta genérica para perguntas não reconhecidas
  return {
    texto: `Obrigado pela sua pergunta sobre "${pergunta}". Como Thoth, posso ajudar com informações sobre procedimentos do cartório, documentação necessária, análise de desempenho do sistema de atendimento, e outras questões relacionadas. Poderia fornecer mais detalhes sobre sua dúvida para que eu possa lhe dar uma resposta mais precisa?`,
    confianca: 0.75,
  }
}
