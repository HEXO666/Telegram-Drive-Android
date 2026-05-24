import React from 'react';
import { IonIcon, IonRippleEffect } from '@ionic/react';
import { trashOutline, eyeOutline } from 'ionicons/icons';
import { TgFile, formatBytes } from '../services/telegram';
import FileIcon, { getMimeFromFile } from './FileIcon';
import './FileListItem.css';

interface Props {
  file: TgFile;
  onClick: () => void;
  onDelete: () => void;
}

const FileListItem: React.FC<Props> = ({ file, onClick, onDelete }) => {
  const mime = getMimeFromFile(file.name, file.mimeType);
  const isMedia = mime.startsWith('image/') || mime.startsWith('video/');
  const date = new Date(file.date * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleEye = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div className="file-list-item ion-activatable">
      <IonRippleEffect />

      <div className="fli-icon-wrap">
        <FileIcon mime={mime} name={file.name} size={44} />
      </div>

      <div className="fli-info">
        <p className="fli-name">{file.name}</p>
        <p className="fli-meta">{formatBytes(file.size)} · {date}</p>
      </div>

      {isMedia && (
        <button className="fli-eye" onClick={handleEye}>
          <IonIcon icon={eyeOutline} />
        </button>
      )}

      <button className="fli-delete" onClick={handleDelete}>
        <IonIcon icon={trashOutline} />
      </button>
    </div>
  );
};

export default FileListItem;
