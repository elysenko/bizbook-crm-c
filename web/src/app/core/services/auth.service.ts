// budget: 400 lines
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _user = signal<User | null>(this.readStoredUser());

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly role = computed<UserRole | null>(() => this._user()?.role ?? null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private persist(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem('token', token);
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
    this._token.set(token);
    this._user.set(user);
  }

  // Mock login — accepts any credentials and signs the user in as ADMIN so the
  // full authenticated UI is reachable. Wired to POST /api/auth/login later.
  login(email: string, _password: string): void {
    const user: User = {
      id: 'u-admin',
      name: email.split('@')[0] || 'Admin',
      email,
      role: 'ADMIN',
    };
    this.persist('mock-jwt-token', user);
    this.router.navigate(['/today']);
  }

  // Mock signup — new self-signups become USER role.
  signup(name: string, email: string, _password: string): void {
    const user: User = { id: 'u-new', name, email, role: 'USER' };
    this.persist('mock-jwt-token', user);
    this.router.navigate(['/today']);
  }

  // Demo Mode bypass — seeds an admin session and jumps into the app.
  demoLogin(): void {
    const user: User = {
      id: 'u-admin',
      name: 'Demo Admin',
      email: 'admin@bizbook.test',
      role: 'ADMIN',
    };
    this.persist('mock-jwt-token', user);
    this.router.navigate(['/today']);
  }

  logout(): void {
    [TOKEN_KEY, USER_KEY, 'token', 'access_token', 'user', 'isAuthenticated'].forEach((k) =>
      localStorage.removeItem(k),
    );
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }
}
