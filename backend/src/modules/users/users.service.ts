import bcrypt from "bcryptjs";
import { AppError } from "../../shared/errors/AppError";
import { UsersRepository } from "./users.repository";
import { ListUsersQuery, UpdateUserDto, CreateUserDto } from "./users.dto";

export const UsersService = {
  async findAll(query: ListUsersQuery) {
    return UsersRepository.findAll(query);
  },

  async findById(id: string) {
    const user = await UsersRepository.findById(id);
    if (!user) throw AppError.notFound(`User '${id}' not found`);
    return user;
  },

  async create(dto: CreateUserDto) {
    // Check if email is already taken
    const existingUsers = await UsersRepository.findAll({ q: dto.email, limit: 1, page: 1 });
    if (existingUsers.data.some(u => u.email === dto.email)) {
      throw AppError.badRequest("Email already in use");
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return UsersRepository.create({ ...dto, password: hashedPassword });
  },

  async update(id: string, dto: UpdateUserDto) {
    await UsersService.findById(id); // ensure exists
    return UsersRepository.update(id, dto);
  },

  async delete(id: string) {
    await UsersService.findById(id);
    return UsersRepository.delete(id);
  },
};
