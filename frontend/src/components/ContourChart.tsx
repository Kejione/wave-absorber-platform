import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface ContourChartProps {
  title: string
  frequency: number[]
  thickness: number[]
  values: number[][]
  areaRatio: number
  unit: string
}

export default function ContourChart({ title, frequency, thickness, values, areaRatio, unit }: ContourChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current, undefined, { renderer: 'canvas' })

    let minVal = Infinity
    let maxVal = -Infinity
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < values[i].length; j++) {
        const v = values[i][j]
        if (v < minVal) minVal = v
        if (v > maxVal) maxVal = v
      }
    }

    const data: number[][] = []
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < values[i].length; j++) {
        data.push([i, j, values[i][j]])
      }
    }

    const option = {
      title: { text: title, left: 'center' },
      tooltip: {
        trigger: 'item' as const,
        formatter: (params: { value: number[] }) => {
          if (params.value && params.value.length >= 3) {
            const freqIdx = params.value[0]
            const thickIdx = params.value[1]
            return `频率: ${frequency[freqIdx]?.toFixed(2)} GHz<br/>厚度: ${thickness[thickIdx]?.toFixed(2)} mm<br/>${unit}: ${params.value[2]?.toFixed(4)}`
          }
          return ''
        },
      },
      visualMap: {
        min: minVal,
        max: maxVal,
        calculable: true,
        orient: 'vertical' as const,
        right: 10,
        top: 'center',
      },
      xAxis: {
        type: 'category' as const,
        data: frequency.map(f => f.toFixed(2)),
        name: 'Frequency (GHz)',
        nameLocation: 'middle' as const,
        nameGap: 30,
      },
      yAxis: {
        type: 'category' as const,
        data: thickness.map(t => t.toFixed(2)),
        name: 'Thickness (mm)',
        nameLocation: 'middle' as const,
        nameGap: 40,
      },
      series: [{
        type: 'heatmap' as const,
        data: data,
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
      }],
      graphic: [{
        type: 'text' as const,
        left: '80%',
        top: 10,
        style: {
          text: `面积占比: ${areaRatio.toFixed(2)}%`,
          fontSize: 14,
          fontWeight: 'bold',
        },
      }],
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [title, frequency, thickness, values, areaRatio, unit])

  return <div ref={chartRef} style={{ height: 500, width: '100%' }} />
}
