// budget: 400 lines
import { Module } from '@nestjs/common';
import { RevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [RevenueController],
  providers: [RevenueService],
  imports: [AuthModule, PrismaModule],
})
export class RevenueModule {}
