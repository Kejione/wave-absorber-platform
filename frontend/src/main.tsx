import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AuthProvider } from '@/stores/auth'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConfigProvider>
  </BrowserRouter>,
)
