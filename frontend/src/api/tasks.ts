import client from './client'

export interface Task {
  id: string
  filename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  params: Record<string, unknown> | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface TaskDetail extends Task {
  result: {
    rl: { frequency: number[]; thickness: number[]; values: number[][] }
    im: { frequency: number[]; thickness: number[]; values: number[][] }
    delta: { frequency: number[]; thickness: number[]; values: number[][] }
    area_ratios: { rl: number; im: number; delta: number }
  } | null
}

export interface TaskCreateParams {
  thick_range?: [number, number, number]
  rl_threshold?: number
  im_threshold?: [number, number]
  delta_threshold?: number
}

export const tasksApi = {
  list: () => client.get<Task[]>('/tasks'),
  get: (id: string) => client.get<TaskDetail>(`/tasks/${id}`),
  create: (file: File, params?: TaskCreateParams) => {
    const formData = new FormData()
    formData.append('file', file)
    if (params) {
      formData.append('params', JSON.stringify(params))
    }
    return client.post<Task>('/tasks', formData)
  },
  download: (id: string) => client.get(`/tasks/${id}/download`, { responseType: 'blob' }),
  delete: (id: string) => client.delete(`/tasks/${id}`),
}
