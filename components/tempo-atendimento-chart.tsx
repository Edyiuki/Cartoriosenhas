"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface TempoAtendimentoChartProps {
  dados: Array<{
    guiche: string
    tempoMedio: number
    tempoMinimo: number
    tempoMaximo: number
  }>
}

export function TempoAtendimentoChart({ dados }: TempoAtendimentoChartProps) {
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
    const labels = dados.map((item) => `Guichê ${item.guiche}`)
    const tempoMedioData = dados.map((item) => item.tempoMedio)
    const tempoMinimoData = dados.map((item) => item.tempoMinimo)
    const tempoMaximoData = dados.map((item) => item.tempoMaximo)

    // Criar novo gráfico
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Tempo Médio (min)",
            data: tempoMedioData,
            backgroundColor: "rgba(245, 158, 11, 0.7)",
            borderColor: "rgba(245, 158, 11, 1)",
            borderWidth: 1,
          },
          {
            label: "Tempo Mínimo (min)",
            data: tempoMinimoData,
            backgroundColor: "rgba(16, 185, 129, 0.7)",
            borderColor: "rgba(16, 185, 129, 1)",
            borderWidth: 1,
          },
          {
            label: "Tempo Máximo (min)",
            data: tempoMaximoData,
            backgroundColor: "rgba(239, 68, 68, 0.7)",
            borderColor: "rgba(239, 68, 68, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Tempo (minutos)",
            },
          },
        },
        plugins: {
          tooltip: {
            mode: "index",
            intersect: false,
          },
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "Tempos de Atendimento por Guichê",
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
