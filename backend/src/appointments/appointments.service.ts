// budget: 400 lines
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, Prisma } from '../generated/prisma/client';
import { User } from '../user/entities/user.entity';
import { dayRangeFromString } from '../common/date.util';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { appointmentInclude, shapeAppointment } from './appointment.shape';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger('AppointmentsService');

  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryAppointmentsDto) {
    const where: Prisma.AppointmentWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.clientId) where.clientId = query.clientId;
    if (query.date) {
      const { start, end } = dayRangeFromString(query.date);
      where.startTime = { gte: start, lt: end };
    }

    const rows = await this.prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: { startTime: 'asc' },
    });
    return rows.map(shapeAppointment);
  }

  async findOne(id: string) {
    const row = await this.prisma.appointment.findUnique({
      where: { id },
      include: appointmentInclude,
    });
    if (!row) throw new NotFoundException('Appointment not found');
    return shapeAppointment(row);
  }

  async create(dto: CreateAppointmentDto, user: User) {
    const startTime = new Date(dto.startTime);
    if (Number.isNaN(startTime.getTime())) {
      throw new BadRequestException('Invalid startTime');
    }
    if (startTime.getTime() <= Date.now()) {
      throw new BadRequestException('startTime must be in the future');
    }

    const [client, service] = await Promise.all([
      this.prisma.client.findUnique({ where: { id: dto.clientId } }),
      this.prisma.service.findUnique({ where: { id: dto.serviceId } }),
    ]);
    if (!client) throw new BadRequestException('Client not found');
    if (!service) throw new BadRequestException('Service not found');

    const created = await this.prisma.appointment.create({
      data: {
        clientId: dto.clientId,
        serviceId: dto.serviceId,
        startTime,
        status: AppointmentStatus.booked,
        createdById: user.id,
      },
      include: appointmentInclude,
    });
    return shapeAppointment(created);
  }

  async updateStatus(id: string, status: AppointmentStatus, user: User) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const isAdmin = user.role === 'admin';

    if (status === AppointmentStatus.completed && !isAdmin) {
      throw new ForbiddenException('Only admins can mark an appointment completed');
    }
    if (
      status === AppointmentStatus.cancelled &&
      !isAdmin &&
      appointment.createdById !== user.id
    ) {
      throw new ForbiddenException('Only the booker or an admin can cancel this appointment');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: appointmentInclude,
    });
    return shapeAppointment(updated);
  }
}
