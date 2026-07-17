// budget: 400 lines
import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  imports: [AuthModule, PrismaModule],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
