import { AppError } from "../../shared/errors/AppError";
import { ClientsRepository } from "./clients.repository";
import { CreateClientDto, ListClientsQuery, UpdateClientDto } from "./clients.dto";

export const ClientsService = {
  async findAll(query: ListClientsQuery) {
    return ClientsRepository.findAll(query);
  },

  async findById(id: string) {
    const client = await ClientsRepository.findById(id);
    if (!client) throw AppError.notFound(`Client '${id}' not found`);
    return client;
  },

  async create(dto: CreateClientDto) {
    return ClientsRepository.create(dto);
  },

  async update(id: string, dto: UpdateClientDto) {
    await ClientsService.findById(id);
    return ClientsRepository.update(id, dto);
  },

  async delete(id: string) {
    await ClientsService.findById(id);
    return ClientsRepository.delete(id);
  },
};
