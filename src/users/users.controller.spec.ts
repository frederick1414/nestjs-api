import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should call usersService.findAll', async () => {
    const users = [
      { id: 1, name: 'Juan', email: 'juan@example.com', role: 'USER' },
    ];
    usersService.findAll.mockResolvedValue(users);

    await expect(controller.findAll()).resolves.toEqual(users);
    expect(usersService.findAll).toHaveBeenCalledTimes(1);
  });

  it('findAllAlias should call usersService.findAll', async () => {
    const users = [
      { id: 2, name: 'Maria', email: 'maria@example.com', role: 'USER' },
    ];
    usersService.findAll.mockResolvedValue(users);

    await expect(controller.findAllAlias()).resolves.toEqual(users);
    expect(usersService.findAll).toHaveBeenCalledTimes(1);
  });

  it('findOne should call usersService.findOne with the provided id', async () => {
    const user = {
      id: 1,
      name: 'Juan',
      email: 'juan@example.com',
      role: 'USER',
    };
    usersService.findOne.mockResolvedValue(user);

    await expect(controller.findOne(1)).resolves.toEqual(user);
    expect(usersService.findOne).toHaveBeenCalledWith(1);
  });

  it('create should call usersService.create', async () => {
    const body: CreateUserDto = {
      name: 'Pedro',
      email: 'pedro@example.com',
      password: 'Password123',
    };
    const createdUser = {
      id: 3,
      name: 'Pedro',
      email: 'pedro@example.com',
      role: 'USER',
    };
    usersService.create.mockResolvedValue(createdUser);

    await expect(controller.create(body)).resolves.toEqual(createdUser);
    expect(usersService.create).toHaveBeenCalledWith(body);
  });

  it('update should call usersService.update', async () => {
    const body: UpdateUserDto = {
      name: 'Pedro actualizado',
      email: 'pedro.actualizado@example.com',
    };
    const updatedUser = {
      id: 1,
      name: 'Pedro actualizado',
      email: 'pedro.actualizado@example.com',
      role: 'USER',
    };
    usersService.update.mockResolvedValue(updatedUser);

    await expect(controller.update(1, body)).resolves.toEqual(updatedUser);
    expect(usersService.update).toHaveBeenCalledWith(1, body);
  });

  it('remove should call usersService.delete', async () => {
    const deletedResponse = {
      message: 'User deleted successfully',
      user: { id: 2, name: 'Maria', email: 'maria@example.com', role: 'USER' },
    };
    usersService.delete.mockResolvedValue(deletedResponse);

    await expect(controller.remove(2)).resolves.toEqual(deletedResponse);
    expect(usersService.delete).toHaveBeenCalledWith(2);
  });
});
