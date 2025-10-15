import React, { useState, useMemo } from 'react';
import { COLORS } from '../constants';
import { cesLogoUrl, loginBackground } from '../assets';
import type { User } from '../types';
import { soundService } from '../services/soundService';
import { Spinner } from './Loader';
import { useToast } from '../hooks/useToast';

interface LoginScreenProps {
  onLogin: (email: string, pass: string, apiKey: string) => void;
  onRegister: (newUser: Omit<User, 'password'> & { password: string }) => void;
  onGuestAccess: (apiKey: string) => void;
}

const RegistrationForm: React.FC<{
    onRegister: (newUser: Omit<User, 'password'> & { password: string }) => void;
    setView: (view: 'login') => void;
}> = ({ onRegister, setView }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const captcha = useMemo(() => {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        return {
            num1,
            num2,
            sum: num1 + num2,
        };
    }, []);

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        soundService.playClick();

        if (!firstName || !lastName || !email || !password) {
            addToast("Tutti i campi sono obbligatori.", 'error');
            return;
        }
        if (password !== confirmPassword) {
            addToast("Le password non coincidono.", 'error');
            return;
        }
        if (parseInt(captchaAnswer, 10) !== captcha.sum) {
            addToast("La verifica non è corretta. Riprova.", 'error');
            return;
        }
        if (!agreedToTerms) {
            addToast("Devi accettare la Privacy Policy e i Termini di Servizio.", 'error');
            return;
        }
        
        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            try {
                onRegister({ firstName, lastName, email, password });
                addToast("Registrazione completata! Ora puoi accedere.", 'success');
                setTimeout(() => {
                    setView('login');
                }, 2000);
            } catch (err: any) {
                addToast(err.message || "Si è verificato un errore durante la registrazione.", 'error');
            } finally {
                setIsLoading(false);
            }
        }, 1500);
    };

    return (
        <>
            <h1 style={styles.title}>Crea il tuo Account</h1>
            <p style={styles.subtitle}>e inizia subito il tuo percorso di allenamento.</p>
            <form onSubmit={handleRegisterSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                    <label htmlFor="firstName" style={styles.label}>Nome</label>
                    <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={styles.input} className="login-input" required disabled={isLoading} />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="lastName" style={styles.label}>Cognome</label>
                    <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} style={styles.input} className="login-input" required disabled={isLoading} />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="reg-email" style={styles.label}>Email</label>
                    <input type="email" id="reg-email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} className="login-input" required disabled={isLoading} />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="reg-password" style={styles.label}>Password</label>
                    <input type="password" id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} className="login-input" required disabled={isLoading} />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="confirmPassword" style={styles.label}>Conferma Password</label>
                    <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={styles.input} className="login-input" required disabled={isLoading} />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="captcha" style={styles.label}>Verifica: quanto fa {captcha.num1} + {captcha.num2}?</label>
                    <input type="number" id="captcha" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} style={styles.input} className="login-input" required disabled={isLoading} />
                </div>
                 <div style={styles.termsContainer}>
                    <input type="checkbox" id="terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} style={styles.checkbox} disabled={isLoading} />
                    <label htmlFor="terms" style={styles.termsLabel}>
                        Accetto la <a href="#" onClick={(e) => e.preventDefault()} title="Link alla Privacy Policy (non implementato)" style={styles.link}>Privacy Policy</a> e i <a href="#" onClick={(e) => e.preventDefault()} title="Link ai Termini di Servizio (non implementato)" style={styles.link}>Termini di Servizio</a>.
                    </label>
                </div>
                <button type="submit" style={styles.loginButton} className="login-button" disabled={isLoading || !agreedToTerms}>
                    {isLoading ? <Spinner color="white" /> : 'Registrati'}
                </button>
            </form>
             <button onClick={() => { soundService.playClick(); setView('login'); }} style={styles.switchLink} disabled={isLoading}>
                Hai già un account? Accedi
            </button>
        </>
    );
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onRegister, onGuestAccess }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playClick();
    setIsLoading(true);

    // Simulate network delay for better UX
    setTimeout(() => {
        try {
          onLogin(email, password, apiKey);
          // On success, component will unmount, no need to setIsLoading(false)
        } catch (err: any) {
          addToast(err.message || "Errore sconosciuto.", 'error');
          setIsLoading(false); // Only set loading to false on error
        }
    }, 1000);
  };

  const handleGuestAccessClick = async () => {
      soundService.playClick();
      onGuestAccess(apiKey);
  };
  
  const dynamicStyles = `
    .login-input::placeholder {
      color: #AAAAAA;
    }
    .login-input:focus {
        border-color: ${COLORS.secondary};
        box-shadow: 0 0 0 3px rgba(88, 166, 166, 0.2);
    }
    .login-button:hover:not(:disabled) {
        transform: translateY(-2px);
        filter: brightness(1.1);
    }
    .login-button:active:not(:disabled) {
        transform: translateY(0px) scale(0.98);
        filter: brightness(0.95);
    }
    .login-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
  `;
  
  return (
    <div style={styles.container}>
      <style>{dynamicStyles}</style>
      <div style={styles.loginBox} className="login-box-container">
        <div style={styles.logoContainer}>
            <img src={cesLogoUrl} alt="Comunicazione Efficace Strategica Logo" style={styles.logoImage} />
        </div>
        {view === 'login' ? (
           <>
            <h1 style={styles.title}>Benvenuto in<br /><strong>CES Coach</strong></h1>
            <form onSubmit={handleLoginSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label htmlFor="email" style={styles.label}>Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} className="login-input" placeholder="iltuoindirizzo@email.com" required disabled={isLoading} />
              </div>
              <div style={styles.inputGroup}>
                <label htmlFor="password" style={styles.label}>Password</label>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} className="login-input" placeholder="••••••••" required disabled={isLoading} />
              </div>
              <div style={styles.inputGroup}>
                <label htmlFor="apiKey" style={styles.label}>Chiave API Gemini (Opzionale)</label>
                <input 
                  type="password" 
                  id="apiKey" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)} 
                  style={styles.input} 
                  className="login-input" 
                  placeholder="Incolla qui la tua API Key..." 
                  disabled={isLoading} 
                />
              </div>
              <button type="submit" style={styles.loginButton} className="login-button" disabled={isLoading}>
                 {isLoading ? <Spinner color="white" /> : 'Accedi'}
              </button>
            </form>
            <button onClick={() => { soundService.playClick(); setView('register'); }} style={styles.switchLink} disabled={isLoading}>
                Non hai un account? Registrati adesso
            </button>
            <button onClick={handleGuestAccessClick} style={styles.guestLink} disabled={isLoading}>
                Accedi senza essere registrato
            </button>
          </>
        ) : (
          <RegistrationForm onRegister={onRegister} setView={setView} />
        )}
        <div style={styles.copyrightContainer}>
            <div style={styles.footerLinks}>
                <a href="#" onClick={(e) => e.preventDefault()} title="Link alla Privacy Policy (non implementato)" style={styles.footerLink}>Privacy Policy</a>
                <span style={styles.footerSeparator}>|</span>
                <a href="#" onClick={(e) => e.preventDefault()} title="Link ai Termini di Servizio (non implementato)" style={styles.footerLink}>Termini di Servizio</a>
            </div>
            <p style={styles.copyrightText}>
                CES Coach © Copyright 2025
            </p>
            <p style={styles.copyrightText}>
                cfs@centrocfs.it
            </p>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: '#000000',
    },
    loginBox: {
        backgroundColor: '#FFFFFF',
        padding: '40px',
        borderRadius: '12px',
        border: `1px solid ${COLORS.divider}`,
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        animation: 'fadeInUp 0.5s ease-out'
    },
    logoContainer: { marginBottom: '24px', display: 'flex', justifyContent: 'center' },
    logoImage: {
        width: '100%',
        maxWidth: '320px',
        height: 'auto',
    },
    title: { fontSize: '24px', color: COLORS.textPrimary, marginBottom: '32px', fontWeight: 400, lineHeight: 1.4 },
    subtitle: { fontSize: '16px', color: COLORS.textSecondary, margin: '0 auto 32px', lineHeight: 1.6 },
    form: { display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' },
    inputGroup: { display: 'flex', flexDirection: 'column', flex: 1 },
    label: { marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: COLORS.textSecondary },
    input: {
        padding: '12px 16px',
        fontSize: '16px',
        borderRadius: '8px',
        border: `1px solid ${COLORS.divider}`,
        fontFamily: 'inherit',
        backgroundColor: '#FFFFFF',
        color: COLORS.textPrimary,
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s'
    },
    termsContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginTop: '8px',
    },
    checkbox: {
        width: '18px',
        height: '18px',
    },
    termsLabel: {
        fontSize: '13px',
        color: COLORS.textSecondary,
    },
    link: {
        color: COLORS.primary,
        textDecoration: 'underline',
        fontWeight: 500
    },
    loginButton: {
        padding: '14px',
        fontSize: '16px',
        fontWeight: 'bold',
        color: 'white',
        background: COLORS.primaryGradient,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        marginTop: '8px',
        transition: 'transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease',
        minHeight: '53px'
    },
    guestLink: {
        marginTop: '16px',
        background: 'none',
        border: 'none',
        color: COLORS.textSecondary,
        textDecoration: 'underline',
        cursor: 'pointer',
        fontSize: '14px'
    },
    switchLink: {
        marginTop: '24px',
        background: 'none',
        border: 'none',
        color: COLORS.primary,
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold'
    },
    copyrightContainer: {
        marginTop: '32px',
        borderTop: `1px solid ${COLORS.divider}`,
        paddingTop: '24px',
    },
    footerLinks: {
        marginBottom: '16px',
    },
    footerLink: {
        color: COLORS.textSecondary,
        textDecoration: 'none',
        fontSize: '12px',
        margin: '0 8px'
    },
    footerSeparator: {
        color: COLORS.textSecondary,
        fontSize: '12px',
    },
    copyrightText: {
        margin: 0,
        textAlign: 'center',
        fontSize: '12px',
        color: COLORS.textSecondary,
        lineHeight: '1.6',
    }
};