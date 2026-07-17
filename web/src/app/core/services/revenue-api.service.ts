// budget: 400 lines
// Live REST client for the /revenue summary endpoint (admin only).
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RevenueSummary } from '../models';

@Injectable({ providedIn: 'root' })
export class RevenueApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/revenue`;

  summary(): Observable<RevenueSummary> {
    return this.http.get<RevenueSummary>(this.base);
  }
}
