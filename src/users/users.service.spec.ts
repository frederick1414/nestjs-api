import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: {
    user: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll should return the seeded users', async () => {
    prismaService.user.findMany.mockResolvedValue([
      { id: 1, name: 'Juan', email: 'juan@example.com', role: 'USER' },
      { id: 2, name: 'Maria', email: 'maria@example.com', role: 'USER' },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      { id: 1, name: 'Juan', email: 'juan@example.com', role: 'USER' },
      { id: 2, name: 'Maria', email: 'maria@example.com', role: 'USER' },
    ]);
  });

  it('findOne should return a user when it exists', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 1,
      name: 'Juan',
      email: 'juan@example.com',
      role: 'USER',
    });

    await expect(service.findOne(1)).resolves.toEqual({
      id: 1,
      name: 'Juan',
      email: 'juan@example.com',
      role: 'USER',
    });
  });

  it('findOne should throw NotFoundException when the user does not exist', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('create should persist and return the created user', async () => {
    prismaService.user.create.mockResolvedValue({
      id: 3,
      name: 'Pedro',
      email: 'pedro@example.com',
      role: 'USER',
    });

    await expect(
      service.create({
        name: 'Pedro',
        email: 'pedro@example.com',
        password: 'Password123',
      }),
    ).resolves.toEqual({
      id: 3,
      name: 'Pedro',
      email: 'pedro@example.com',
      role: 'USER',
    });
  });

  it('create should reject duplicated emails', async () => {
    prismaService.user.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['email'] },
    });

    await expect(
      service.create({
        name: 'Juan',
        email: 'juan@example.com',
        password: 'Password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('update should modify an existing user', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 1,
      name: 'Juan',
      email: 'juan@example.com',
      role: 'USER',
    });
    prismaService.user.update.mockResolvedValue({
      id: 1,
      name: 'Juan Carlos',
      email: 'juan.carlos@example.com',
      role: 'USER',
    });

    await expect(
      service.update(1, {
        name: 'Juan Carlos',
        email: 'juan.carlos@example.com',
      }),
    ).resolves.toEqual({
      id: 1,
      name: 'Juan Carlos',
      email: 'juan.carlos@example.com',
      role: 'USER',
    });
  });

  it('update should reject an empty payload', async () => {
    await expect(service.update(1, {})).rejects.toThrow(BadRequestException);
  });

  it('update should reject duplicated emails', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 1,
      name: 'Juan',
      email: 'juan@example.com',
      role: 'USER',
    });
    prismaService.user.update.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['email'] },
    });

    await expect(
      service.update(1, { email: 'maria@example.com' }),
    ).rejects.toThrow(ConflictException);
  });

  it('delete should remove an existing user', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 2,
      name: 'Maria',
      email: 'maria@example.com',
      role: 'USER',
    });
    prismaService.user.delete.mockResolvedValue({
      id: 2,
      name: 'Maria',
      email: 'maria@example.com',
      role: 'USER',
    });

    await expect(service.delete(2)).resolves.toEqual({
      message: 'User deleted successfully',
      user: {
        id: 2,
        name: 'Maria',
        email: 'maria@example.com',
        role: 'USER',
      },
    });
  });
});
