import React from 'react';
import { IonIcon, IonRippleEffect } from '@ionic/react';
import { trashOutline, eyeOutline } from 'ionicons/icons';
import { TgFile, formatBytes } from '../services/telegram';
import FileIcon, { getMimeFromFile } from './FileIcon';
import './FileCard.css';

interface FileCardProps {
  file: TgFile;
  onClick: () => void;
  onDelete: () => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onClick, onDelete }) => {
  const mime = getMimeFromFile(file.name, file.mimeType);
  const isMedia = mime.startsWith('image/') || mime.startsWith('video/');

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className="file-card ion-activatable">
      <IonRippleEffect />

      <div className="file-card-thumb">
        <FileIcon mime={mime} name={file.name} size={64} />
        {isMedia && (
          <button className="file-card-eye" onClick={onClick}>
            <IonIcon icon={eyeOutline} />
          </button>
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
