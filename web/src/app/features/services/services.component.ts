// budget: 400 lines
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Service } from '../../core/models';
import { ServicesApi } from '../../core/services/services-api.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
})
export class ServicesComponent implements OnInit {
  private readonly servicesApi = inject(ServicesApi);

  loading = signal(false);
  error = signal<string | null>(null);

  // Live data from GET /api/v1/services.
  services = signal<Service[]>([]);

  modal = signal<'new' | 'edit' | null>(null);
  editingId = signal<string | null>(null);
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      durationMinutes: [30, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]],
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const modal = params.get('modal');
      const id = params.get('id');
      if (modal === 'new') {
        this.editingId.set(null);
        this.form.reset({ name: '', durationMinutes: 30, price: 0 });
        this.modal.set('new');
      } else if (modal === 'edit' && id) {
        const svc = this.services().find((s) => s.id === id);
        if (svc) {
          this.editingId.set(id);
          this.form.reset({ name: svc.name, durationMinutes: svc.durationMinutes, price: svc.price });
          this.modal.set('edit');
        }
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
    this.servicesApi.list().subscribe({
      next: (list) => {
        this.services.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load services.');
        this.loading.set(false);
      },
    });
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
    const value = this.form.value as Omit<Service, 'id'>;
    const editId = this.modal() === 'edit' ? this.editingId() : null;
    const request$ = editId
      ? this.servicesApi.update(editId, value)
      : this.servicesApi.create(value);

    request$.subscribe({
      next: () => {
        this.load();
        this.close();
      },
      error: (err) => this.error.set(err?.error?.message || 'Failed to save service.'),
    });
  }

  remove(id: string): void {
    this.servicesApi.remove(id).subscribe({
      next: () => this.services.update((list) => list.filter((s) => s.id !== id)),
      error: (err) => this.error.set(err?.error?.message || 'Failed to delete service.'),
    });
  }
}
