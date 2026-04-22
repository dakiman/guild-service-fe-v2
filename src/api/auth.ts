import { api } from './client'
import type { ApiData } from '@/types/api'
import type { AuthPayload, User } from '@/types/auth'

export async function login(email: string, password: string) {
  const res = await api.post<ApiData<AuthPayload>>('/auth/login', { email, password })
  return res.data.data
}

export async function register(payload: { name: string; email: string; password: string }) {
  const res = await api.post<ApiData<AuthPayload>>('/auth/register', payload)
  return res.data.data
}

export async function logout() {
  await api.post('/auth/logout')
}

export async function fetchMe() {
  const res = await api.get<ApiData<User>>('/auth/user')
  return res.data.data
}

export async function forgotPassword(email: string) {
  await api.post('/auth/password/forgot', { email })
}

export async function resetPassword(payload: {
  email: string
  token: string
  password: string
  password_confirmation: string
}) {
  await api.post('/auth/password/reset', payload)
}
