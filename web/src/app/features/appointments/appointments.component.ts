// budget: 400 lines
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalComponent } from '../../shared/modal/modal.component';
import { AuthService } from '../../core/services/auth.service';
import { Appointment, AppointmentStatus, Client, Service } from '../../core/models';

type StatusFilter = 'all' | AppointmentStatus;

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.css',
})
export class AppointmentsComponent {
  loading = signal(false);
  error = signal<string | null>(null);

  statusFilters: StatusFilter[] = ['all', 'booked', 'completed', 'cancelled'];
  activeStatus = signal<StatusFilter>('all');
  dateFilter = signal<string>('');
  bookOpen = signal(false);

  // Mock data — cleared by mockup_cleaner, wired to GET /api/appointments.
  appointments = signal<Appointment[]>([
    { id: 'a1', clientId: 'c1', serviceId: 's1', clientName: 'Maya Chen', serviceName: 'Haircut & Style', startTime: '2026-07-17T09:30:00', status: 'completed', price: 45 },
    { id: 'a2', clientId: 'c2', serviceId: 's2', clientName: 'David Okafor', serviceName: 'Beard Trim', startTime: '2026-07-17T10:15:00', status: 'completed', price: 20 },
    { id: 'a3', clientId: 'c3', serviceId: 's3', clientName: 'Priya Nair', serviceName: 'Color & Highlights', startTime: '2026-07-17T13:00:00', status: 'booked', price: 120 },
    { id: 'a4', clientId: 'c4', serviceId: 's1', clientName: 'Tom Alvarez', serviceName: 'Haircut & Style', startTime: '2026-07-18T15:30:00', status: 'booked', price: 45 },
    { id: 'a5', clientId: 'c5', serviceId: 's4', clientName: 'Sara Lindqvist', serviceName: 'Manicure', startTime: '2026-07-16T16:45:00', status: 'cancelled', price: 35 },
  ]);

  // Options for the booking form selects.
  clients = signal<Client[]>([
    { id: 'c1', name: 'Maya Chen', phone: '' },
    { id: 'c2', name: 'David Okafor', phone: '' },
    { id: 'c3', name: 'Priya Nair', phone: '' },
    { id: 'c4', name: 'Tom Alvarez', phone: '' },
    { id: 'c5', name: 'Sara Lindqvist', phone: '' },
  ]);
  services = signal<Service[]>([
    { id: 's1', name: 'Haircut & Style', durationMinutes: 45, price: 45 },
    { id: 's2', name: 'Beard Trim', durationMinutes: 20, price: 20 },
    { id: 's3', name: 'Color & Highlights', durationMinutes: 120, price: 120 },
    { id: 's4', name: 'Manicure', durationMinutes: 40, price: 35 },
  ]);

  form: FormGroup;

  readonly filtered = computed(() => {
    const status = this.activeStatus();
    const date = this.dateFilter();
    return this.appointments()
      .filter((a) => (status === 'all' ? true : a.status === status))
      .filter((a) => (date ? a.startTime.startsWith(date) : true))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public auth: AuthService,
  ) {
    this.form = this.fb.group({
      clientId: ['', [Validators.required]],
      serviceId: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const status = (params.get('status') as StatusFilter) || 'all';
      this.activeStatus.set(this.statusFilters.includes(status) ? status : 'all');
      this.dateFilter.set(params.get('date') || '');
      this.bookOpen.set(params.get('modal') === 'book');
    });
  }

  setStatus(status: StatusFilter): void {
    this.router.navigate([], {
      queryParams: { status: status === 'all' ? null : status },
      queryParamsHandling: 'merge',
    });
  }

  onDateChange(value: string): void {
    this.router.navigate([], {
      queryParams: { date: value || null },
      queryParamsHandling: 'merge',
    });
  }

  openBook(): void {
    this.form.reset({ clientId: '', serviceId: '', startTime: '' });
    this.router.navigate([], { queryParams: { modal: 'book' }, queryParamsHandling: 'merge' });
  }

  closeBook(): void {
    this.router.navigate([], { queryParams: { modal: null }, queryParamsHandling: 'merge' });
  }

  book(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { clientId, serviceId, startTime } = this.form.value;
    const client = this.clients().find((c) => c.id === clientId);
    const service = this.services().find((s) => s.id === serviceId);
    const appt: Appointment = {
      id: 'a-' + (this.appointments().length + 1),
      clientId,
      serviceId,
      clientName: client?.name ?? 'Unknown',
      serviceName: service?.name ?? 'Unknown',
      startTime,
      status: 'booked',
      price: service?.price ?? 0,
    };
    this.appointments.update((list) => [...list, appt]);
    this.closeBook();
  }

  setStatusOf(id: string, status: AppointmentStatus): void {
    this.appointments.update((list) =>
      list.map((a) => (a.id === id ? { ...a, status } : a)),
    );
  }

  when(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
}
