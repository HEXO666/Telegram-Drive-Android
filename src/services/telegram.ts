import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';

const API_ID = parseInt(import.meta.env.VITE_TG_API_ID || '0');
const API_HASH = import.meta.env.VITE_TG_API_HASH || '';
const SESSION_KEY = 'tg_session';

export interface TgFile {
  id: string;
  messageId: number;
  name: string;
  size: number;
  mimeType: string;
  date: number;
  folderId?: string;
}

export interface TgFolder {
  id: string;
  name: string;
  accessHash: string;
}

let client: TelegramClient | null = null;

// Cache raw media objects so getThumbnail never needs a getMessages call
const mediaCache = new Map<string, Api.TypeMessageMedia>();
// Cache rendered thumbnail data URLs
const thumbCache = new Map<string, string | null>();

function getSession(): StringSession {
  const saved = localStorage.getItem(SESSION_KEY) || '';
  return new StringSession(saved);
}

function saveSession(c: TelegramClient) {
  localStorage.setItem(SESSION_KEY, c.session.save() as unknown as string);
}

export function isSessionSaved(): boolean {
  return !!localStorage.getItem(SESSION_KEY);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  mediaCache.clear();
  thumbCache.clear();
  client = null;
}

export async function getClient(): Promise<TelegramClient> {
  if (client && client.connected) return client;
  client = new TelegramClient(getSession(), API_ID, API_HASH, {
    connectionRetries: 5,
  });
  await client.connect();
  return client;
}

export async function sendCode(phone: string): Promise<{ phoneCodeHash: string }> {
  const c = await getClient();
  const result = await c.sendCode({ apiId: API_ID, apiHash: API_HASH }, phone);
  return { phoneCodeHash: result.phoneCodeHash };
}

export async function signIn(phone: string, phoneCodeHash: string, code: string): Promise<void> {
  const c = await getClient();
  await c.invoke(
    new Api.auth.SignIn({ phoneNumber: phone, phoneCodeHash, phoneCode: code })
  );
  saveSession(c);
}

export async function signInWithPassword(password: string): Promise<void> {
  const c = await getClient();
  await c.signInWithPassword({ apiId: API_ID, apiHash: API_HASH }, {
    password: async () => password,
    onError: async () => true,
  });
  saveSession(c);
}

export async function isAuthorized(): Promise<boolean> {
  try {
    const c = await getClient();
    const me = await c.getMe();
    return !!me;
  } catch {
    return false;
  }
}

export async function getMe() {
  const c = await getClient();
  return c.getMe();
}

export async function getFolders(): Promise<TgFolder[]> {
  const c = await getClient();
  const dialogs = await c.getDialogs({ limit: 100 });
  const folders: TgFolder[] = [];
  for (const d of dialogs) {
    if (d.isChannel && d.entity) {
      const e = d.entity as Api.Channel;
      if (e.megagroup === false && e.broadcast === false) {
        folders.push({ id: String(e.id), name: d.title || 'Unnamed', accessHash: String(e.accessHash) });
      }
      if (e.creator) {
        folders.push({ id: String(e.id), name: d.title || 'Unnamed', accessHash: String(e.accessHash) });
      }
    }
  }
  const seen = new Set<string>();
  return folders.filter(f => { if (seen.has(f.id)) return false; seen.add(f.id); return true; });
}

function buildFileFromMessage(msg: Api.Message, folderId?: string): TgFile | null {
  if (!msg.media) return null;
  let name = 'Unknown';
  let size = 0;
  let mimeType = 'application/octet-stream';

  if (msg.media instanceof Api.MessageMediaDocument && msg.media.document instanceof Api.Document) {
    const doc = msg.media.document;
    size = Number(doc.size);
    mimeType = doc.mimeType || mimeType;
    for (const attr of doc.attributes) {
      if (attr instanceof Api.DocumentAttributeFilename) { name = attr.fileName; break; }
      if (attr instanceof Api.DocumentAttributeAudio) name = `audio_${msg.id}.ogg`;
      if (attr instanceof Api.DocumentAttributeVideo) name = `video_${msg.id}.mp4`;
    }
  } else if (msg.media instanceof Api.MessageMediaPhoto) {
    name = `photo_${msg.id}.jpg`;
    mimeType = 'image/jpeg';
  } else {
    return null;
  }

  return {
    id: `${folderId || 'me'}_${msg.id}`,
    messageId: msg.id,
    name,
    size,
    mimeType,
    date: msg.date,
    folderId,
  };
}

