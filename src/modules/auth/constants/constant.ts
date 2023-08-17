export const SALT = 10;

export const EMAIL_CREATION_ERROR = 'Error while creating email_account';
export const REGISTER_ERROR = 'Error while registration';
export const JWT_ERROR = 'Failed to create an access token';
export const COMPANY_NAME = 'companyName';
export const ENTITIES_ERROR = 'Failed to create related entities.';

export interface AuthRepsonse {
  user: {
    userUuid: string;
    email: string;
    avatar: string | null;
    firstName: string;
    lastName: string;
    createdAt: Date;
    updatedAt: Date;
  };
  accessToken: string;
  isIndividual: boolean;
}

export interface GoogleAuthResponse extends AuthRepsonse {
  success: boolean;
}
