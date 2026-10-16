import {
  IsString,
  IsNotEmpty,
  IsNumberString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RetireDto {
  @ApiProperty({
    example: 'GABC...XYZ',
    description: 'Stellar public key of the buyer',
  })
  @IsString()
  @IsNotEmpty()
  buyerPublicKey: string;

  @ApiProperty({ example: '037176a1...', description: 'Hex-encoded credit ID' })
  @IsString()
  @IsNotEmpty()
  creditId: string;

  @ApiProperty({ example: '1000000', description: '1 tonne = 1_000_000 units' })
  @IsNumberString()
  @IsNotEmpty()
  tonnes: string;

  @ApiProperty({ example: '2024 Scope 3 offset' })
  @IsString()
  @MinLength(1, { message: 'reason must be between 1 and 500 characters' })
  @MaxLength(500, { message: 'reason must be between 1 and 500 characters' })
  reason: string;
}
