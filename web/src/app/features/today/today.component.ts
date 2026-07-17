// budget: 400 lines
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../core/models';

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './today.component.html',
  styleUrl: './today.component.css',
})
export class TodayComponent {
  loading = signal(false);
  error = signal<string | null>(null);

  // Mock data — cleared by mockup_cleaner, wired to GET /api/dashboard/today.
  appointments = signal<Appointment[]>([
    { id: 'a1', clientId: 'c1', serviceId: 's1', clientName: 'Maya Chen', serviceName: 'Haircut & Style', startTime: '2026-07-17T09:30:00', status: 'completed', price: 45 },
    { id: 'a2', clientId: 'c2', serviceId: 's2', clientName: 'David Okafor', serviceName: 'Beard Trim', startTime: '2026-07-17T10:15:00', status: 'completed', price: 20 },
    { id: 'a3', clientId: 'c3', serviceId: 's3', clientName: 'Priya Nair', serviceName: 'Color & Highlights', startTime: '2026-07-17T13:00:00', status: 'booked', price: 120 },
    { id: 'a4', clientId: 'c4', serviceId: 's1', clientName: 'Tom Alvarez', serviceName: 'Haircut & Style', startTime: '2026-07-17T15:30:00', status: 'booked', price: 45 },
    { id: 'a5', clientId: 'c5', serviceId: 's4', clientName: 'Sara Lindqvist', serviceName: 'Manicure', startTime: '2026-07-17T16:45:00', status: 'booked', price: 35 },
  ]);

  readonly sorted = computed(() =>
    [...this.appointments()].sort((a, b) => a.startTime.localeCompare(b.startTime)),
  );

  readonly remainingCount = computed(
    () => this.appointments().filter((a) => a.status === 'booked').length,
  );

  time(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
}
