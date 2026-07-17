// budget: 400 lines
import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService],
  imports: [AuthModule, PrismaModule],
  exports: [ClientsService],
})
export class ClientsModule {}
