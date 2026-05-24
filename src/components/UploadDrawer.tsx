import React, { useState, useRef } from 'react';
import {
  IonModal, IonContent, IonButton, IonIcon, IonSpinner, IonProgressBar,
} from '@ionic/react';
import { cloudUploadOutline, closeOutline, addOutline, trashOutline } from 'ionicons/icons';
import { uploadFile, formatBytes } from '../services/telegram';
import FileIcon, { getMimeFromFile } from './FileIcon';
import './UploadDrawer.css';

interface SelectedFile {
  id: string;
  file: File;
  mime: string;
  preview: string | null;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

interface Props {
  isOpen: boolean;
  folderId?: string;
  onClose: () => void;
  onDone: () => void;
}

async function generatePreview(file: File, mime: string): Promise<string | null> {
  if (mime.startsWith('image/')) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }
  if (mime.startsWith('video/')) {
    return new Promise(resolve => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      const url = URL.createObjectURL(file);
      video.src = url;
      video.currentTime = 1;
      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160; canvas.height = 90;
        canvas.getContext('2d')?.drawImage(video, 0, 0, 160, 90);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      });
      video.addEventListener('error', () => { URL.revokeObjectURL(url); resolve(null); });
    });
  }
  return null;
}

const UploadDrawer: React.FC<Props> = ({ isOpen, folderId, onClose, onDone }) => {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (uploading) return;
    setFiles([]);
    onClose();
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    const newFiles: SelectedFile[] = await Promise.all(
      picked.map(async (f) => {
        const mime = getMimeFromFile(f.name, f.type);
        return {
          id: `${f.name}_${f.size}_${Date.now()}_${Math.random()}`,
          file: f,
          mime,
          preview: await generatePreview(f, mime),
          status: 'pending' as const,
          progress: 0,
        };
      })
    );

    setFiles(prev => [...prev, ...newFiles]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadAll = async () => {
    const pending = files.filter(f => f.status === 'pending');
    if (!pending.length) return;
    setUploading(true);

    for (const sf of pending) {
      setFiles(prev => prev.map(f => f.id === sf.id ? { ...f, status: 'uploading' } : f));
      try {
        await uploadFile(sf.file, folderId, (progress: number) => {
          setFiles(prev => prev.map(f => f.id === sf.id ? { ...f, progress } : f));
        });
        setFiles(prev => prev.map(f => f.id === sf.id ? { ...f, status: 'done', progress: 100 } : f));
      } catch (err: any) {
        setFiles(prev => prev.map(f => f.id === sf.id
          ? { ...f, status: 'error', error: err.message || 'Failed' } : f));
      }
    }

    setUploading(false);
    const allDone = files.every(f => f.status === 'done' || f.status === 'error');
    if (allDone) {
      setTimeout(() => { setFiles([]); onDone(); onClose(); }, 800);
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const doneCount = files.filter(f => f.status === 'done').length;
  const totalCount = files.length;

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleClose}
      className="upload-drawer-modal"
      initialBreakpoint={0.92}
      breakpoints={[0, 0.92, 1]}
      handle
    >
      <IonContent className="upload-drawer-content">
        <div className="ud-header">
          <div className="ud-header-left">
            <IonIcon icon={cloudUploadOutline} className="ud-header-icon" />
            <div>
              <h2 className="ud-title">Upload Files</h2>
              {totalCount > 0 && (
                <p className="ud-subtitle">{doneCount}/{totalCount} uploaded</p>
              )}
            </div>
          </div>
          <button className="ud-close-btn" onClick={handleClose} disabled={uploading}>
            <IonIcon icon={closeOutline} />
          </button>
        </div>

        <div className="ud-dropzone" onClick={() => inputRef.current?.click()}>
          <IonIcon icon={addOutline} className="ud-dropzone-icon" />
          <p className="ud-dropzone-label">Tap to select files</p>
          <p className="ud-dropzone-hint">Images, videos, PDFs, documents…</p>
        </div>
        <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFilePick} />

        {files.length > 0 && (
          <div className="ud-grid">
            {files.map(sf => (
              <div key={sf.id} className={`ud-card ud-card--${sf.status}`}>
                <div className="ud-thumb">
                  {sf.preview ? (
                    <img src={sf.preview} alt={sf.file.name} className="ud-thumb-img" />
                  ) : (
                    <div className="ud-thumb-icon">
                      <FileIcon mime={sf.mime} name={sf.file.name} size={48} />
                    </div>
                  )}

                  {sf.status === 'uploading' && (
                    <div className="ud-overlay ud-overlay--uploading">
                      <IonSpinner name="crescent" color="light" />
                    </div>
                  )}
                  {sf.status === 'done' && (
                    <div className="ud-overlay ud-overlay--done">
                      <span className="ud-check">✓</span>
                    </div>
                  )}
                  {sf.status === 'error' && (
                    <div className="ud-overlay ud-overlay--error">
                      <span className="ud-error-icon">✕</span>
                    </div>
                  )}

                  {sf.status === 'pending' && (
                    <button className="ud-remove-btn" onClick={() => removeFile(sf.id)}>
                      <IonIcon icon={trashOutline} />
                    </button>
                  )}
                </div>

                {sf.status === 'uploading' && (
                  <IonProgressBar value={sf.progress / 100} color="primary" className="ud-progress" />
                )}

                <div className="ud-card-info">
                  <p className="ud-card-name">{sf.file.name || 'Unknown file'}</p>
                  <p className="ud-card-size">
                    {sf.status === 'uploading' ? `${sf.progress}%` :
                     sf.status === 'done' ? 'Uploaded ✓' :
                     sf.status === 'error' ? (sf.error || 'Error') :
                     formatBytes(sf.file.size)}
                  </p>
                </div>
              </div>
            ))}

            <div className="ud-card ud-card--add" onClick={() => inputRef.current?.click()}>
              <div className="ud-thumb ud-thumb--add">
                <IonIcon icon={addOutline} />
              </div>
              <div className="ud-card-info">
                <p className="ud-card-name">Add more</p>
              </div>
            </div>
          </div>
        )}

        {pendingCount > 0 && (
          <div className="ud-footer">
            <IonButton
              expand="block"
              className="ud-upload-btn"
              onClick={uploadAll}
              disabled={uploading}
            >
              {uploading
                ? <><IonSpinner name="crescent" />&nbsp; Uploading…</>
                : `Upload ${pendingCount} file${pendingCount > 1 ? 's' : ''}`
              }
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default UploadDrawer;
