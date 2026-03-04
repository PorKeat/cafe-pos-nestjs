import { IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmBakongPaymentDto {
  @ApiProperty({ example: 'uuid-of-order' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 'TXN-20240101-ABCD', description: 'Transaction ID from Bakong app' })
  @IsString()
  transactionId: string;
}

export class CashPaymentDto {
  @ApiProperty({ example: 'uuid-of-order' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 20.0 })
  @IsNumber()
  @Min(0)
  amountTendered: number;
}