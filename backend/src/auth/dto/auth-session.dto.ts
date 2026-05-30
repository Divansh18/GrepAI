export class AuthUserDto {
  id!: number;
  username!: string;
  email!: string | null;
  avatarUrl!: string | null;
}

export class AuthSessionDto {
  accessToken!: string;
  user!: AuthUserDto;
}
