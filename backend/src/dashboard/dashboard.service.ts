// budget: 400 lines
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppointmentStatus } from '@generated/prisma/client';
import { dayRange } from 'src/common/date.util';
import { appointmentInclude, shapeAppointment } from 'src/appointments/appointment.shape';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async today() {
    const now = new Date();
    const { start, end } = dayRange(now);

    const rows = await this.prisma.appointment.findMany({
      where: { startTime: { gte: start, lt: end } },
      include: appointmentInclude,
      orderBy: { startTime: 'asc' },
    });

    const appointments = rows.map(shapeAppointment);
    const remainingCount = appointments.filter(
      (a) => a.status === AppointmentStatus.booked && a.startTime >= now,
    ).length;

    return { date: start, appointments, remainingCount };
  }
}
