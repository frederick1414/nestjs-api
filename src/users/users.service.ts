import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { hash } from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserRole } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  async findAll() {
    const users = await this.em.find(User, {}, { orderBy: { id: 'asc' } });
    return users.map((user) => this.toPublicUser(user));
  }

  async findOne(id: number) {
    const user = await this.getUserByIdOrThrow(id);
    return this.toPublicUser(user);
  }

  async create(user: CreateUserDto) {
    await this.ensureEmailIsAvailable(user.email);

    const newUser = this.em.create(User, {
      name: user.name,
      email: user.email,
      passwordHash: await hash(user.password, 10),
      role: UserRole.USER,
    });

    try {
      this.em.persist(newUser);
      await this.em.flush();
      return this.toPublicUser(newUser);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async update(id: number, data: UpdateUserDto) {
    if (Object.values(data).every((value) => value === undefined)) {
      throw new BadRequestException('At least one field must be provided');
    }

    const user = await this.getUserByIdOrThrow(id);

    if (data.email !== undefined) {
      await this.ensureEmailIsAvailable(data.email, id);
      user.email = data.email;
    }

    if (data.name !== undefined) {
      user.name = data.name;
    }

    if (data.password !== undefined) {
      user.passwordHash = await hash(data.password, 10);
    }

    try {
      await this.em.flush();
      return this.toPublicUser(user);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async delete(id: number) {
    const user = await this.getUserByIdOrThrow(id);

    this.em.remove(user);
    await this.em.flush();

    return {
      message: 'User deleted successfully',
      user: this.toPublicUser(user),
    };
  }

  private async getUserByIdOrThrow(id: number) {
    const user = await this.em.findOne(User, { id });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  private async ensureEmailIsAvailable(email: string, excludedId?: number) {
    const userWithEmail = await this.em.findOne(User, { email });

    if (userWithEmail && userWithEmail.id !== excludedId) {
      throw new ConflictException(`User with email ${email} already exists`);
    }
  }

  private handlePersistenceError(error: unknown): never {
    if (error instanceof ConflictException) {
      throw error;
    }

    throw new InternalServerErrorException('Unable to persist user changes');
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    } as const;
  }
}
