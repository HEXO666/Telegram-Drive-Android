import React from 'react';
import {
  IonModal, IonContent, IonIcon, IonRippleEffect,
} from '@ionic/react';
import {
  hardwareChipOutline, folderOutline, paperPlane, personCircleOutline,
} from 'ionicons/icons';
import { TgFolder } from '../services/telegram';
import './FolderDrawer.css';

interface Props {
  isOpen: boolean;
  folders: TgFolder[];
  activeFolder: TgFolder | null;
  onSelectFolder: (f: TgFolder | null) => void;
  onClose: () => void;
  userName: string;
}

const FolderDrawer: React.FC<Props> = ({ isOpen, folders, activeFolder, onSelectFolder, onClose, userName }) => {
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="folder-drawer-modal"
      initialBreakpoint={0.75}
      breakpoints={[0, 0.5, 0.75, 1]}
      handle
    >
      <IonContent className="drawer-content">
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-logo">
            <IonIcon icon={paperPlane} />
          </div>
          <div>
            <h2 className="drawer-title">Telegram Drive</h2>
            {userName && <p className="drawer-user">{userName}</p>}
          </div>
        </div>

        <div className="drawer-divider" />

        {/* Saved Messages */}
        <div
          className={`drawer-item ion-activatable ${activeFolder === null ? 'drawer-item-active' : ''}`}
          onClick={() => onSelectFolder(null)}
        >
          <IonRippleEffect />
          <div className="drawer-item-icon" style={{ background: 'rgba(33,150,243,0.15)' }}>
            <IonIcon icon={hardwareChipOutline} style={{ color: '#2196f3' }} />
          </div>
          <span className="drawer-item-label">Saved Messages</span>
        </div>

        {/* Folders */}
        {folders.length > 0 && (
          <>
            <p className="drawer-section-label">FOLDERS</p>
            {folders.map(f => (
              <div
                key={f.id}
                className={`drawer-item ion-activatable ${activeFolder?.id === f.id ? 'drawer-item-active' : ''}`}
                onClick={() => onSelectFolder(f)}
              >
                <IonRippleEffect />
                <div className="drawer-item-icon" style={{ background: 'rgba(255,152,0,0.15)' }}>
                  <IonIcon icon={folderOutline} style={{ color: '#FF9800' }} />
                </div>
                <span className="drawer-item-label">{f.name}</span>
              </div>
            ))}
          </>
        )}
      </IonContent>
    </IonModal>
  );
};

export default FolderDrawer;
