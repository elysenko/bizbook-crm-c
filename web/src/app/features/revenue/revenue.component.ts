// budget: 400 lines
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment, RevenueSummary } from '../../core/models';
import { RevenueApi } from '../../core/services/revenue-api.service';
import { AppointmentsApi } from '../../core/services/appointments-api.service';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue.component.html',
  styleUrl: './revenue.component.css',
})
export class RevenueComponent implements OnInit {
  private readonly revenueApi = inject(RevenueApi);
  private readonly appointmentsApi = inject(AppointmentsApi);

  loading = signal(false);
  error = signal<string | null>(null);

  // Live totals from GET /api/v1/revenue.
  summary = signal<RevenueSummary | null>(null);

  // Completed appointments from GET /api/v1/appointments?status=completed.
  completed = signal<Appointment[]>([]);

  ngOnInit(): void {
    this.loading.set(true);
    this.revenueApi.summary().subscribe({
      next: (s) => {
        this.summary.set(s);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load revenue.');
        this.loading.set(false);
      },
    });
    this.appointmentsApi.list({ status: 'completed' }).subscribe({
      next: (list) => this.completed.set(list),
      error: () => this.completed.set([]),
    });
  }

  date(iso: string): string {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
