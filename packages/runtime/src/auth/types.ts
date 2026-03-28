export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}
