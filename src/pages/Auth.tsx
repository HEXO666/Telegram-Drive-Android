import React, { useState } from 'react';
import {
  IonPage, IonContent, IonInput, IonButton, IonText, IonSpinner,
  IonIcon, IonItem, IonLabel, IonNote,
} from '@ionic/react';
import { paperPlane, phonePortraitOutline, keyOutline, lockClosedOutline } from 'ionicons/icons';
import { sendCode, signIn, signInWithPassword } from '../services/telegram';
import './Auth.css';

type Step = 'phone' | 'code' | 'password';

interface AuthProps {
  onAuth: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuth }) => {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await sendCode(phone.trim());
      setPhoneCodeHash(result.phoneCodeHash);
      setStep('code');
    } catch (e: any) {
      setError(e.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      await signIn(phone.trim(), phoneCodeHash, code.trim());
      onAuth();
    } catch (e: any) {
      if (e.message?.includes('SESSION_PASSWORD_NEEDED') || e.errorMessage === 'SESSION_PASSWORD_NEEDED') {
        setStep('password');
      } else {
        setError(e.message || 'Invalid code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    try {
      await signInWithPassword(password.trim());
      onAuth();
    } catch (e: any) {
      setError(e.message || 'Wrong password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="auth-content" fullscreen>
        <div className="auth-container">
          {/* Logo section */}
          <div className="auth-logo-section">
            <div className="auth-logo-circle">
              <IonIcon icon={paperPlane} className="auth-logo-icon" />
            </div>
            <h1 className="auth-title">Telegram Drive</h1>
            <p className="auth-subtitle">Your Telegram as infinite cloud storage</p>
          </div>

          {/* Card */}
          <div className="auth-card">
            {step === 'phone' && (
              <>
                <div className="auth-step-header">
                  <IonIcon icon={phonePortraitOutline} className="auth-step-icon" />
                  <h2>Enter your phone</h2>
                  <p>We'll send you a verification code</p>
                </div>
                <div className="auth-input-wrapper">
                  <IonInput
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={phone}
                    onIonChange={e => setPhone(e.detail.value || '')}
                    className="auth-input"
                    fill="outline"
                    label="Phone number"
                    labelPlacement="floating"
                    onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                  />
                </div>
                {error && <IonText color="danger"><p className="auth-error">{error}</p></IonText>}
                <IonButton
                  expand="block"
                  className="auth-button"
                  onClick={handleSendCode}
                  disabled={loading || !phone.trim()}
                >
                  {loading ? <IonSpinner name="crescent" /> : 'Send Code'}
                </IonButton>
              </>
            )}

            {step === 'code' && (
              <>
                <div className="auth-step-header">
                  <IonIcon icon={keyOutline} className="auth-step-icon" />
                  <h2>Enter the code</h2>
                  <p>Sent to {phone}</p>
                </div>
                <div className="auth-input-wrapper">
                  <IonInput
                    type="number"
                    placeholder="12345"
                    value={code}
                    onIonChange={e => setCode(e.detail.value || '')}
                    className="auth-input auth-code-input"
                    fill="outline"
                    label="Verification code"
                    labelPlacement="floating"
                    onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                  />
                </div>
                {error && <IonText color="danger"><p className="auth-error">{error}</p></IonText>}
                <IonButton
                  expand="block"
                  className="auth-button"
                  onClick={handleSignIn}
                  disabled={loading || !code.trim()}
                >
                  {loading ? <IonSpinner name="crescent" /> : 'Verify'}
                </IonButton>
                <IonButton fill="clear" expand="block" onClick={() => { setStep('phone'); setError(''); }}>
                  Change number
                </IonButton>
              </>
            )}

            {step === 'password' && (
              <>
                <div className="auth-step-header">
                  <IonIcon icon={lockClosedOutline} className="auth-step-icon" />
                  <h2>Two-step verification</h2>
                  <p>Enter your cloud password</p>
                </div>
                <div className="auth-input-wrapper">
                  <IonInput
                    type="password"
                    placeholder="Password"
                    value={password}
                    onIonChange={e => setPassword(e.detail.value || '')}
                    className="auth-input"
                    fill="outline"
                    label="Password"
                    labelPlacement="floating"
                    onKeyDown={e => e.key === 'Enter' && handlePassword()}
                  />
                </div>
                {error && <IonText color="danger"><p className="auth-error">{error}</p></IonText>}
                <IonButton
                  expand="block"
                  className="auth-button"
                  onClick={handlePassword}
                  disabled={loading || !password.trim()}
                >
                  {loading ? <IonSpinner name="crescent" /> : 'Sign In'}
                </IonButton>
              </>
            )}
          </div>

          <p className="auth-footer">
            Your keys stay on your device. No third-party servers.
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Auth;
