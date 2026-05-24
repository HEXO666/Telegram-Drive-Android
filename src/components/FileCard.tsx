import React, { useState, useEffect } from 'react';
import { IonIcon, IonRippleEffect } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { TgFile, formatBytes, getThumbnail } from '../services/telegram';
import FileTypeIcon from './FileTypeIcon';
import './FileCard.css';

interface FileCardProps {
  file: TgFile;
  onClick: () => void;
  onDelete: () => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onClick, onDelete }) => {
  const isMedia = file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/');
  const isVideo = file.mimeType.startsWith('video/');

  const [thumb, setThumb] = useState<string | null>(null);
  const [loading, setLoading] = useState(isMedia);

  useEffect(() => {
    if (!isMedia) return;
    let cancelled = false;
    getThumbnail(file)
      .then(url => { if (!cancelled) { setThumb(url); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [file.id]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className="file-card ion-activatable" onClick={onClick}>
      <IonRippleEffect />

      <div className="file-card-thumb">
        {thumb ? (
          <>
            <img src={thumb} alt={file.name} className="file-card-thumb-img" />
            {isVideo && <div className="file-card-play-badge">▶</div>}
          </>
        ) : loading ? (
          <div className="file-card-shimmer" />
        ) : (
          <FileTypeIcon filename={file.name} mimeType={file.mimeType} size="lg" />
        )}
      </div>

      <div className="file-card-info">
        <p className="file-card-name">{file.name}</p>
        <p className="file-card-size">{formatBytes(file.size)}</p>
      </div>

      <button className="file-card-delete" onClick={handleDelete}>
        <IonIcon icon={trashOutline} />
      </button>
    </div>
  );
};

export default FileCard;
