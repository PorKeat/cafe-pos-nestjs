import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { MenuService } from '../menu/menu.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
    private readonly menuService: MenuService,
  ) {}

  private generateOrderNumber(): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${datePart}-${rand}`;
  }

  async create(dto: CreateOrderDto, user: User): Promise<Order> {
    let subtotal = 0;
    const itemEntities: Partial<OrderItem>[] = [];

    for (const item of dto.items) {
      const menuItem = await this.menuService.findOne(item.menuItemId);
      if (!menuItem.isAvailable) {
        throw new BadRequestException(`${menuItem.name} is currently unavailable`);
      }
      const itemSubtotal = Number(menuItem.price) * item.quantity;
      subtotal += itemSubtotal;
      itemEntities.push({
        menuItem,
        quantity: item.quantity,
        unitPrice: Number(menuItem.price),
        subtotal: itemSubtotal,
        specialInstructions: item.specialInstructions,
      });
    }

    const discountPercent = dto.discountPercent ?? 0;
    const total = subtotal * (1 - discountPercent / 100);

    const order = this.ordersRepo.create({
      orderNumber: this.generateOrderNumber(),
      tableNumber: dto.tableNumber,
      customerName: dto.customerName,
      notes: dto.notes,
      discountPercent,
      subtotal,
      total,
      createdBy: user,
    });

    const savedOrder = await this.ordersRepo.save(order);

    const items = itemEntities.map((i) =>
      this.orderItemsRepo.create({ ...i, order: savedOrder }),
    );
    await this.orderItemsRepo.save(items);

    return this.findOne(savedOrder.id);
  }

  findAll(status?: OrderStatus): Promise<Order[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.ordersRepo.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['createdBy'],
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id },
      relations: ['items', 'items.menuItem', 'createdBy'],
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled order');
    }
    order.status = status;
    return this.ordersRepo.save(order);
  }

  async markPaid(
    id: string,
    paymentMethod: string,
    bakongTransactionId?: string,
  ): Promise<Order> {
    const order = await this.findOne(id);
    order.paymentStatus = PaymentStatus.PAID;
    order.paymentMethod = paymentMethod;
    order.status = OrderStatus.COMPLETED;
    if (bakongTransactionId) order.bakongTransactionId = bakongTransactionId;
    return this.ordersRepo.save(order);
  }

  async cancel(id: string): Promise<Order> {
    const order = await this.findOne(id);
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid order');
    }
    order.status = OrderStatus.CANCELLED;
    return this.ordersRepo.save(order);
  }

  findByDateRange(from: Date, to: Date): Promise<Order[]> {
    return this.ordersRepo.find({
      where: {
        createdAt: Between(from, to),
        paymentStatus: PaymentStatus.PAID,
      },
      relations: ['items', 'items.menuItem'],
    });
  }
}