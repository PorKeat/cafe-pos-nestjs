import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateBakongPaymentDto {
  @ApiProperty({ example: 'uuid-of-order' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 'KHR', description: 'Currency: KHR or USD' })
  @IsString()
  currency: 'KHR' | 'USD';
}

export class ConfirmBakongPaymentDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 'TXN-20240101-ABCD' })
  @IsString()
  transactionId: string;

  @ApiProperty({ example: 12.5 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CashPaymentDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 20.0 })
  @IsNumber()
  @Min(0)
  amountTendered: number;
}