export async function getFiles(folderId?: string): Promise<TgFile[]> {
  const c = await getClient();
  const peer = folderId ? await resolvePeer(folderId) : 'me';
  const messages = await c.getMessages(peer, { limit: 100 });
  const files: TgFile[] = [];
  for (const msg of messages) {
    if (!(msg instanceof Api.Message)) continue;
    const f = buildFileFromMessage(msg, folderId);
    if (f) {
      // Cache raw media so getThumbnail never needs another getMessages call
      if (msg.media) mediaCache.set(f.id, msg.media);
      files.push(f);
    }
  }
  return files;
}

async function resolvePeer(folderId: string) {
  const c = await getClient();
  const dialogs = await c.getDialogs({ limit: 100 });
  for (const d of dialogs) {
    if (d.entity && String((d.entity as any).id) === folderId) return d.entity;
  }
  throw new Error('Folder not found');
}

// Convert raw buffer to base64 data URL safely
function bufToDataUrl(buf: Buffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let b64 = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    b64 += String.fromCharCode(...Array.from(bytes.subarray(i, i + chunk)));
  }
  return `data:image/jpeg;base64,${btoa(b64)}`;
}

export async function getThumbnail(file: TgFile): Promise<string | null> {
  if (thumbCache.has(file.id)) return thumbCache.get(file.id)!;

  const isMedia = file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/');
  if (!isMedia) { thumbCache.set(file.id, null); return null; }

  // Use cached media — no extra API call needed
  const media = mediaCache.get(file.id);
  if (!media) { thumbCache.set(file.id, null); return null; }

  try {
    const c = await getClient();
    const buf = await c.downloadMedia(media, { thumb: 0 });
    if (!buf || typeof buf === 'string' || (buf as any).length === 0) {
      thumbCache.set(file.id, null);
      return null;
    }
    const dataUrl = bufToDataUrl(buf as Buffer);
    thumbCache.set(file.id, dataUrl);
    return dataUrl;
  } catch {
    thumbCache.set(file.id, null);
    return null;
  }
}

export async function uploadFile(
  file: File,
  folderId?: string,
  onProgress?: (p: number) => void
): Promise<void> {
  const c = await getClient();
  const peer = folderId ? await resolvePeer(folderId) : 'me';
  const buffer = await file.arrayBuffer();
  await c.sendFile(peer, {
    file: Buffer.from(buffer),
    attributes: [new Api.DocumentAttributeFilename({ fileName: file.name })],
    progressCallback: (progress: number) => {
      onProgress?.(Math.round(progress * 100));
    },
  });
}

export async function downloadFile(tgFile: TgFile, folderId?: string): Promise<Uint8Array> {
  const c = await getClient();
  // Use cached media first, fall back to fetching the message
  let media = mediaCache.get(tgFile.id);
  if (!media) {
    const peer = folderId ? await resolvePeer(folderId) : 'me';
    const [msg] = await c.getMessages(peer, { ids: [tgFile.messageId] });
    if (!(msg instanceof Api.Message) || !msg.media) throw new Error('Message not found');
    media = msg.media;
  }
  const buf = await c.downloadMedia(media, {});
  if (!buf) throw new Error('Download failed');
  return buf as Uint8Array;
}

export async function deleteFile(tgFile: TgFile, folderId?: string): Promise<void> {
  const c = await getClient();
  const peer = folderId ? await resolvePeer(folderId) : 'me';
  await c.deleteMessages(peer, [tgFile.messageId], { revoke: true });
  mediaCache.delete(tgFile.id);
  thumbCache.delete(tgFile.id);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image-outline';
  if (mimeType.startsWith('video/')) return 'videocam-outline';
  if (mimeType.startsWith('audio/')) return 'musical-notes-outline';
  if (mimeType === 'application/pdf') return 'document-text-outline';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive-outline';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document-outline';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'grid-outline';
  return 'document-outline';
}

export function getMimeColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '#4CAF50';
  if (mimeType.startsWith('video/')) return '#E91E63';
  if (mimeType.startsWith('audio/')) return '#9C27B0';
  if (mimeType === 'application/pdf') return '#F44336';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '#FF9800';
  if (mimeType.includes('word') || mimeType.includes('document')) return '#2196F3';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '#4CAF50';
  return '#607D8B';
}
