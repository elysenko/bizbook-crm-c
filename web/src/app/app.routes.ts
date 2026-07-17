// budget: 400 lines
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { FlowRoute } from './flow-meta';

// `data.flow` is the single source of truth for the user-flow graph AND the runtime navbar.
// DEEP-LINKABLE STATE — every navigable UI state is reachable by URL:
//   • modal / dialog → `?modal=<name>[&id=]` read on init
//   • filtered list  → filters bound to query params (`?status=`, `?date=`)
export const routes: Routes = ([
  { path: '', redirectTo: 'today', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
    data: { flow: { flowId: 'login', node: 'login', entry: true, edgesTo: ['today', 'signup'], label: 'Login' } },
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/signup/signup.component').then((m) => m.SignupComponent),
    data: { flow: { flowId: 'signup', node: 'signup', edgesTo: ['today', 'login'], label: 'Sign up' } },
  },
  {
    path: 'today',
    loadComponent: () =>
      import('./features/today/today.component').then((m) => m.TodayComponent),
    canActivate: [authGuard],
    data: { flow: { flowId: 'today', node: 'today', showInNavbar: true, label: 'Today', scope: 'all' } },
  },
  {
    path: 'appointments',
    loadComponent: () =>
      import('./features/appointments/appointments.component').then((m) => m.AppointmentsComponent),
    canActivate: [authGuard],
    data: { flow: { flowId: 'appointments', node: 'appointments', showInNavbar: true, label: 'Appointments', scope: 'all' } },
  },
  {
    path: 'clients',
    loadComponent: () =>
      import('./features/clients/clients.component').then((m) => m.ClientsComponent),
    canActivate: [adminGuard],
    data: { flow: { flowId: 'clients', node: 'clients', showInNavbar: true, label: 'Clients', scope: 'admin' } },
  },
  {
    path: 'services',
    loadComponent: () =>
      import('./features/services/services.component').then((m) => m.ServicesComponent),
    canActivate: [adminGuard],
    data: { flow: { flowId: 'services', node: 'services', showInNavbar: true, label: 'Services', scope: 'admin' } },
  },
  {
    path: 'revenue',
    loadComponent: () =>
      import('./features/revenue/revenue.component').then((m) => m.RevenueComponent),
    canActivate: [adminGuard],
    data: { flow: { flowId: 'revenue', node: 'revenue', showInNavbar: true, label: 'Revenue', scope: 'admin' } },
  },
  {
    path: 'admin/settings',
    loadComponent: () =>
      import('./features/admin-settings/admin-settings.component').then((m) => m.AdminSettingsComponent),
    canActivate: [adminGuard],
    data: { flow: { flowId: 'admin-settings', node: 'admin-settings', showInNavbar: true, label: 'Settings', scope: 'admin' } },
  },
  { path: '**', redirectTo: 'today' },
] satisfies FlowRoute[]) as Routes;
