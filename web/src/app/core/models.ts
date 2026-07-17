// budget: 400 lines
// Shared domain models for BizBook. These mirror the API entities so the
// service_agent can wire mock signals to real endpoints without type changes.

export type UserRole = 'ADMIN' | 'USER';
export type AppointmentStatus = 'booked' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt?: string;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  createdAt?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  clientName: string;
  serviceName: string;
  startTime: string; // ISO datetime
  status: AppointmentStatus;
  price: number;
}

export interface RevenueSummary {
  week: number;
  month: number;
}

export interface AdminSetting {
  key: string;
  label: string;
  configured: boolean;
  maskedValue: string;
  fields: { key: string; label: string; placeholder: string }[];
}
