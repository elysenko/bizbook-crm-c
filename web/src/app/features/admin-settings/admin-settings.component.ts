// budget: 400 lines
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSetting } from '../../core/models';
import { AdminSettingsApi } from '../../core/services/admin-settings-api.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
})
export class AdminSettingsComponent implements OnInit {
  private readonly api = inject(AdminSettingsApi);

  loading = signal(false);
  error = signal<string | null>(null);
  savedKey = signal<string | null>(null);

  // Live data from GET /api/v1/admin/settings.
  settings = signal<AdminSetting[]>([]);

  // Local edit buffer keyed by field key.
  values: Record<string, string> = {};

  readonly unconfigured = computed(() => this.settings().filter((s) => !s.configured));

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (list) => {
        this.settings.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load settings.');
        this.loading.set(false);
      },
    });
  }

  save(key: string): void {
    const setting = this.settings().find((s) => s.key === key);
    if (!setting) return;

    const payload: Record<string, string> = {};
    for (const field of setting.fields) {
      const value = this.values[field.key];
      if (value) payload[field.key] = value;
    }

    this.error.set(null);
    this.api.save(key, payload).subscribe({
      next: (updated) => {
        this.settings.update((list) => list.map((s) => (s.key === key ? updated : s)));
        this.savedKey.set(key);
      },
      error: (err) => this.error.set(err?.error?.message || 'Failed to save credentials.'),
    });
  }
}
