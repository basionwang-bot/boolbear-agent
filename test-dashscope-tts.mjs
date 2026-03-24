import mysql from 'mysql2/promise';
import crypto from 'crypto';
import fs from 'fs';

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
  const config = rows[0];
  const apiKey = decryptApiKey(config.apiKeyEncrypted, config.apiKeyIv, config.apiKeyTag);
  await conn.end();

  console.log('API Key prefix:', apiKey.substring(0, 8));

  // DashScope uses different API format - try the compatible-mode/v1/audio/speech (OpenAI compatible)
  // and also the native DashScope format
  const tests = [
    {
      name: 'OpenAI-compatible audio/speech (compatible-mode)',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/audio/speech',
      body: {
        model: 'cosyvoice-v3-flash',
        input: '你好世界',
        voice: 'longxiaochun',
      },
    },
    {
      name: 'DashScope native text2audio',
      url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2audio/generation',
      body: {
        model: 'cosyvoice-v3-flash',
        input: { text: '你好世界' },
        parameters: { voice: 'longxiaochun', format: 'mp3' },
      },
    },
    {
      name: 'DashScope native speech-synthesizer',
      url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/speech-synthesizer/generation',
      body: {
        model: 'cosyvoice-v3-flash',
        input: { text: '你好世界' },
        parameters: { voice: 'longxiaochun', format: 'mp3' },
      },
    },
  ];

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    console.log('URL:', test.url);
    try {
      const response = await fetch(test.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(test.body),
      });

      console.log('Status:', response.status, response.statusText);
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      if (response.ok) {
        if (contentType && (contentType.includes('audio') || contentType.includes('octet'))) {
          const buf = await response.arrayBuffer();
          console.log('SUCCESS! Audio size:', buf.byteLength, 'bytes');
          fs.writeFileSync('/tmp/test-tts.mp3', Buffer.from(buf));
          console.log('Saved to /tmp/test-tts.mp3');
        } else {
          const text = await response.text();
          console.log('Response:', text.substring(0, 500));
        }
      } else {
        const text = await response.text();
        console.log('Error:', text.substring(0, 500));
      }
    } catch (err) {
      console.log('Error:', err.message);
    }
  }
}

main().catch(console.error);
