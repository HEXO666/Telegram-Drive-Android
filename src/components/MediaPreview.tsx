import React, { useState, useEffect } from 'react';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonSpinner, IonIcon,
} from '@ionic/react';
import { closeOutline, downloadOutline } from 'ionicons/icons';
import { TgFile, downloadFile, formatBytes } from '../services/telegram';
import './MediaPreview.css';

interface Props {
  file: TgFile;
  folderId?: string;
  onClose: () => void;
}

const MediaPreview: React.FC<Props> = ({ file, folderId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let url: string;
    const load = async () => {
      try {
        const data = await downloadFile(file, folderId);
        const blob = new Blob([data.buffer as ArrayBuffer], { type: file.mimeType });
        url = URL.createObjectURL(blob);
        setObjectUrl(url);
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [file]);

  const handleDownload = () => {
    if (!objectUrl) return;
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = file.name;
    a.click();
  };

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');

  return (
    <IonModal isOpen onDidDismiss={onClose} className="preview-modal">
      <IonHeader className="preview-header">
        <IonToolbar className="preview-toolbar">
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={onClose} color="light">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle className="preview-title">
            <span>{file.name}</span>
            <span className="preview-size">{formatBytes(file.size)}</span>
          </IonTitle>
          <IonButtons slot="end">
            {objectUrl && (
              <IonButton fill="clear" onClick={handleDownload} color="primary">
                <IonIcon icon={downloadOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="preview-content">
        {loading && (
          <div className="preview-loading">
            <IonSpinner name="crescent" color="primary" />
            <p>Loading {file.name}…</p>
          </div>
        )}
        {error && (
          <div className="preview-error">
            <p>{error}</p>
          </div>
        )}
        {objectUrl && isImage && (
          <div className="preview-image-wrap">
            <img src={objectUrl} alt={file.name} className="preview-image" />
          </div>
        )}
        {objectUrl && isVideo && (
          <div className="preview-video-wrap">
            <video src={objectUrl} controls className="preview-video" playsInline />
          </div>
        )}
        {objectUrl && isAudio && (
          <div className="preview-audio-wrap">
            <div className="preview-audio-card">
              <div className="preview-audio-icon">♫</div>
              <p className="preview-audio-name">{file.name}</p>
              <audio src={objectUrl} controls className="preview-audio" />
            </div>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default MediaPreview;
