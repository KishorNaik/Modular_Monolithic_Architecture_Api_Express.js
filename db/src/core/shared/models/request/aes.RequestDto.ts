import { Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AesRequestDto {
	@IsNotEmpty()
	@IsString()
	@Type(() => String)
	body?: string;
}
