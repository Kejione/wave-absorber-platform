import client from './client'

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  email: string
  password: string
}

export interface User {
  id: string
  username: string
  email: string
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
}

export const authApi = {
  login: (params: LoginParams) => client.post<Token>('/auth/login', params),
  register: (params: RegisterParams) => client.post<User>('/auth/register', params),
  me: () => client.get<User>('/auth/me'),
}
