import React, { useState, useEffect } from 'react';
import { IonIcon, IonRippleEffect } from '@ionic/react';
import { trashOutline, playCircleOutline } from 'ionicons/icons';
import { TgFile, formatBytes, getFileIcon, getMimeColor, getThumbnail } from '../services/telegram';
import './FileListItem.css';

interface Props {
  file: TgFile;
  onClick: () => void;
  onDelete: () => void;
}

const FileListItem: React.FC<Props> = ({ file, onClick, onDelete }) => {
  const color = getMimeColor(file.mimeType);
  const icon = getFileIcon(file.mimeType);
  const isMedia = file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/');
  const isVideo = file.mimeType.startsWith('video/');
  const date = new Date(file.date * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    if (!isMedia) return;
    let cancelled = false;
    getThumbnail(file).then(url => { if (!cancelled) setThumb(url); });
    return () => { cancelled = true; };
  }, [file.id]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className="file-list-item ion-activatable" onClick={onClick}>
      <IonRippleEffect />

      <div className="fli-icon-wrap" style={{ background: thumb ? 'transparent' : `${color}20` }}>
        {thumb ? (
          <div className="fli-thumb-wrap">
            <img src={thumb} alt={file.name} className="fli-thumb-img" />
            {isVideo && (
              <div className="fli-thumb-play">
                <IonIcon icon={playCircleOutline} />
              </div>
            )}
          </div>
        ) : (
          <IonIcon icon={icon} style={{ color }} className="fli-icon" />
        )}
      </div>

      <div className="fli-info">
        <p className="fli-name">{file.name}</p>
        <p className="fli-meta">{formatBytes(file.size)} · {date}</p>
      </div>

      <button className="fli-delete" onClick={handleDelete}>
        <IonIcon icon={trashOutline} />
      </button>
    </div>
  );
};

export default FileListItem;
