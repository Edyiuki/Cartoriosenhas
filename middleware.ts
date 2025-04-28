import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Permitir solicitações para a rota de API do Socket.io
  if (request.nextUrl.pathname.startsWith("/api/socketio")) {
    return NextResponse.next({
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/socketio/:path*"],
}
