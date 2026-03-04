import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem, MenuCategory } from './menu.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuRepo: Repository<MenuItem>,
  ) {}

  create(dto: CreateMenuItemDto): Promise<MenuItem> {
    const item = this.menuRepo.create(dto);
    return this.menuRepo.save(item);
  }

  findAll(category?: MenuCategory): Promise<MenuItem[]> {
    const where: any = { isAvailable: true };
    if (category) where.category = category;
    return this.menuRepo.find({ where, order: { category: 'ASC', name: 'ASC' } });
  }

  async findOne(id: string): Promise<MenuItem> {
    const item = await this.menuRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Menu item ${id} not found`);
    return item;
  }

  async update(id: string, dto: UpdateMenuItemDto): Promise<MenuItem> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.menuRepo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.menuRepo.remove(item);
  }

  async toggleAvailability(id: string): Promise<MenuItem> {
    const item = await this.findOne(id);
    item.isAvailable = !item.isAvailable;
    return this.menuRepo.save(item);
  }
}