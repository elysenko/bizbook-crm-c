// budget: 400 lines
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Client } from '../../core/models';
import { ClientsApi } from '../../core/services/clients-api.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css',
})
export class ClientsComponent implements OnInit {
  private readonly clientsApi = inject(ClientsApi);

  loading = signal(false);
  error = signal<string | null>(null);

  // Live data from GET /api/v1/clients.
  clients = signal<Client[]>([]);

  modal = signal<'new' | 'edit' | null>(null);
  editingId = signal<string | null>(null);
  form: FormGroup;

  readonly editingName = computed(() => {
    const id = this.editingId();
    return this.clients().find((c) => c.id === id)?.name ?? '';
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      email: [''],
      notes: [''],
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const modal = params.get('modal');
      const id = params.get('id');
      if (modal === 'new') {
        this.openNew();
      } else if (modal === 'edit' && id) {
        this.openEdit(id);
      } else {
        this.modal.set(null);
        this.editingId.set(null);
      }
    });
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.clientsApi.list().subscribe({
      next: (list) => {
        this.clients.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load clients.');
        this.loading.set(false);
      },
    });
  }

  private openNew(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', phone: '', email: '', notes: '' });
    this.modal.set('new');
  }

  private openEdit(id: string): void {
    const client = this.clients().find((c) => c.id === id);
    if (!client) return;
    this.editingId.set(id);
    this.form.reset({
      name: client.name,
      phone: client.phone,
      email: client.email ?? '',
      notes: client.notes ?? '',
    });
    this.modal.set('edit');
  }

  goNew(): void {
    this.router.navigate([], { queryParams: { modal: 'new' } });
  }

  goEdit(id: string): void {
    this.router.navigate([], { queryParams: { modal: 'edit', id } });
  }

  close(): void {
    this.router.navigate([], { queryParams: {} });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value as Omit<Client, 'id'>;
    const editId = this.modal() === 'edit' ? this.editingId() : null;
    const request$ = editId
      ? this.clientsApi.update(editId, value)
      : this.clientsApi.create(value);

    request$.subscribe({
      next: () => {
        this.load();
        this.close();
      },
      error: (err) => this.error.set(err?.error?.message || 'Failed to save client.'),
    });
  }

  remove(id: string): void {
    this.clientsApi.remove(id).subscribe({
      next: () => this.clients.update((list) => list.filter((c) => c.id !== id)),
      error: (err) => this.error.set(err?.error?.message || 'Failed to delete client.'),
    });
  }
}
