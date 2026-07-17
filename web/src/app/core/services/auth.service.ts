// budget: 400 lines
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface LoginResponse {
  user: RawUser;
  token: string;
}

// The NestJS backend returns roles lowercased ('admin' | 'user'); the frontend
// model uses uppercase. Everything else maps one-to-one.
interface RawUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

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
  ) {
    // Re-hydrate the session from the backend when a token is already present
    // so role/name stay authoritative across reloads.
    if (this._token()) {
      this.hydrate();
    }
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private normalize(raw: RawUser): User {
    return {
      id: raw.id,
      name: raw.name,
      email: raw.email,
      role: (raw.role || '').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
    };
  }

  private persist(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    // Legacy keys kept for any component reading them directly.
    localStorage.setItem('token', token);
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
    this._token.set(token);
    this._user.set(user);
  }

  private setSession(res: LoginResponse): User {
    const user = this.normalize(res.user);
    this.persist(res.token, user);
    return user;
  }

  // Real login against POST /api/v1/auth/login. On success persists the JWT and
  // navigates to /today. Emits the authenticated user; errors surface to caller.
  login(email: string, password: string): Observable<User> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        map((res) => this.setSession(res)),
        tap(() => this.router.navigate(['/today'])),
      );
  }

  // Self-signup via POST /api/v1/auth/signup — always creates a USER role.
  signup(name: string, email: string, password: string): Observable<User> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/signup`, { name, email, password })
      .pipe(
        map((res) => this.setSession(res)),
        tap(() => this.router.navigate(['/today'])),
      );
  }

  // Demo Mode — logs in with the seeded admin account. The seed derives the
  // password deterministically as sha256(email + SEED_SECRET).slice(0,16).
  demoLogin(): void {
    const email = 'admin@example.com';
    this.derivePassword(email)
      .then((password) => {
        this.login(email, password).subscribe({
          error: () => this.router.navigate(['/login']),
        });
      })
      .catch(() => this.router.navigate(['/login']));
  }

  private async derivePassword(email: string): Promise<string> {
    const secret = 'colossus-seed';
    const bytes = new TextEncoder().encode(email + secret);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16);
  }

  // GET /api/v1/auth/me — refresh the current user from the token.
  private hydrate(): void {
    this.http
      .get<RawUser>(`${this.apiUrl}/auth/me`)
      .pipe(
        map((raw) => this.normalize(raw)),
        catchError(() => of(null)),
      )
      .subscribe((user) => {
        if (user) {
          const token = this._token();
          if (token) this.persist(token, user);
        } else {
          this.clearSession();
        }
      });
  }

  private clearSession(): void {
    [TOKEN_KEY, USER_KEY, 'token', 'access_token', 'user', 'isAuthenticated'].forEach((k) =>
      localStorage.removeItem(k),
    );
    this._token.set(null);
    this._user.set(null);
  }

  logout(): void {
    // Best-effort stateless logout; ignore result and clear locally regardless.
    this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(catchError(() => of(null))).subscribe();
    this.clearSession();
    this.router.navigate(['/login']);
  }
}
