import React from 'react';
import './FileTypeIcon.css';

interface Props {
  filename: string;
  mimeType: string;
  size?: 'sm' | 'md' | 'lg';
}

interface TypeDef {
  label: string;
  bg: string;
  color: string;
  emoji?: string;
}

function getTypeDef(filename: string, mimeType: string): TypeDef {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // By extension first (more specific)
  const extMap: Record<string, TypeDef> = {
    apk:  { label: 'APK',  bg: '#1b5e20', color: '#69f0ae', emoji: '🤖' },
    pdf:  { label: 'PDF',  bg: '#b71c1c', color: '#ff8a80', emoji: '📄' },
    zip:  { label: 'ZIP',  bg: '#e65100', color: '#ffcc80', emoji: '🗜' },
    rar:  { label: 'RAR',  bg: '#bf360c', color: '#ffab91', emoji: '🗜' },
    '7z': { label: '7Z',   bg: '#4a148c', color: '#ea80fc', emoji: '🗜' },
    tar:  { label: 'TAR',  bg: '#827717', color: '#f9a825', emoji: '🗜' },
    gz:   { label: 'GZ',   bg: '#33691e', color: '#ccff90', emoji: '🗜' },
    mp3:  { label: 'MP3',  bg: '#4a0e8f', color: '#ce93d8', emoji: '🎵' },
    wav:  { label: 'WAV',  bg: '#4a148c', color: '#b39ddb', emoji: '🎵' },
    ogg:  { label: 'OGG',  bg: '#311b92', color: '#9575cd', emoji: '🎵' },
    flac: { label: 'FLAC', bg: '#1a237e', color: '#90caf9', emoji: '🎵' },
    aac:  { label: 'AAC',  bg: '#880e4f', color: '#f48fb1', emoji: '🎵' },
    mp4:  { label: 'MP4',  bg: '#880e4f', color: '#f48fb1', emoji: '🎬' },
    mkv:  { label: 'MKV',  bg: '#4a148c', color: '#ce93d8', emoji: '🎬' },
    avi:  { label: 'AVI',  bg: '#b71c1c', color: '#ef9a9a', emoji: '🎬' },
    mov:  { label: 'MOV',  bg: '#212121', color: '#bdbdbd', emoji: '🎬' },
    doc:  { label: 'DOC',  bg: '#0d47a1', color: '#90caf9', emoji: '📝' },
    docx: { label: 'DOCX', bg: '#0d47a1', color: '#90caf9', emoji: '📝' },
    xls:  { label: 'XLS',  bg: '#1b5e20', color: '#a5d6a7', emoji: '📊' },
    xlsx: { label: 'XLSX', bg: '#1b5e20', color: '#a5d6a7', emoji: '📊' },
    ppt:  { label: 'PPT',  bg: '#bf360c', color: '#ffccbc', emoji: '📊' },
    pptx: { label: 'PPTX', bg: '#bf360c', color: '#ffccbc', emoji: '📊' },
    txt:  { label: 'TXT',  bg: '#37474f', color: '#b0bec5', emoji: '📃' },
    csv:  { label: 'CSV',  bg: '#004d40', color: '#80cbc4', emoji: '📊' },
    json: { label: 'JSON', bg: '#f57f17', color: '#fff176', emoji: '{ }' },
    xml:  { label: 'XML',  bg: '#e65100', color: '#ffcc80', emoji: '</>' },
    html: { label: 'HTML', bg: '#bf360c', color: '#ffab91', emoji: '</>' },
    css:  { label: 'CSS',  bg: '#006064', color: '#80deea', emoji: '🎨' },
    js:   { label: 'JS',   bg: '#f57f17', color: '#fff176', emoji: 'JS' },
    ts:   { label: 'TS',   bg: '#0d47a1', color: '#90caf9', emoji: 'TS' },
    py:   { label: 'PY',   bg: '#1a237e', color: '#9fa8da', emoji: '🐍' },
    jpg:  { label: 'JPG',  bg: '#1b5e20', color: '#a5d6a7', emoji: '🖼' },
    jpeg: { label: 'JPG',  bg: '#1b5e20', color: '#a5d6a7', emoji: '🖼' },
    png:  { label: 'PNG',  bg: '#1b5e20', color: '#c8e6c9', emoji: '🖼' },
    gif:  { label: 'GIF',  bg: '#4a148c', color: '#ce93d8', emoji: '🎞' },
    webp: { label: 'WEBP', bg: '#1b5e20', color: '#a5d6a7', emoji: '🖼' },
    svg:  { label: 'SVG',  bg: '#004d40', color: '#80cbc4', emoji: '🎨' },
    iso:  { label: 'ISO',  bg: '#212121', color: '#9e9e9e', emoji: '💿' },
    exe:  { label: 'EXE',  bg: '#1a237e', color: '#7986cb', emoji: '⚙️' },
    dmg:  { label: 'DMG',  bg: '#37474f', color: '#90a4ae', emoji: '💿' },
  };

  if (extMap[ext]) return extMap[ext];

  // Fall back to mime type
  if (mimeType.startsWith('image/'))       return { label: 'IMG',  bg: '#1b5e20', color: '#a5d6a7', emoji: '🖼' };
  if (mimeType.startsWith('video/'))       return { label: 'VID',  bg: '#880e4f', color: '#f48fb1', emoji: '🎬' };
  if (mimeType.startsWith('audio/'))       return { label: 'AUD',  bg: '#4a148c', color: '#ce93d8', emoji: '🎵' };
  if (mimeType.includes('pdf'))            return { label: 'PDF',  bg: '#b71c1c', color: '#ff8a80', emoji: '📄' };
  if (mimeType.includes('zip') || mimeType.includes('archive')) return { label: 'ZIP', bg: '#e65100', color: '#ffcc80', emoji: '🗜' };

  return { label: ext.toUpperCase().slice(0, 4) || 'FILE', bg: '#263238', color: '#90a4ae', emoji: '📁' };
}

const FileTypeIcon: React.FC<Props> = ({ filename, mimeType, size = 'md' }) => {
  const def = getTypeDef(filename, mimeType);

  return (
    <div className={`fti fti--${size}`} style={{ background: def.bg }}>
      <span className="fti-emoji">{def.emoji}</span>
      <span className="fti-label" style={{ color: def.color }}>{def.label}</span>
    </div>
  );
};

export default FileTypeIcon;
