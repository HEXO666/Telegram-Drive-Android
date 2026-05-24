import React, { useState, useEffect } from 'react';
import { IonApp, setupIonicReact } from '@ionic/react';
import { isSessionSaved, isAuthorized } from './services/telegram';
import Auth from './pages/Auth';
import Home from './pages/Home';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.always.css';
import './theme/variables.css';

setupIonicReact({ mode: 'md' });

type AppState = 'loading' | 'auth' | 'home';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('loading');

  useEffect(() => {
    const check = async () => {
      if (!isSessionSaved()) {
        setState('auth');
        return;
      }
      const ok = await isAuthorized();
      setState(ok ? 'home' : 'auth');
    };
    check();
  }, []);

  if (state === 'loading') {
    return (
      <IonApp style={{ background: '#0f1923', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#2196f3', fontSize: 48 }}>✈</div>
      </IonApp>
    );
  }

  return (
    <IonApp>
      {state === 'auth'
        ? <Auth onAuth={() => setState('home')} />
        : <Home onLogout={() => setState('auth')} />
      }
    </IonApp>
  );
};

export default App;
