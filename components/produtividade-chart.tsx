"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface ProdutividadeChartProps {
  dados: Array<{
    guiche: string
    produtividade: number
    atendimentos: number
    periodo: string
  }>
}

export function ProdutividadeChart({ dados }: ProdutividadeChartProps) {
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
    const produtividadeData = dados.map((item) => item.produtividade)
    const atendimentosData = dados.map((item) => item.atendimentos)

    // Criar novo gráfico
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Produtividade (%)",
            data: produtividadeData,
            backgroundColor: "rgba(59, 130, 246, 0.7)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 1,
            yAxisID: "y",
          },
          {
            label: "Atendimentos",
            data: atendimentosData,
            backgroundColor: "rgba(16, 185, 129, 0.7)",
            borderColor: "rgba(16, 185, 129, 1)",
            borderWidth: 1,
            type: "line",
            yAxisID: "y1",
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
              text: "Produtividade (%)",
            },
            position: "left",
            max: 100,
          },
          y1: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Número de Atendimentos",
            },
            position: "right",
            grid: {
              drawOnChartArea: false,
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
            text: `Produtividade e Atendimentos por Guichê`,
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
