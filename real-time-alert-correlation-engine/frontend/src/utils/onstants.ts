// frontend/src/utils/constants.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
  TIMEOUT: 30000,
} as const;

export const ROLES = {
  OFFICER: 'OFFICER',
  SUPERVISOR: 'SUPERVISOR',
  ADMIN: 'ADMIN',
} as const;