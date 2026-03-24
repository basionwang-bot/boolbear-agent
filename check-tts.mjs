import mysql from 'mysql2/promise';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.JWT_SECRET || 'default-secret-key';

function getEncryptionKey() {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

function decryptApiKey(encrypted, iv, tag) {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.query('SELECT * FROM ai_provider_configs WHERE id = 60002');
  
  if (rows.length === 0) {
    console.log('No TTS config found');
    await conn.end();
    return;
  }

  const config = rows[0];
  console.log('TTS Config:', {
    id: config.id,
    providerId: config.providerId,
    displayName: config.displayName,
    baseUrl: config.baseUrl,
    isDefault: config.isDefault,
    isActive: config.isActive,
    hasEncryptedKey: !!config.apiKeyEncrypted,
    hasIv: !!config.apiKeyIv,
    hasTag: !!config.apiKeyTag,
  });

  // Try to decrypt the API key
  try {
    const apiKey = decryptApiKey(config.apiKeyEncrypted, config.apiKeyIv, config.apiKeyTag);
    console.log('API Key decrypted successfully, length:', apiKey.length);
    console.log('API Key prefix:', apiKey.substring(0, 6) + '...');

    // Test the actual TTS API call
    // The baseUrl is: https://dashscope.aliyuncs.com/compatible-mode/v1
    // For CosyVoice, the correct endpoint is different
    const baseUrl = config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    
    // Try OpenAI-compatible endpoint first (since baseUrl ends with /v1)
    const url = baseUrl.endsWith('/') ? baseUrl + 'audio/speech' : baseUrl + '/audio/speech';
    console.log('\nTesting TTS endpoint:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'cosyvoice-v1',
        input: '你好世界',
        voice: 'longxiaochun',
      }),
    });
    
    console.log('Response status:', response.status, response.statusText);
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (response.ok && contentType && contentType.includes('audio')) {
      const buf = await response.arrayBuffer();
      console.log('Audio size:', buf.byteLength, 'bytes');
    } else {
      const text = await response.text();
      console.log('Response body:', text.substring(0, 500));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }

  await conn.end();
}

main().catch(console.error);
