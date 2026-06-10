import axios, { type AxiosInstance } from 'axios'
import { env } from '@/utils/env'

export const api: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { Accept: 'application/json' },
})

let getToken: () => string | null = () => null
let onUnauthorized: () => void = () => {}

export function configureClient(opts: {
  getToken: () => string | null
  onUnauthorized: () => void
}) {
  getToken = opts.getToken
  onUnauthorized = opts.onUnauthorized
}

api.interceptors.request.use((cfg) => {
  const token = getToken()
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) onUnauthorized()
    return Promise.reject(err)
  },
)
