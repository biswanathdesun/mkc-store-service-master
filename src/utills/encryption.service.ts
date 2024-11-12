import { Injectable } from '@nestjs/common';

@Injectable()
export class EncryptionService {
  private readonly key = process.env.ENCRYPTION_KEY;

  encrypt(data: any): string {
    const encryptedData = this.simpleEncrypt(JSON.stringify(data), this.key);
    return encryptedData;
  }

  decrypt(encryptedData: string): any {
    const decryptedData = this.simpleDecrypt(encryptedData, this.key);
    return JSON.parse(decryptedData);
  }

  // Simple encryption function
  private simpleEncrypt(data: any, key: string): string {
    let encryptedText = '';
    for (let i = 0; i < data.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const encryptedChar = String.fromCharCode(data.charCodeAt(i) ^ keyChar);
      encryptedText += encryptedChar;
    }
    return encryptedText;
  }

  // Simple decryption function
  private simpleDecrypt(encryptedText: string, key: string): string {
    let decryptedText = '';
    for (let i = 0; i < encryptedText.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const decryptedChar = String.fromCharCode(
        encryptedText.charCodeAt(i) ^ keyChar,
      );
      decryptedText += decryptedChar;
    }
    return decryptedText;
  }
}
