import React from 'react';
import { IonIcon, IonRippleEffect } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { TgFile, formatBytes, getFileIcon, getMimeColor } from '../services/telegram';
import './FileCard.css';

interface FileCardProps {
  file: TgFile;
  onClick: () => void;
  onDelete: () => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onClick, onDelete }) => {
  const color = getMimeColor(file.mimeType);
  const icon = getFileIcon(file.mimeType);
  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className="file-card ion-activatable" onClick={onClick}>
      <IonRippleEffect />
      <div className="file-card-thumb" style={{ background: `${color}18`, borderColor: `${color}30` }}>
        <div className="file-card-icon-wrap" style={{ background: `${color}22` }}>
          <IonIcon icon={icon} style={{ color }} className="file-card-icon" />
        </div>
        {(isImage || isVideo) && (
          <div className="file-card-media-badge" style={{ background: color }}>
            {isVideo ? 'VID' : 'IMG'}
          </div>
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
