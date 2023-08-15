export const USER_CREATION_ERROR = 'Error while creating user';
export const USER_UNIQUE = 'User already exists';
export const INVALID_DATA = 'Invalid email or password';

export interface UserData {
  email: string;
  firstName: string;
  lastName: string;
}
