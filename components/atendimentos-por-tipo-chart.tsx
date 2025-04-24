"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface AtendimentosPorTipoChartProps {
  dados: Array<{
    tipo: string
    quantidade: number
    percentual: number
  }>
}

export function AtendimentosPorTipoChart({ dados }: AtendimentosPorTipoChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current || !dados || dados.length === 0) return

    // Destruir gráfico anterior se existir
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Preparar dados para o gráfico
    const labels = dados.map((item) => item.tipo)
    const quantidadeData = dados.map((item) => item.quantidade)
    const percentualData = dados.map((item) => item.percentual)

    // Cores para os diferentes tipos
    const backgroundColors = [
      "rgba(59, 130, 246, 0.7)",
      "rgba(16, 185, 129, 0.7)",
      "rgba(245, 158, 11, 0.7)",
      "rgba(239, 68, 68, 0.7)",
      "rgba(139, 92, 246, 0.7)",
    ]

    // Criar novo gráfico
    chartInstance.current = new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            label: "Quantidade de Atendimentos",
            data: quantidadeData,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map((color) => color.replace("0.7", "1")),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || ""
                const value = context.raw as number
                const percentual = percentualData[context.dataIndex]
                return `${label}: ${value} (${percentual}%)`
              },
            },
          },
          legend: {
            position: "right",
          },
          title: {
            display: true,
            text: "Distribuição de Atendimentos por Tipo",
          },
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [dados])

  return <canvas ref={chartRef} />
}
