import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ConfirmBakongPaymentDto, CashPaymentDto } from './dto/bakong.dto';
import { JwtAuthGuard } from '../auth/roles.guard';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('qr/initiate/:orderId')      // ← just pass orderId in URL, no body needed
  @ApiOperation({ summary: 'Get static Bakong QR for order' })
  initiateQr(@Param('orderId') orderId: string) {
    return this.paymentsService.initiateQrPayment(orderId);
  }

  @Post('qr/confirm')                // ← cashier confirms after seeing transfer in app
  @ApiOperation({ summary: 'Manually confirm Bakong payment' })
  confirmPayment(@Body() dto: ConfirmBakongPaymentDto) {
    return this.paymentsService.confirmPayment(dto);
  }

  @Post('cash')
  @ApiOperation({ summary: 'Process cash payment and return change' })
  processCash(@Body() dto: CashPaymentDto) {
    return this.paymentsService.processCash(dto);
  }
}