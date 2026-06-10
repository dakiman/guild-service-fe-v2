/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_BLIZZARD_CLIENT_ID: string
  readonly VITE_BLIZZARD_REDIRECT_URI: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
