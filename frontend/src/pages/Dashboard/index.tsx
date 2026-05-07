import { useEffect, useState } from 'react'
import { Table, Button, Tag, Space, Popconfirm, message, Typography } from 'antd'
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { tasksApi, Task } from '@/api/tasks'
import { useAuth } from '@/stores/auth'

const { Title } = Typography

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'default', text: '等待中' },
  processing: { color: 'processing', text: '处理中' },
  completed: { color: 'success', text: '已完成' },
  failed: { color: 'error', text: '失败' },
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await tasksApi.list()
      setTasks(res.data)
    } catch {
      message.error('获取任务列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  const handleDelete = async (id: string) => {
    try {
      await tasksApi.delete(id)
      message.success('删除成功')
      fetchTasks()
    } catch {
      message.error('删除失败')
    }
  }

  const columns = [
    { title: '文件名', dataIndex: 'filename', key: 'filename' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string) => {
        const s = statusMap[status] || { color: 'default', text: status }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (t: string) => new Date(t).toLocaleString() },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: Task) => (
        <Space>
          {record.status === 'completed' && (
            <Button type="link" onClick={() => navigate(`/tasks/${record.id}`)}>查看</Button>
          )}
          <Popconfirm title="确定删除此任务？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>我的任务</Title>
        <Space>
          <span>欢迎, {user?.username}</span>
          <Button icon={<ReloadOutlined />} onClick={fetchTasks}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/upload')}>新建任务</Button>
          <Button onClick={logout}>退出</Button>
        </Space>
      </div>
      <Table columns={columns} dataSource={tasks} rowKey="id" loading={loading} />
    </div>
  )
}
