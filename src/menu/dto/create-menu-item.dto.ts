import {
  IsString, IsEnum, IsNumber, IsOptional,
  IsBoolean, IsUrl, Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MenuCategory } from '../menu.entity';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Iced Latte' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Smooth espresso with cold milk', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: MenuCategory })
  @IsEnum(MenuCategory)
  category: MenuCategory;

  @ApiProperty({ example: 3.5 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  preparationTimeMinutes?: number;
}