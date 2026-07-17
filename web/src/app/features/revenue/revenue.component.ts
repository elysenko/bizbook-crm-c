// budget: 400 lines
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment, RevenueSummary } from '../../core/models';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue.component.html',
  styleUrl: './revenue.component.css',
})
export class RevenueComponent {
  loading = signal(false);
  error = signal<string | null>(null);

  // Mock summary — wired to GET /api/revenue.
  summary = signal<RevenueSummary | null>({ week: 385, month: 1620 });

  // Completed appointments contributing to the totals — wired to GET /api/appointments?status=completed.
  completed = signal<Appointment[]>([
    { id: 'a1', clientId: 'c1', serviceId: 's1', clientName: 'Maya Chen', serviceName: 'Haircut & Style', startTime: '2026-07-17T09:30:00', status: 'completed', price: 45 },
    { id: 'a2', clientId: 'c2', serviceId: 's2', clientName: 'David Okafor', serviceName: 'Beard Trim', startTime: '2026-07-17T10:15:00', status: 'completed', price: 20 },
    { id: 'a6', clientId: 'c3', serviceId: 's3', clientName: 'Priya Nair', serviceName: 'Color & Highlights', startTime: '2026-07-15T11:00:00', status: 'completed', price: 120 },
    { id: 'a7', clientId: 'c5', serviceId: 's4', clientName: 'Sara Lindqvist', serviceName: 'Manicure', startTime: '2026-07-14T14:20:00', status: 'completed', price: 35 },
  ]);

  date(iso: string): string {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
