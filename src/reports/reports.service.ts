import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';

export interface SalesReport {
  from: string;
  to: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topItems: { name: string; qty: number; revenue: number }[];
  salesByCategory: { category: string; qty: number; revenue: number }[];
  salesByHour: { hour: number; orders: number; revenue: number }[];
}

@Injectable()
export class ReportsService {
  constructor(private readonly ordersService: OrdersService) {}

  async getSalesReport(from: Date, to: Date): Promise<SalesReport> {
    const orders = await this.ordersService.findByDateRange(from, to);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top items
    const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();
    const categoryMap = new Map<string, { category: string; qty: number; revenue: number }>();
    const hourMap = new Map<number, { hour: number; orders: number; revenue: number }>();

    for (const order of orders) {
      const hour = new Date(order.createdAt).getHours();
      const hourData = hourMap.get(hour) ?? { hour, orders: 0, revenue: 0 };
      hourData.orders += 1;
      hourData.revenue += Number(order.total);
      hourMap.set(hour, hourData);

      for (const item of order.items) {
        const itemName = item.menuItem.name;
        const category = item.menuItem.category;
        const revenue = Number(item.subtotal);

        const existing = itemMap.get(itemName) ?? { name: itemName, qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += revenue;
        itemMap.set(itemName, existing);

        const catData = categoryMap.get(category) ?? { category, qty: 0, revenue: 0 };
        catData.qty += item.quantity;
        catData.revenue += revenue;
        categoryMap.set(category, catData);
      }
    }

    const topItems = [...itemMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const salesByCategory = [...categoryMap.values()].sort((a, b) => b.revenue - a.revenue);

    const salesByHour = [...hourMap.values()].sort((a, b) => a.hour - b.hour);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      topItems,
      salesByCategory,
      salesByHour,
    };
  }

  async getDailySummary(): Promise<SalesReport> {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    return this.getSalesReport(from, to);
  }

  async getMonthlySummary(year: number, month: number): Promise<SalesReport> {
    const from = new Date(year, month - 1, 1, 0, 0, 0);
    const to = new Date(year, month, 0, 23, 59, 59);
    return this.getSalesReport(from, to);
  }
}