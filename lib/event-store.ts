// Armazenamento de eventos em memória (em produção, use Redis ou similar)
export const eventStore: {
  events: Array<{
    id: number
    event: string
    payload: any
    timestamp: string
  }>
  lastId: number
  clients: Map<string, { res: any; headers: Headers }>
} = {
  events: [],
  lastId: 0,
  clients: new Map(),
}

// Função para enviar evento para todos os clientes
export function sendEventToAll(event: string, data: any) {
  const id = ++eventStore.lastId
  const payload = {
    id,
    event,
    payload: data,
    timestamp: new Date().toISOString(),
  }

  // Armazenar evento
  eventStore.events.push(payload)

  // Limitar o tamanho do histórico de eventos
  if (eventStore.events.length > 1000) {
    eventStore.events = eventStore.events.slice(-1000)
  }

  // Enviar para todos os clientes conectados
  eventStore.clients.forEach((client, clientId) => {
    const { res } = client
    if (res) {
      try {
        res.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`))
      } catch (error) {
        console.error(`Erro ao enviar evento para cliente ${clientId}:`, error)
      }
    }
  })
}

// Função para obter eventos desde um determinado ID
export function getEventsSince(lastEventId: number) {
  return eventStore.events.filter((event) => event.id > lastEventId)
}
