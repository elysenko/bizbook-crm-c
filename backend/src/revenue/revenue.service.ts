// budget: 400 lines
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppointmentStatus } from '@generated/prisma/client';
import { monthRange, weekRange, DateRange } from 'src/common/date.util';

@Injectable()
export class RevenueService {
  constructor(private prisma: PrismaService) {}

  async summary() {
    const now = new Date();
    const [week, month] = await Promise.all([
      this.sumCompleted(weekRange(now)),
      this.sumCompleted(monthRange(now)),
    ]);
    return { week, month };
  }

  private async sumCompleted({ start, end }: DateRange): Promise<number> {
    const rows = await this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.completed,
        startTime: { gte: start, lt: end },
      },
      select: { service: { select: { price: true } } },
    });
    return rows.reduce((total, r) => total + (r.service?.price ?? 0), 0);
  }
}
