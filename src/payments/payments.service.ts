import {
  Injectable, BadRequestException, Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { OrdersService } from '../orders/orders.service';
import {
  InitiateBakongPaymentDto,
  ConfirmBakongPaymentDto,
  CashPaymentDto,
} from './dto/ bakong.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Generate a Bakong KHQR code for the given order.
   * Uses the Bakong Open API — requires BAKONG_API_KEY in .env.
   */
  async initiateBakong(dto: InitiateBakongPaymentDto) {
    const order = await this.ordersService.findOne(dto.orderId);

    if (order.paymentStatus === 'paid') {
      throw new BadRequestException('Order already paid');
    }

    const merchantId = this.config.get('BAKONG_MERCHANT_ID', 'cafe_pos@wing');
    const merchantName = this.config.get('BAKONG_MERCHANT_NAME', 'Cafe POS');
    const bakongApiUrl = this.config.get(
      'BAKONG_API_URL',
      'https://api-bakong.nbc.gov.kh/v1',
    );
    const apiKey = this.config.get('BAKONG_API_KEY', '');

    const amount =
      dto.currency === 'KHR'
        ? Math.round(Number(order.total) * 4100) // approximate USD to KHR
        : Number(order.total);

    const payload = {
      merchantId,
      merchantName,
      merchantCity: 'Phnom Penh',
      currency: dto.currency === 'KHR' ? '116' : '840',
      amount: amount.toFixed(2),
      billNumber: order.orderNumber,
      description: `Payment for ${order.orderNumber}`,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${bakongApiUrl}/generate_qr`, payload, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
      );

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        currency: dto.currency,
        amount,
        qrCode: response.data?.data?.qrCode,
        deepLink: response.data?.data?.deepLink,
      };
    } catch (err) {
      this.logger.error('Bakong QR generation failed', err?.response?.data);
      // Return a mock QR for development
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        currency: dto.currency,
        amount,
        qrCode: `MOCK_QR_${order.orderNumber}_${amount}`,
        deepLink: null,
        _dev: 'Mock QR — configure BAKONG_API_KEY for production',
      };
    }
  }

  async confirmBakong(dto: ConfirmBakongPaymentDto) {
    const order = await this.ordersService.markPaid(
      dto.orderId,
      'bakong',
      dto.transactionId,
    );
    this.logger.log(
      `Bakong payment confirmed for order ${order.orderNumber} — TXN: ${dto.transactionId}`,
    );
    return {
      success: true,
      order,
      message: 'Payment confirmed via Bakong KHQR',
    };
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