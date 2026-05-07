import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tabs, Button, Spin, message, Typography, Descriptions, Tag } from 'antd'
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { tasksApi, TaskDetail } from '@/api/tasks'
import ContourChart from '@/components/ContourChart'

const { Title } = Typography

export default function Result() {
  const { id } = useParams<{ id: string }>()
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    tasksApi.get(id).then(res => setTask(res.data)).catch(() => message.error('获取任务详情失败')).finally(() => setLoading(false))
  }, [id])

  const handleDownload = async () => {
    if (!id) return
    try {
      const res = await tasksApi.download(id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${task?.filename}_结果.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      message.error('下载失败')
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '40vh' }} />
  if (!task) return <div>任务不存在</div>

  const result = task.result

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>返回</Button>
          <Title level={4} style={{ margin: 0 }}>{task.filename}</Title>
          <Tag color={task.status === 'completed' ? 'success' : 'error'}>{task.status}</Tag>
        </div>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>下载Excel</Button>
      </div>

      {result && (
        <>
          <Descriptions bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="RL面积占比">{result.area_ratios.rl.toFixed(2)}%</Descriptions.Item>
            <Descriptions.Item label="IM面积占比">{result.area_ratios.im.toFixed(2)}%</Descriptions.Item>
            <Descriptions.Item label="Delta面积占比">{result.area_ratios.delta.toFixed(2)}%</Descriptions.Item>
          </Descriptions>

          <Tabs
            items={[
              {
                key: 'rl',
                label: '反射损耗 (RL)',
                children: <ContourChart title="RL等高线图" frequency={result.rl.frequency} thickness={result.rl.thickness} values={result.rl.values} areaRatio={result.area_ratios.rl} unit="RL (dB)" />,
              },
              {
                key: 'im',
                label: '输入阻抗 (IM)',
                children: <ContourChart title="IM等高线图" frequency={result.im.frequency} thickness={result.im.thickness} values={result.im.values} areaRatio={result.area_ratios.im} unit="|Zin|" />,
              },
              {
                key: 'delta',
                label: 'Delta参数',
                children: <ContourChart title="Delta等高线图" frequency={result.delta.frequency} thickness={result.delta.thickness} values={result.delta.values} areaRatio={result.area_ratios.delta} unit="Delta" />,
              },
            ]}
          />
        </>
      )}
    </div>
  )
}
