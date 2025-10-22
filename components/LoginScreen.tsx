import React, { useState, useMemo } from 'react';
import { COLORS } from '../constants';
import { mainLogoUrl } from '../assets';
import { soundService } from '../services/soundService';
import { Spinner } from './Loader';
import { useToast } from '../hooks/useToast';
import { login, register } from '../services/authService';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface LoginScreenProps {
  onGuestAccess: () => void;
}

const RegistrationForm: React.FC<{
    setView: (view: 'login') => void;
}> = ({ setView }) => {
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
        try {
            await register(email, password, firstName, lastName);
            addToast("Registrazione completata! Ora puoi accedere.", 'success');
            setTimeout(() => {
                setView('login');
            }, 1500);
        } catch (err: any) {
            addToast(err.message || "Si è verificato un errore durante la registrazione.", 'error');
        } finally {
            setIsLoading(false);
        }
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
                        Accetto la <a href="https://www.centroclinicaformazionestrategica.it/CES-APP/pdf/privacy_policy.pdf" target="_blank" rel="noopener noreferrer" title="Leggi la Privacy Policy" style={styles.link}>Privacy Policy</a> e i <a href="https://www.centroclinicaformazionestrategica.it/CES-APP/pdf/terms_of_service.pdf" target="_blank" rel="noopener noreferrer" title="Leggi i Termini di Servizio" style={styles.link}>Termini di Servizio</a>.
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

export const LoginScreen: React.FC<LoginScreenProps> = ({ onGuestAccess }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playClick();
    setIsLoading(true);

    try {
        await login(email, password);
        // On success, the auth listener in App.tsx will handle navigation
    } catch (err: any) {
        addToast("Credenziali non valide o utente non trovato.", 'error');
        setIsLoading(false);
    }
  };

  const handleGuestAccessClick = async () => {
      soundService.playClick();
      onGuestAccess();
  };
  
  const dynamicStyles = `
    .login-input::placeholder {
      color: ${COLORS.textAccent};
      opacity: 0.6;
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
            <img src={mainLogoUrl} alt="CES Coach Logo" style={styles.logoImage} />
        </div>
        {view === 'login' ? (
           <>
            <h1 style={styles.title}>Benvenuto in<br /><strong>CES Coach</strong></h1>
            <p style={styles.loginSubtitle}>il primo coach basato sull'AI che ti permette di rendere la tua comunicazione efficace e strategica in poco tempo!</p>
            <form onSubmit={handleLoginSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label htmlFor="email" style={styles.label}>Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} className="login-input" placeholder="iltuoindirizzo@email.com" required disabled={isLoading} />
              </div>
              <div style={styles.inputGroup}>
                <label htmlFor="password" style={styles.label}>Password</label>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} className="login-input" placeholder="••••••••" required disabled={isLoading} />
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
          <RegistrationForm setView={setView} />
        )}
        <div style={styles.copyrightContainer}>
            <div style={styles.footerLinks}>
                <a href="https://www.centroclinicaformazionestrategica.it/CES-APP/pdf/privacy_policy.pdf" target="_blank" rel="noopener noreferrer" title="Leggi la Privacy Policy" style={styles.footerLink}>Privacy Policy</a>
                <span style={styles.footerSeparator}>|</span>
                <a href="https://www.centroclinicaformazionestrategica.it/CES-APP/pdf/terms_of_service.pdf" target="_blank" rel="noopener noreferrer" title="Leggi i Termini di Servizio" style={styles.footerLink}>Termini di Servizio</a>
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
        backgroundColor: COLORS.card,
        padding: '40px',
        borderRadius: '12px',
        border: `1px solid ${COLORS.divider}`,
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center',
        boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
        animation: 'fadeInUp 0.5s ease-out'
    },
    logoContainer: { marginBottom: '24px', display: 'flex', justifyContent: 'center' },
    logoImage: {
        width: '100%',
        maxWidth: '320px',
        height: 'auto',
    },
    title: { fontSize: '24px', color: COLORS.textAccent, marginBottom: '8px', fontWeight: 400, lineHeight: 1.4 },
    loginSubtitle: {
        fontSize: '16px',
        color: COLORS.textAccent,
        lineHeight: 1.6,
        marginBottom: '32px',
        marginTop: '0',
    },
    subtitle: { fontSize: '16px', color: COLORS.textAccent, margin: '0 auto 32px', lineHeight: 1.6 },
    form: { display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' },
    inputGroup: { display: 'flex', flexDirection: 'column', flex: 1 },
    label: { marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: COLORS.textAccent },
    input: {
        padding: '12px 16px',
        fontSize: '16px',
        borderRadius: '8px',
        border: `1px solid ${COLORS.divider}`,
        fontFamily: 'inherit',
        backgroundColor: COLORS.card,
        color: COLORS.textAccent,
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
        color: COLORS.textAccent,
    },
    link: {
        color: COLORS.textAccent,
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
        color: COLORS.textAccent,
        textDecoration: 'underline',
        cursor: 'pointer',
        fontSize: '14px'
    },
    switchLink: {
        marginTop: '24px',
        background: 'none',
        border: 'none',
        color: COLORS.textAccent,
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
        color: COLORS.textAccent,
        textDecoration: 'none',
        fontSize: '12px',
        margin: '0 8px'
    },
    footerSeparator: {
        color: COLORS.textAccent,
        fontSize: '12px',
    },
    copyrightText: {
        margin: 0,
        textAlign: 'center',
        fontSize: '12px',
        color: COLORS.textAccent,
        lineHeight: '1.6',
    }
};