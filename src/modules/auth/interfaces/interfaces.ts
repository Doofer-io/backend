export interface UserDataResponse {
  user: {
    userUuid: string;
    email: string;
    avatar: string | null;
    firstName: string;
    lastName: string;
    createdAt: Date;
    updatedAt: Date;
  };
  isIndividual: boolean;
}

export interface AccessTokenResponse extends UserDataResponse {
  accessToken: string;
}
