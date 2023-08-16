export interface JWTPayload {
  email: string;
  userUuid: string;
}

export interface JWTTempPayload {
  provider: string;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}
