import ReactECharts from 'echarts-for-react'

interface ContourChartProps {
  title: string
  frequency: number[]
  thickness: number[]
  values: number[][]
  areaRatio: number
  unit: string
}

export default function ContourChart({ title, frequency, thickness, values, areaRatio, unit }: ContourChartProps) {
  const flatValues = values.flat()
  const minVal = Math.min(...flatValues)
  const maxVal = Math.max(...flatValues)

  const data: number[][] = []
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < values[i].length; j++) {
      data.push([i, j, values[i][j]])
    }
  }

  const option = {
    title: { text: title, left: 'center' },
    tooltip: {
      trigger: 'item',
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

  return <ReactECharts option={option} style={{ height: 500 }} />
}
