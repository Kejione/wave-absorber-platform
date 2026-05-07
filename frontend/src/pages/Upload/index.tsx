import { useState } from 'react'
import { Upload, Form, InputNumber, Button, Card, message, Typography } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { tasksApi, TaskCreateParams } from '@/api/tasks'

const { Title, Text } = Typography
const { Dragger } = Upload

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: Record<string, unknown>) => {
    if (!file) {
      message.error('请先上传文件')
      return
    }
    setLoading(true)
    try {
      const params: TaskCreateParams = {
        thick_range: [values.thick_start as number, values.thick_end as number, values.thick_step as number],
        rl_threshold: values.rl_threshold as number,
        im_threshold: [values.im_min as number, values.im_max as number],
        delta_threshold: values.delta_threshold as number,
      }
      await tasksApi.create(file, params)
      message.success('任务创建成功')
      navigate('/')
    } catch {
      message.error('任务创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Title level={4}>新建任务</Title>
      <Card>
        <Dragger
          accept=".dat,.eu,.xlsx"
          maxCount={1}
          beforeUpload={(f) => { setFile(f); return false }}
          onRemove={() => setFile(null)}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持 .dat / .eu / .xlsx 格式</p>
        </Dragger>

        <Form
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            thick_start: 0, thick_end: 5, thick_step: 0.01,
            rl_threshold: -10, im_min: 0.52, im_max: 1.93, delta_threshold: 0.3,
          }}
          style={{ marginTop: 24 }}
        >
          <Text strong>厚度范围 (mm)</Text>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Form.Item name="thick_start" noStyle><InputNumber placeholder="起始" style={{ width: '33%' }} /></Form.Item>
            <Form.Item name="thick_end" noStyle><InputNumber placeholder="结束" style={{ width: '33%' }} /></Form.Item>
            <Form.Item name="thick_step" noStyle><InputNumber placeholder="步长" step={0.01} style={{ width: '33%' }} /></Form.Item>
          </div>

          <Form.Item label="RL阈值 (dB)" name="rl_threshold">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Text strong>IM阈值范围</Text>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Form.Item name="im_min" noStyle><InputNumber placeholder="最小值" step={0.01} style={{ width: '50%' }} /></Form.Item>
            <Form.Item name="im_max" noStyle><InputNumber placeholder="最大值" step={0.01} style={{ width: '50%' }} /></Form.Item>
          </div>

          <Form.Item label="Delta阈值" name="delta_threshold">
            <InputNumber step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">开始计算</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
