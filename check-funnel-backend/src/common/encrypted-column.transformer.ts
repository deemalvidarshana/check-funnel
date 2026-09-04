import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { ValueTransformer } from 'typeorm';

const getKey = () => {
  const keyMaterial = process.env.GOOGLE_CREDENTIAL_ENCRYPTION_KEY || process.env.JWT_SECRET || '';
  return keyMaterial ? createHash('sha256').update(keyMaterial).digest() : null;
};

export const encryptedColumnTransformer: ValueTransformer = {
  to(value?: string | null) {
    const key = getKey();
    if (!value || value.startsWith('enc:v1:') || !key) return value;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:v1:${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
  },
  from(value?: string | null) {
    const key = getKey();
    if (!value?.startsWith('enc:v1:') || !key) return value;
    try {
      const [, , ivText, tagText, encryptedText] = value.split(':');
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivText, 'base64url'));
      decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
      return Buffer.concat([decipher.update(Buffer.from(encryptedText, 'base64url')), decipher.final()]).toString('utf8');
    } catch {
      return null;
    }
  },
};
