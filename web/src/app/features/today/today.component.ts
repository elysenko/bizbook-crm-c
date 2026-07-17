// budget: 400 lines
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../core/models';
import { DashboardApi } from '../../core/services/dashboard-api.service';

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './today.component.html',
  styleUrl: './today.component.css',
})
export class TodayComponent implements OnInit {
  private readonly dashboardApi = inject(DashboardApi);

  loading = signal(false);
  error = signal<string | null>(null);

  // Live data from GET /api/v1/dashboard/today.
  appointments = signal<Appointment[]>([]);
  private _remaining = signal(0);

  readonly sorted = computed(() =>
    [...this.appointments()].sort((a, b) => a.startTime.localeCompare(b.startTime)),
  );

  readonly remainingCount = computed(() => this._remaining());

  ngOnInit(): void {
    this.loading.set(true);
    this.dashboardApi.today().subscribe({
      next: (res) => {
        this.appointments.set(res.appointments);
        this._remaining.set(res.remainingCount);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load today’s schedule.');
        this.loading.set(false);
      },
    });
  }

  time(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
}
