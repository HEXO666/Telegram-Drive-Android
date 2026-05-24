import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonIcon, IonSpinner, IonRefresher, IonRefresherContent, IonFab,
  IonFabButton, IonAlert, IonToast, IonSearchbar,
  IonButtons, useIonActionSheet, RefresherEventDetail,
} from '@ionic/react';
import {
  cloudUploadOutline, folderOutline, addOutline, logOutOutline,
  gridOutline, listOutline, hardwareChipOutline, menuOutline, trashOutline,
} from 'ionicons/icons';
import {
  TgFile, TgFolder, getFiles, getFolders, deleteFile,
  clearSession, formatBytes, getMe,
} from '../services/telegram';
import FileCard from '../components/FileCard';
import FileListItem from '../components/FileListItem';
import MediaPreview from '../components/MediaPreview';
import FolderDrawer from '../components/FolderDrawer';
import UploadDrawer from '../components/UploadDrawer';
import './Home.css';

interface HomeProps {
  onLogout: () => void;
}

const Home: React.FC<HomeProps> = ({ onLogout }) => {
  const [folders, setFolders] = useState<TgFolder[]>([]);
  const [files, setFiles] = useState<TgFile[]>([]);
  const [activeFolder, setActiveFolder] = useState<TgFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewFile, setPreviewFile] = useState<TgFile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; color?: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TgFile | null>(null);
  const [userName, setUserName] = useState('');
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
  const [presentAction] = useIonActionSheet();

  useEffect(() => {
    loadData();
    loadUser();
  }, []);

  useEffect(() => {
    loadFiles();
  }, [activeFolder]);

  const loadUser = async () => {
    try {
      const me = await getMe() as any;
      setUserName(me.firstName || me.username || '');
    } catch {}
  };

  const loadData = async () => {
    try {
      const [f, initialFiles] = await Promise.all([getFolders(), getFiles(undefined)]);
      setFolders(f);
      setFiles(initialFiles);
    } catch (e: any) {
      setToast({ msg: e.message || 'Failed to load', color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      const f = await getFiles(activeFolder?.id);
      setFiles(f);
    } catch (e: any) {
      setToast({ msg: e.message || 'Failed to load files', color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (e: CustomEvent<RefresherEventDetail>) => {
    await loadFiles();
    e.detail.complete();
  };

  const handleUploadDone = async () => {
    setToast({ msg: 'Upload complete!', color: 'success' });
    await loadFiles();
  };

  const handleDelete = async (f: TgFile) => {
    try {
      await deleteFile(f, activeFolder?.id);
      setFiles(prev => prev.filter(x => x.id !== f.id));
      setToast({ msg: 'Deleted', color: 'medium' });
    } catch (e: any) {
      setToast({ msg: e.message || 'Delete failed', color: 'danger' });
    }
    setDeleteTarget(null);
  };

  const handleFilePress = (f: TgFile) => {
    const isMedia = f.mimeType.startsWith('image/') || f.mimeType.startsWith('video/') || f.mimeType.startsWith('audio/');
    if (isMedia) {
      setPreviewFile(f);
    } else {
      presentAction({
        header: f.name,
        subHeader: formatBytes(f.size),
        buttons: [
          { text: 'Delete', role: 'destructive', icon: trashOutline, handler: () => setDeleteTarget(f) },
          { text: 'Cancel', role: 'cancel' },
        ],
      });
    }
  };

  const handleLogout = () => {
    clearSession();
    onLogout();
  };

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <IonPage className="home-page">
      <IonHeader className="home-header" translucent>
        <IonToolbar className="home-toolbar">
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={() => setDrawerOpen(true)} className="menu-btn">
              <IonIcon icon={menuOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle className="home-title">
            <span className="folder-badge">
              <IonIcon icon={activeFolder ? folderOutline : hardwareChipOutline} />
              {activeFolder ? activeFolder.name : 'Saved Messages'}
            </span>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}>
              <IonIcon icon={viewMode === 'grid' ? listOutline : gridOutline} />
            </IonButton>
            <IonButton fill="clear" onClick={handleLogout} color="medium">
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar className="search-toolbar">
          <IonSearchbar
            value={search}
            onIonChange={e => setSearch(e.detail.value || '')}
            placeholder="Search files…"
            className="home-searchbar"
            animated
            showCancelButton="focus"
          />
        </IonToolbar>
      </IonHeader>

      <IonContent className="home-content" fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" color="primary" />
            <p>Loading files…</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={cloudUploadOutline} className="empty-icon" />
            <h3>{search ? 'No results' : 'No files yet'}</h3>
            <p>{search ? 'Try a different search' : 'Tap + to upload your first file'}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="file-grid">
            {filteredFiles.map(f => (
              <FileCard key={f.id} file={f} onClick={() => handleFilePress(f)} onDelete={() => setDeleteTarget(f)} />
            ))}
          </div>
        ) : (
          <div className="file-list">
            {filteredFiles.map(f => (
              <FileListItem key={f.id} file={f} onClick={() => handleFilePress(f)} onDelete={() => setDeleteTarget(f)} />
            ))}
          </div>
        )}
      </IonContent>

      <IonFab vertical="bottom" horizontal="end" slot="fixed" className="upload-fab">
        <IonFabButton onClick={() => setUploadDrawerOpen(true)} color="primary">
          <IonIcon icon={addOutline} />
        </IonFabButton>
      </IonFab>

      <UploadDrawer
        isOpen={uploadDrawerOpen}
        folderId={activeFolder?.id}
        onClose={() => setUploadDrawerOpen(false)}
        onDone={handleUploadDone}
      />

      <FolderDrawer
        isOpen={drawerOpen}
        folders={folders}
        activeFolder={activeFolder}
        onSelectFolder={(f) => { setActiveFolder(f); setDrawerOpen(false); }}
        onClose={() => setDrawerOpen(false)}
        userName={userName}
      />

      {previewFile && (
        <MediaPreview file={previewFile} folderId={activeFolder?.id} onClose={() => setPreviewFile(null)} />
      )}

      <IonAlert
        isOpen={!!deleteTarget}
        header="Delete file?"
        message={`"${deleteTarget?.name}" will be permanently deleted.`}
        buttons={[
          { text: 'Cancel', role: 'cancel', handler: () => setDeleteTarget(null) },
          { text: 'Delete', role: 'destructive', handler: () => { if (deleteTarget) handleDelete(deleteTarget); return true; } },
        ]}
        onDidDismiss={() => setDeleteTarget(null)}
      />

      <IonToast
        isOpen={!!toast}
        message={toast?.msg}
        color={toast?.color || 'dark'}
        duration={2500}
        onDidDismiss={() => setToast(null)}
        position="bottom"
      />
    </IonPage>
  );
};

export default Home;
