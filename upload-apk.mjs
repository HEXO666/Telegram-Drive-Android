#!/usr/bin/env node
/**
 * Uploads the built APK to Telegram Saved Messages.
 * Run: node upload-apk.mjs
 * Re-run anytime to push a new build.
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl/index.js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_ID   = 35007931;
const API_HASH = 'f3e5f4d7d5f63ed2e0e37554a34ad427';
const SESSION_FILE = path.join(__dirname, '.tg-session');
const APK_PATH = path.join(
  __dirname,
  'android/app/build/outputs/apk/debug/app-debug.apk'
);

function ask(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(prompt, ans => { rl.close(); resolve(ans.trim()); }));
}

function loadSession() {
  try { return fs.readFileSync(SESSION_FILE, 'utf8').trim(); } catch { return ''; }
}

function saveSession(str) {
  fs.writeFileSync(SESSION_FILE, str, 'utf8');
}

async function main() {
  if (!fs.existsSync(APK_PATH)) {
    console.error('❌  APK not found at:', APK_PATH);
    console.error('   Run the gradle build first.');
    process.exit(1);
  }

  const stat = fs.statSync(APK_PATH);
  const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
  console.log(`📦  APK found — ${sizeMB} MB`);

  const session = new StringSession(loadSession());
  const client = new TelegramClient(session, API_ID, API_HASH, { connectionRetries: 5 });

  await client.start({
    phoneNumber:  async () => ask('📱  Phone number (with country code, e.g. +1234567890): '),
    password:     async () => ask('🔒  2FA password (leave blank if none): '),
    phoneCode:    async () => ask('📨  Telegram verification code: '),
    onError:      (err) => console.error('Auth error:', err.message),
  });

  saveSession(client.session.save());
  console.log('✅  Authenticated');

  console.log('⬆️   Uploading APK to Saved Messages…');
  const apkBuffer = fs.readFileSync(APK_PATH);

  await client.sendFile('me', {
    file: apkBuffer,
    attributes: [
      new Api.DocumentAttributeFilename({ fileName: `TelegramDrive-v${getVersion()}.apk` }),
    ],
    caption: `🚀 Telegram Drive Android — ${new Date().toLocaleString()}\nInstall on your phone to get the latest build.`,
    progressCallback: (p) => {
      process.stdout.write(`\r   Progress: ${Math.round(p * 100)}%   `);
    },
  });

  console.log('\n✅  APK sent to Saved Messages! Open Telegram on your phone to download it.');
  await client.disconnect();
}

function getVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    return pkg.version || '1.0.0';
  } catch { return '1.0.0'; }
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
