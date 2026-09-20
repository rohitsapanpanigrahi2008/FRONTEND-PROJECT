import type { UserRole } from './index';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  facilityIds: string[];
}

export interface TokenPayload {
  sub: string;
  name?: string;
  email?: string;
  role: UserRole;
  facilityId?: string;
  exp: number;
  iat?: number;
}
