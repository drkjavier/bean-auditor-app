export type AuthSession = {
  username: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};
