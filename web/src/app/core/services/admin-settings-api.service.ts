// budget: 400 lines
// Live REST client for the /admin/settings resource on the NestJS backend.
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminSetting } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminSettingsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/settings`;

  list(): Observable<AdminSetting[]> {
    return this.http.get<AdminSetting[]>(this.base);
  }

  save(key: string, values: Record<string, string>): Observable<AdminSetting> {
    return this.http.put<AdminSetting>(`${this.base}/${key}`, { values });
  }
}
