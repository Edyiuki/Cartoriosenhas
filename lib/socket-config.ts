// Configurações para o Socket.io
export const SOCKET_PATH = "/api/socketio"

// Configurações do cliente
export const clientConfig = {
  path: SOCKET_PATH,
  transports: ["polling"], // Iniciar apenas com polling
  reconnectionAttempts: 10,
  reconnectionDelay: 3000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
  forceNew: true,
  autoConnect: true,
}

// Configurações do servidor
export const serverConfig = {
  path: SOCKET_PATH,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling"], // Iniciar apenas com polling
  pingTimeout: 30000,
  pingInterval: 25000,
  connectTimeout: 30000,
  upgradeTimeout: 10000,
}

// Função para verificar se o ambiente suporta WebSockets
export function supportsWebSockets(): boolean {
  if (typeof window === "undefined") return false
  return "WebSocket" in window || "MozWebSocket" in window
}
