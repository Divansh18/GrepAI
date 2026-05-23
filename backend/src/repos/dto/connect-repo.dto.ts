import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ConnectRepoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  owner!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
}
