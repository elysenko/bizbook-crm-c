// budget: 400 lines
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger('ServicesService');

  constructor(private prisma: PrismaService) {}

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: dto });
  }

  findAll() {
    return this.prisma.service.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    try {
      return await this.prisma.service.update({ where: { id }, data: dto });
    } catch (error) {
      this.handleError(error, id);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.service.delete({ where: { id } });
      return { message: 'Service deleted' };
    } catch (error) {
      this.handleError(error, id);
    }
  }

  private handleError(error: unknown, id: string): never {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException(`Service ${id} not found`);
    }
    this.logger.error(`Services error: ${error}`);
    throw new InternalServerErrorException('Server error');
  }
}
