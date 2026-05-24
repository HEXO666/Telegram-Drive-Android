import React from 'react';
import { IonIcon, IonRippleEffect } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { TgFile, formatBytes, getFileIcon, getMimeColor } from '../services/telegram';
import './FileListItem.css';

interface Props {
  file: TgFile;
  onClick: () => void;
  onDelete: () => void;
}

const FileListItem: React.FC<Props> = ({ file, onClick, onDelete }) => {
  const color = getMimeColor(file.mimeType);
  const icon = getFileIcon(file.mimeType);
  const date = new Date(file.date * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className="file-list-item ion-activatable" onClick={onClick}>
      <IonRippleEffect />
      <div className="fli-icon-wrap" style={{ background: `${color}20` }}>
        <IonIcon icon={icon} style={{ color }} className="fli-icon" />
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
