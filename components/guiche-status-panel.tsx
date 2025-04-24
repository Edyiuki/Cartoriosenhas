"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { obterStatusGuiches, atualizarStatusGuiche } from "@/lib/guiches"
import { obterUsuarioAtual } from "@/lib/auth"

interface GuicheStatusPanelProps {
  isRecepcao?: boolean
}

export function GuicheStatusPanel({ isRecepcao = false }: GuicheStatusPanelProps) {
  const [statusGuiches, setStatusGuiches] = useState<Record<string, string>>({})
  const [usuario, setUsuario] = useState<any>(null)

  useEffect(() => {
    const carregarDados = async () => {
      const user = await obterUsuarioAtual()
      setUsuario(user)

      const status = await obterStatusGuiches()
      setStatusGuiches(status)
    }

    carregarDados()

    // Configurar atualização periódica
    const interval = setInterval(() => {
      obterStatusGuiches().then(setStatusGuiches)
    }, 10000) // Atualiza a cada 10 segundos

    return () => clearInterval(interval)
  }, [])

  const handleAtualizarStatus = async (guiche: string, status: string) => {
    await atualizarStatusGuiche(guiche, status, usuario?.nome || "Sistema")
    setStatusGuiches((prev) => ({
      ...prev,
      [guiche]: status,
    }))
  }

  return (
    <div className="space-y-3">
      {Object.entries(statusGuiches).map(([guiche, status]) => (
        <div
          key={guiche}
          className={`p-3 rounded-md ${
            status === "disponível" ? "bg-green-50" : status === "ocupado" ? "bg-red-50" : "bg-yellow-50"
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">Guichê {guiche}</div>
              <Badge
                className={`mt-1 ${
                  status === "disponível" ? "bg-green-500" : status === "ocupado" ? "bg-red-500" : "bg-yellow-500"
                }`}
              >
                {status}
              </Badge>
            </div>

            {(isRecepcao || usuario?.guiche === guiche) && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={status === "disponível" ? "default" : "outline"}
                  className="h-7 px-2 text-xs"
                  onClick={() => handleAtualizarStatus(guiche, "disponível")}
                >
                  Disponível
                </Button>
                <Button
                  size="sm"
                  variant={status === "ocupado" ? "default" : "outline"}
                  className="h-7 px-2 text-xs"
                  onClick={() => handleAtualizarStatus(guiche, "ocupado")}
                >
                  Ocupado
                </Button>
                <Button
                  size="sm"
                  variant={status === "ausente" ? "default" : "outline"}
                  className="h-7 px-2 text-xs"
                  onClick={() => handleAtualizarStatus(guiche, "ausente")}
                >
                  Ausente
                </Button>
              </div>
            )}
          </div>
          {status !== "disponível" && (
            <div className="text-xs text-gray-500 mt-1">
              Atualizado por: {statusGuiches[`${guiche}_por`] || "Sistema"}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
