// budget: 400 lines
import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService],
  imports: [AuthModule, PrismaModule],
  exports: [ServicesService],
})
export class ServicesModule {}
