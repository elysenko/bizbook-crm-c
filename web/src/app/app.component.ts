// budget: 400 lines
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  host: { 'data-testid': 'app-ready' },
})
export class AppComponent {
  private currentUrl = signal<string>('/');
  drawerOpen = signal<boolean>(false);

  readonly allNav: NavItem[] = [
    { path: '/today', label: 'Today', icon: '📅', adminOnly: false },
    { path: '/appointments', label: 'Appointments', icon: '🗓️', adminOnly: false },
    { path: '/clients', label: 'Clients', icon: '👥', adminOnly: true },
    { path: '/services', label: 'Services', icon: '✂️', adminOnly: true },
    { path: '/revenue', label: 'Revenue', icon: '💰', adminOnly: true },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️', adminOnly: true },
  ];

  // Chrome (nav shell) is hidden on the public auth screens.
  readonly showChrome = computed(() => {
    if (!this.auth.isLoggedIn()) return false;
    const url = this.currentUrl();
    return !url.startsWith('/login') && !url.startsWith('/signup');
  });

  readonly navItems = computed(() =>
    this.allNav.filter((n) => !n.adminOnly || this.auth.isAdmin()),
  );

  // Bottom tab bar shows up to the 5 most important destinations on mobile.
  readonly tabItems = computed(() => this.navItems().slice(0, 5));

  constructor(
    public auth: AuthService,
    private router: Router,
  ) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects);
        this.drawerOpen.set(false);
      });
  }

  toggleDrawer(): void {
    this.drawerOpen.update((v) => !v);
  }

  logout(): void {
    this.auth.logout();
  }
}
