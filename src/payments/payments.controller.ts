import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  InitiateBakongPaymentDto,
  ConfirmBakongPaymentDto,
  CashPaymentDto,
} from './dto/ bakong.dto';
import { JwtAuthGuard } from '../auth/roles.guard';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('bakong/initiate')
  @ApiOperation({ summary: 'Generate a Bakong KHQR code for an order' })
  initiateBakong(@Body() dto: InitiateBakongPaymentDto) {
    return this.paymentsService.initiateBakong(dto);
  }

  @Post('bakong/confirm')
  @ApiOperation({ summary: 'Confirm a Bakong payment after QR scan' })
  confirmBakong(@Body() dto: ConfirmBakongPaymentDto) {
    return this.paymentsService.confirmBakong(dto);
  }

  @Post('cash')
  @ApiOperation({ summary: 'Process a cash payment and return change' })
  processCash(@Body() dto: CashPaymentDto) {
    return this.paymentsService.processCash(dto);
  }
}