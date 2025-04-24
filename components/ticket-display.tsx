import { Badge } from "@/components/ui/badge"
import { formatarHora } from "@/lib/utils"

interface TicketDisplayProps {
  ticket: {
    codigo: string
    tipo: string
    subtipo: string
    horaEmissao: number
  }
}

export function TicketDisplay({ ticket }: TicketDisplayProps) {
  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase">Cartório de Registro Civil</h3>
        <p className="text-xs text-gray-400">Sistema de Senhas</p>
      </div>

      <div className="mb-6">
        <div className="text-5xl font-bold text-blue-800 mb-2">{ticket.codigo}</div>
        <div className="text-lg font-medium">{ticket.tipo}</div>
        <Badge
          className={`mt-1 ${
            ticket.subtipo === "preferencial"
              ? "bg-green-500"
              : ticket.subtipo === "tardio"
                ? "bg-purple-500"
                : ticket.subtipo === "indigente"
                  ? "bg-red-500"
                  : ""
          }`}
        >
          {ticket.subtipo}
        </Badge>
      </div>

      <div className="text-sm text-gray-500">
        <p>Data: {new Date().toLocaleDateString()}</p>
        <p>Hora: {formatarHora(ticket.horaEmissao)}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-dashed border-gray-200 text-xs text-gray-400">
        <p>Aguarde ser chamado pelo painel eletrônico</p>
        <p>Sua senha será anunciada por voz</p>
      </div>
    </div>
  )
}
