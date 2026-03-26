import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let entityManager: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    persist: jest.Mock;
    flush: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    entityManager = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: EntityManager,
          useValue: entityManager,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll should return the seeded users', async () => {
    entityManager.find.mockResolvedValue([
      { id: 1, name: 'Juan', email: 'juan@example.com', role: 'USER' },
      { id: 2, name: 'Maria', email: 'maria@example.com', role: 'USER' },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      { id: 1, name: 'Juan', email: 'juan@example.com', role: 'USER' },
      { id: 2, name: 'Maria', email: 'maria@example.com', role: 'USER' },
    ]);
  });

  it('findOne should return a user when it exists', async () => {
    entityManager.findOne.mockResolvedValue({
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
    entityManager.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('create should persist and return the created user', async () => {
    const createdUser = {
      id: 3,
      name: 'Pedro',
      email: 'pedro@example.com',
      role: 'USER',
      passwordHash: 'hashed',
    };
    entityManager.findOne.mockResolvedValue(null);
    entityManager.create.mockReturnValue(createdUser);
    entityManager.persist.mockReturnValue(undefined);
    entityManager.flush.mockResolvedValue(undefined);

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
    entityManager.findOne.mockResolvedValue({
      id: 1,
      email: 'juan@example.com',
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
    const existingUser = {
      id: 1,
      name: 'Juan',
      email: 'juan@example.com',
      role: 'USER',
      passwordHash: 'hashed',
    };
    entityManager.findOne
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce(null);
    entityManager.flush.mockResolvedValue(undefined);

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
    entityManager.findOne
      .mockResolvedValueOnce({
        id: 1,
        name: 'Juan',
        email: 'juan@example.com',
        role: 'USER',
        passwordHash: 'hashed',
      })
      .mockResolvedValueOnce({
        id: 2,
        name: 'Maria',
        email: 'maria@example.com',
        role: 'USER',
      });

    await expect(
      service.update(1, { email: 'maria@example.com' }),
    ).rejects.toThrow(ConflictException);
  });

  it('delete should remove an existing user', async () => {
    entityManager.findOne.mockResolvedValue({
      id: 2,
      name: 'Maria',
      email: 'maria@example.com',
      role: 'USER',
      passwordHash: 'hashed',
    });
    entityManager.remove.mockReturnValue(undefined);
    entityManager.flush.mockResolvedValue(undefined);

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
