import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({ example: "Amina Bello", minLength: 2, maxLength: 60 })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;

  @ApiProperty({ example: "amina@example.com", maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: "secure-password1",
    minLength: 8,
    maxLength: 72,
    description: "At least 8 characters with a letter and a number",
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: "Password must include at least one letter and one number",
  })
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: "amina@example.com", maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: "secure-password1", minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: "amina@example.com", maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: "123456", minLength: 6, maxLength: 6 })
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

export class ResendEmailVerificationDto {
  @ApiProperty({ example: "amina@example.com", maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: "secure-password1", minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: "amina@example.com", maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: "amina@example.com", maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: "123456", minLength: 6, maxLength: 6 })
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;

  @ApiProperty({
    example: "secure-password1",
    minLength: 8,
    maxLength: 72,
    description: "At least 8 characters with a letter and a number",
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: "Password must include at least one letter and one number",
  })
  password!: string;
}
