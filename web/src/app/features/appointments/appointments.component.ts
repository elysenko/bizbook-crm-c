// budget: 400 lines
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { ModalComponent } from '../../shared/modal/modal.component';
import { AuthService } from '../../core/services/auth.service';
import { Appointment, AppointmentStatus, Client, Service } from '../../core/models';
import { AppointmentsApi } from '../../core/services/appointments-api.service';
import { ClientsApi } from '../../core/services/clients-api.service';
import { ServicesApi } from '../../core/services/services-api.service';

type StatusFilter = 'all' | AppointmentStatus;

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.css',
})
export class AppointmentsComponent implements OnInit {
  private readonly appointmentsApi = inject(AppointmentsApi);
  private readonly clientsApi = inject(ClientsApi);
  private readonly servicesApi = inject(ServicesApi);

  loading = signal(false);
  error = signal<string | null>(null);

  statusFilters: StatusFilter[] = ['all', 'booked', 'completed', 'cancelled'];
  activeStatus = signal<StatusFilter>('all');
  dateFilter = signal<string>('');
  bookOpen = signal(false);

  // Live data from GET /api/v1/appointments.
  appointments = signal<Appointment[]>([]);

  // Booking form select options (GET /api/v1/clients, /api/v1/services).
  clients = signal<Client[]>([]);
  services = signal<Service[]>([]);

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

  ngOnInit(): void {
    this.loadAppointments();
    // Booking selects need clients + services. These list endpoints are
    // admin-only; for non-admin users they 403, so fail soft to empty lists.
    this.clientsApi
      .list()
      .pipe(catchError(() => of([] as Client[])))
      .subscribe((list) => this.clients.set(list));
    this.servicesApi
      .list()
      .pipe(catchError(() => of([] as Service[])))
      .subscribe((list) => this.services.set(list));
  }

  private loadAppointments(): void {
    this.loading.set(true);
    this.appointmentsApi.list().subscribe({
      next: (list) => {
        this.appointments.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load appointments.');
        this.loading.set(false);
      },
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
    this.appointmentsApi.create({ clientId, serviceId, startTime }).subscribe({
      next: (appt) => {
        this.appointments.update((list) => [...list, appt]);
        this.closeBook();
      },
      error: (err) => this.error.set(err?.error?.message || 'Failed to book appointment.'),
    });
  }

  setStatusOf(id: string, status: AppointmentStatus): void {
    this.appointmentsApi.updateStatus(id, status).subscribe({
      next: (updated) =>
        this.appointments.update((list) => list.map((a) => (a.id === id ? updated : a))),
      error: (err) => this.error.set(err?.error?.message || 'Failed to update appointment.'),
    });
  }

  when(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
}
