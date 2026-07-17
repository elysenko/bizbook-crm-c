// budget: 400 lines
// Live REST client for the /services resource on the NestJS backend.
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Service } from '../models';

export type ServiceInput = Omit<Service, 'id' | 'createdAt'>;

@Injectable({ providedIn: 'root' })
export class ServicesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/services`;

  list(): Observable<Service[]> {
    return this.http.get<Service[]>(this.base);
  }

  create(input: ServiceInput): Observable<Service> {
    return this.http.post<Service>(this.base, this.clean(input));
  }

  update(id: string, input: ServiceInput): Observable<Service> {
    return this.http.patch<Service>(`${this.base}/${id}`, this.clean(input));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  private clean(input: ServiceInput): Record<string, unknown> {
    return {
      name: input.name,
      durationMinutes: Number(input.durationMinutes),
      price: Number(input.price),
    };
  }
}
