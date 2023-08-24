import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  scryptSync,
} from 'crypto';

export async function encrypt(text: string, password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 32);
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}.${authTag}.${encrypted}.${salt.toString(
    'hex',
  )}`;
}

export async function decrypt(text: string, password: string): Promise<string> {
  const [ivHex, authTagHex, encryptedTextHex, saltHex] = text.split('.');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encryptedText = Buffer.from(encryptedTextHex, 'hex');
  const salt = Buffer.from(saltHex, 'hex');

  const key = scryptSync(password, salt, 32);

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText).toString('utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
