/**
 * REST endpoint map — the single source of truth agreed with the backend team.
 * Paths are appended to `env.apiBaseUrl` by the axios instance.
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh-token',
    passwordReset: '/auth/password-reset',
  },
  facilities: {
    dashboard: (facilityId: string) => `/facilities/${facilityId}/dashboard`,
    summary: (facilityId: string) => `/facilities/${facilityId}/summary`,
    alerts: (facilityId: string) => `/facilities/${facilityId}/alerts`,
    module: (facilityId: string, moduleId: string) =>
      `/facilities/${facilityId}/modules/${moduleId}`,
    forecast: (facilityId: string, moduleId: string) =>
      `/facilities/${facilityId}/forecast/${moduleId}`,
    anomalies: (facilityId: string) => `/facilities/${facilityId}/anomalies`,
    recommendations: (facilityId: string) => `/facilities/${facilityId}/recommendations`,
    zones: (facilityId: string) => `/facilities/${facilityId}/map/zones`,
    hotspots: (facilityId: string) => `/facilities/${facilityId}/map/hotspots`,
  },
  admin: {
    users: '/admin/users',
    settings: '/admin/settings',
    auditLog: '/admin/audit-log',
  },
} as const;
