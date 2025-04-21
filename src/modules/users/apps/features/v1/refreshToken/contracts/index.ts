import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

// @region Request Dto
export class RefreshTokenRequestDto {
	@IsString()
	@IsNotEmpty()
	@IsUUID()
	@Type(() => String)
	public accessToken: string;

	@IsString()
	@IsNotEmpty()
	@IsUUID()
	@Type(() => String)
	public refreshToken: string;
}
// @endregion

// @region Response Dto
export class RefreshTokenResponseDto {
	public accessToken: string;
	public refreshToken: string;
}

// @endregion
