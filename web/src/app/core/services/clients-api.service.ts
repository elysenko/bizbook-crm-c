// budget: 400 lines
// Live REST client for the /clients resource on the NestJS backend.
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Client } from '../models';

export type ClientInput = Omit<Client, 'id' | 'createdAt'>;

@Injectable({ providedIn: 'root' })
export class ClientsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/clients`;

  list(): Observable<Client[]> {
    return this.http.get<Client[]>(this.base);
  }

  create(input: ClientInput): Observable<Client> {
    return this.http.post<Client>(this.base, this.clean(input));
  }

  update(id: string, input: ClientInput): Observable<Client> {
    return this.http.patch<Client>(`${this.base}/${id}`, this.clean(input));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // The backend validates email format and rejects unexpected/empty fields,
  // so drop optional values that are blank rather than sending "".
  private clean(input: ClientInput): Record<string, unknown> {
    const email = input.email?.trim();
    const notes = input.notes?.trim();
    return {
      name: input.name,
      phone: input.phone,
      ...(email ? { email } : {}),
      ...(notes ? { notes } : {}),
    };
  }
}
