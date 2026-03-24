import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
  } as const;

  async findAll() {
    return this.prisma.user.findMany({
      select: this.userSelect,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.getUserByIdOrThrow(id);
  }

  async create(user: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          passwordHash: await hash(user.password, 10),
        },
        select: this.userSelect,
      });
    } catch (error) {
      this.handlePrismaError(error, user);
    }
  }

  async update(id: number, data: UpdateUserDto) {
    if (Object.values(data).every((value) => value === undefined)) {
      throw new BadRequestException('At least one field must be provided');
    }

    await this.getUserByIdOrThrow(id);

    const updateData = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.password !== undefined
        ? { passwordHash: await hash(data.password, 10) }
        : {}),
    };

    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: this.userSelect,
      });
    } catch (error) {
      this.handlePrismaError(error, data);
    }
  }

  async delete(id: number) {
    const user = await this.getUserByIdOrThrow(id);

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: 'User deleted successfully',
      user,
    };
  }

  private async getUserByIdOrThrow(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  private handlePrismaError(
    error: unknown,
    data?: Partial<CreateUserDto | UpdateUserDto>,
  ): never {
    const uniqueField = this.getUniqueConstraintField(error);

    if (this.isUniqueConstraintError(error) && uniqueField === null) {
      throw new ConflictException('User already exists');
    }

    if (uniqueField === 'email') {
      throw new ConflictException(
        `User with email ${data?.email} already exists`,
      );
    }

    if (uniqueField === 'name') {
      throw new ConflictException(
        `User with name ${data?.name} already exists`,
      );
    }

    throw error;
  }

  private getUniqueConstraintField(error: unknown) {
    return typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
      ? this.extractUniqueTarget(error)
      : null;
  }

  private isUniqueConstraintError(error: unknown): error is { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }

  private extractUniqueTarget(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'meta' in error &&
      typeof error.meta === 'object' &&
      error.meta !== null &&
      'target' in error.meta
    ) {
      const target = error.meta.target;

      if (Array.isArray(target) && typeof target[0] === 'string') {
        return this.normalizeUniqueTarget(target[0]);
      }

      if (typeof target === 'string') {
        return this.normalizeUniqueTarget(target);
      }
    }

    return null;
  }

  private normalizeUniqueTarget(target: string) {
    if (target.includes('email')) {
      return 'email';
    }

    if (target.includes('name')) {
      return 'name';
    }

    return target;
  }
}
