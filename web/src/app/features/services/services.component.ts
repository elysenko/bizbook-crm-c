// budget: 400 lines
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Service } from '../../core/models';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
})
export class ServicesComponent {
  loading = signal(false);
  error = signal<string | null>(null);

  // Mock data — cleared by mockup_cleaner, wired to GET /api/services.
  services = signal<Service[]>([
    { id: 's1', name: 'Haircut & Style', durationMinutes: 45, price: 45 },
    { id: 's2', name: 'Beard Trim', durationMinutes: 20, price: 20 },
    { id: 's3', name: 'Color & Highlights', durationMinutes: 120, price: 120 },
    { id: 's4', name: 'Manicure', durationMinutes: 40, price: 35 },
    { id: 's5', name: 'Deep Conditioning', durationMinutes: 30, price: 28 },
  ]);

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
    if (this.modal() === 'edit' && this.editingId()) {
      const id = this.editingId();
      this.services.update((list) => list.map((s) => (s.id === id ? { ...s, ...value } : s)));
    } else {
      const id = 's-' + (this.services().length + 1);
      this.services.update((list) => [...list, { id, ...value }]);
    }
    this.close();
  }

  remove(id: string): void {
    this.services.update((list) => list.filter((s) => s.id !== id));
  }
}
