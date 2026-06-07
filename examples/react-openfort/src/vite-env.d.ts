/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENFORT_PUBLISHABLE_KEY: string;
  readonly VITE_SHIELD_PUBLISHABLE_KEY: string;
  readonly VITE_WALLET_CONNECT_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
