// budget: 400 lines
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Client } from '../../core/models';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css',
})
export class ClientsComponent {
  loading = signal(false);
  error = signal<string | null>(null);

  // Mock data — cleared by mockup_cleaner, wired to GET /api/clients.
  clients = signal<Client[]>([
    { id: 'c1', name: 'Maya Chen', phone: '(415) 555-0142', email: 'maya@example.com', notes: 'Prefers morning slots' },
    { id: 'c2', name: 'David Okafor', phone: '(415) 555-0177', email: 'david.o@example.com', notes: '' },
    { id: 'c3', name: 'Priya Nair', phone: '(628) 555-0199', email: 'priya.nair@example.com', notes: 'Allergic to almond oil' },
    { id: 'c4', name: 'Tom Alvarez', phone: '(510) 555-0163', email: '', notes: '' },
    { id: 'c5', name: 'Sara Lindqvist', phone: '(415) 555-0110', email: 'sara.l@example.com', notes: 'VIP' },
  ]);

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
    if (this.modal() === 'edit' && this.editingId()) {
      const id = this.editingId();
      this.clients.update((list) => list.map((c) => (c.id === id ? { ...c, ...value } : c)));
    } else {
      const id = 'c-' + (this.clients().length + 1);
      this.clients.update((list) => [...list, { id, ...value }]);
    }
    this.close();
  }

  remove(id: string): void {
    this.clients.update((list) => list.filter((c) => c.id !== id));
  }
}
