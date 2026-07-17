// budget: 400 lines
// Live REST client for the Front Desk "Today" dashboard endpoint.
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment } from '../models';

export interface TodayDashboard {
  date: string;
  appointments: Appointment[];
  remainingCount: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/dashboard`;

  today(): Observable<TodayDashboard> {
    return this.http.get<TodayDashboard>(`${this.base}/today`);
  }
}
