import { Entity, Enum, PrimaryKey, Property, Unique } from '@mikro-orm/core';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Entity({ tableName: 'users' })
export class User {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ length: 100 })
  name!: string;

  @Unique()
  @Property({ length: 191 })
  email!: string;

  @Property({ fieldName: 'password_hash', length: 255 })
  passwordHash!: string;

  @Enum({ items: () => UserRole, default: UserRole.USER })
  role: UserRole = UserRole.USER;

  @Property({ fieldName: 'createdAt' })
  createdAt?: Date = new Date();

  @Property({ fieldName: 'updatedAt', onUpdate: () => new Date() })
  updatedAt?: Date = new Date();
}
