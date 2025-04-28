import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { pergunta, contexto } = await request.json()

    // Verificar se a pergunta foi fornecida
    if (!pergunta) {
      return NextResponse.json({ error: "Pergunta não fornecida" }, { status: 400 })
    }

    // Chamar a API da OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Você é Thoth, um assistente IA para sistema de gerenciamento de senhas de cartório. 
                     Você deve responder perguntas sobre procedimentos cartorários, documentação necessária, 
                     e ajudar com análises do sistema de atendimento. 
                     Seja conciso, profissional e útil. Use os dados de contexto quando disponíveis.
                     Contexto do sistema: ${JSON.stringify(contexto || {})}`,
          },
          { role: "user", content: pergunta },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      // Implementar fallback local para quando a API falhar
      return NextResponse.json(gerarRespostaLocal(pergunta))
    }

    const data = await response.json()
    const resposta = data.choices[0].message.content

    // Verificar se a resposta menciona uma fonte
    let fonte = undefined
    if (resposta.includes("Fonte:")) {
      const match = resposta.match(/Fonte:\s*([^\n]+)/)
      if (match && match[1]) {
        fonte = match[1].trim()
      }
    }

    return NextResponse.json({
      texto: resposta,
      fonte: fonte,
      confianca: 0.95,
    })
  } catch (error) {
    console.error("Erro ao processar pergunta:", error)
    return NextResponse.json(gerarRespostaLocal(request.body?.pergunta || ""), { status: 200 })
  }
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

  // Resposta genérica para perguntas não reconhecidas
  return {
    texto: `Obrigado pela sua pergunta sobre "${pergunta}". Como Thoth, o assistente IA do sistema, posso ajudar com informações sobre procedimentos do cartório, documentação necessária, análise de desempenho do sistema de atendimento, e outras questões relacionadas. Poderia fornecer mais detalhes sobre sua dúvida para que eu possa lhe dar uma resposta mais precisa?`,
    confianca: 0.75,
  }
}
