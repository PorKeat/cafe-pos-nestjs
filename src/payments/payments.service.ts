import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CashPaymentDto, ConfirmBakongPaymentDto } from './dto/bakong.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly ordersService: OrdersService) {}

  async initiateQrPayment(orderId: string) {
    const order = await this.ordersService.findOne(orderId);

    if (order.paymentStatus === 'paid') {
      throw new BadRequestException('Order already paid');
    }

    // Load your static merchant QR from Bakong app
    const qrPath = path.join(__dirname, 'merchant-qr.png');
    const qrBase64 = fs.readFileSync(qrPath).toString('base64');

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,    
      qrCode: `data:image/png;base64,${qrBase64}`,
      instruction: `Please transfer exactly $${order.total} to porkeat@aclb`,
    };
  }

  async confirmPayment(dto: ConfirmBakongPaymentDto) {
    // Cashier manually confirms after seeing the transfer in Bakong app
    const order = await this.ordersService.markPaid(dto.orderId, 'bakong', dto.transactionId);
    this.logger.log(`Payment confirmed for order ${order.orderNumber}`);
    return { success: true, order, message: 'Payment confirmed' };
  }

  async processCash(dto: CashPaymentDto) {
    const order = await this.ordersService.findOne(dto.orderId);

    if (dto.amountTendered < Number(order.total)) {
      throw new BadRequestException(
        `Insufficient cash. Total is ${order.total}, tendered ${dto.amountTendered}`,
      );
    }

    const change = dto.amountTendered - Number(order.total);
    const updatedOrder = await this.ordersService.markPaid(dto.orderId, 'cash');

    return {
      success: true,
      order: updatedOrder,
      amountTendered: dto.amountTendered,
      change: Math.round(change * 100) / 100,
      message: 'Cash payment processed',
    };
  }
}