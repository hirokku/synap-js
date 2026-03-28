import { SignJWT, jwtVerify } from 'jose';
import type { JwtPayload } from './types.js';

export async function signToken(
  payload: JwtPayload,
  secret: string,
  expiresIn = '24h',
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<JwtPayload> {
  const secretKey = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, secretKey);
  return {
    sub: payload.sub as string,
    email: payload['email'] as string,
    name: payload['name'] as string,
    role: payload['role'] as string,
  };
}
