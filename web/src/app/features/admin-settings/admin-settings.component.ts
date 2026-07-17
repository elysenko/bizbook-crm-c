// budget: 400 lines
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSetting } from '../../core/models';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
})
export class AdminSettingsComponent {
  loading = signal(false);
  error = signal<string | null>(null);
  savedKey = signal<string | null>(null);

  // Mock data — cleared by mockup_cleaner, wired to GET /api/admin/settings.
  settings = signal<AdminSetting[]>([
    {
      key: 'postgresql',
      label: 'PostgreSQL Database',
      configured: false,
      maskedValue: '',
      fields: [
        { key: 'DATABASE_URL', label: 'Connection URL', placeholder: 'postgresql://user:pass@host:5432/db' },
      ],
    },
    {
      key: 'minio',
      label: 'MinIO Object Storage',
      configured: false,
      maskedValue: '',
      fields: [
        { key: 'MINIO_ENDPOINT', label: 'Endpoint', placeholder: 'https://minio.example.com' },
        { key: 'MINIO_ACCESS_KEY', label: 'Access key', placeholder: 'AKIA…' },
        { key: 'MINIO_SECRET_KEY', label: 'Secret key', placeholder: '••••••••' },
      ],
    },
  ]);

  // Local edit buffer keyed by field key.
  values: Record<string, string> = {};

  readonly unconfigured = computed(() => this.settings().filter((s) => !s.configured));

  save(key: string): void {
    this.settings.update((list) =>
      list.map((s) =>
        s.key === key ? { ...s, configured: true, maskedValue: '•••• configured' } : s,
      ),
    );
    this.savedKey.set(key);
  }
}
