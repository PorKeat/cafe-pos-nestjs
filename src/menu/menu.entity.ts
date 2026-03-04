import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { OrderItem } from '../orders/order-item.entity';

export enum MenuCategory {
  COFFEE = 'coffee',
  TEA = 'tea',
  SMOOTHIE = 'smoothie',
  FOOD = 'food',
  DESSERT = 'dessert',
  OTHER = 'other',
}

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: MenuCategory, default: MenuCategory.OTHER })
  category: MenuCategory;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: 0 })
  preparationTimeMinutes: number;

  @OneToMany(() => OrderItem, (item) => item.menuItem)
  orderItems: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}