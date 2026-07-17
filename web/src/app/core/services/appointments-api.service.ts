// budget: 400 lines
// Live REST client for the /appointments resource on the NestJS backend.
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, AppointmentStatus } from '../models';

export interface AppointmentQuery {
  status?: AppointmentStatus;
  date?: string; // YYYY-MM-DD
  clientId?: string;
}

export interface BookAppointmentInput {
  clientId: string;
  serviceId: string;
  startTime: string; // any parseable datetime; normalised to ISO before send
}

@Injectable({ providedIn: 'root' })
export class AppointmentsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/appointments`;

  list(query: AppointmentQuery = {}): Observable<Appointment[]> {
    let params = new HttpParams();
    if (query.status) params = params.set('status', query.status);
    if (query.date) params = params.set('date', query.date);
    if (query.clientId) params = params.set('clientId', query.clientId);
    return this.http.get<Appointment[]>(this.base, { params });
  }

  create(input: BookAppointmentInput): Observable<Appointment> {
    return this.http.post<Appointment>(this.base, {
      clientId: input.clientId,
      serviceId: input.serviceId,
      startTime: new Date(input.startTime).toISOString(),
    });
  }

  updateStatus(id: string, status: AppointmentStatus): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.base}/${id}/status`, { status });
  }
}
