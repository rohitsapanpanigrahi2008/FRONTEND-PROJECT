import type { ModuleId } from './index';

/** Standard envelope every backend endpoint is expected to return. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  /** Correlation id echoed by the backend for audit trails */
  requestId?: string;
  error?: { code: string; message: string };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'operator' | 'analyst';
    facilityIds: string[];
  };
  /** Short-lived JWT; the refresh token stays in an httpOnly cookie handled by the server. */
  accessToken: string;
  expiresInSec: number;
}

export type ModuleQuery = { moduleId: ModuleId; from?: string; to?: string; zone?: string };
