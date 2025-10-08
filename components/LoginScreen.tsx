import React, { useState, useMemo } from 'react';
import { COLORS } from '../constants';
import { cesLogoUrl } from '../assets';
import type { User } from '../types';

interface LoginScreenProps {
  onLogin: (email: string, pass: string) => void;
  onRegister: (newUser: Omit<User, 'password'> & { password: string }) => void;
  onGuestAccess: () => void;
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
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
        setError('');
        setSuccess('');

        if (!firstName || !lastName || !email || !password) {
            setError("Tutti i campi sono obbligatori.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Le password non coincidono.");
            return;
        }
        if (parseInt(captchaAnswer, 10) !== captcha.sum) {
            setError("La verifica non è corretta. Riprova.");
            return;
        }

        try {
            onRegister({ firstName, lastName, email, password });
            setSuccess("Registrazione completata! Ora puoi accedere.");
            setTimeout(() => {
                setView('login');
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Si è verificato un errore durante la registrazione.");
        }
    };

    return (
        <>
            <h1 style={styles.title}>Crea il tuo Account</h1>
            <p style={styles.subtitle}>e inizia subito il tuo percorso di allenamento.</p>
            {error && <p style={styles.errorText}>{error}</p>}
            {success && <p style={styles.successText}>{success}</p>}
            <form onSubmit={handleRegisterSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                    <label htmlFor="firstName" style={styles.label}>Nome</label>
                    <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={styles.input} className="login-input" required />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="lastName" style={styles.label}>Cognome</label>
                    <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} style={styles.input} className="login-input" required />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="reg-email" style={styles.label}>Email</label>
                    <input type="email" id="reg-email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} className="login-input" required />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="reg-password" style={styles.label}>Password</label>
                    <input type="password" id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} className="login-input" required />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="confirmPassword" style={styles.label}>Conferma Password</label>
                    <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={styles.input} className="login-input" required />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="captcha" style={styles.label}>Verifica: quanto fa {captcha.num1} + {captcha.num2}?</label>
                    <input type="number" id="captcha" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} style={styles.input} className="login-input" required />
                </div>
                <button type="submit" style={styles.loginButton}>Registrati</button>
            </form>
             <button onClick={() => setView('login')} style={styles.switchLink}>
                Hai già un account? Accedi
            </button>
        </>
    );
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onRegister, onGuestAccess }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email && password) {
      try {
        onLogin(email, password);
// FIX: Added curly braces to the catch block to fix syntax error.
      } catch (err: any) {
        setError(err.message || "Errore sconosciuto.");
      }
    }
  };
  
  const placeholderStyle = `
    .login-input::placeholder {
      color: ${COLORS.textSecondary};
    }
  `;
  
  return (
    <div style={styles.container}>
      <style>{placeholderStyle}</style>
      <div style={styles.loginBox}>
        <div style={styles.logoContainer}>
            <img src={cesLogoUrl} alt="Comunicazione Efficace Strategica Logo" style={styles.logoImage} />
        </div>
        {view === 'login' ? (
           <>
            <h1 style={styles.title}>Benvenuto in<br /><strong>CES Coach</strong></h1>
             {error && <p style={styles.errorText}>{error}</p>}
            <form onSubmit={handleLoginSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label htmlFor="email" style={styles.label}>Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} className="login-input" placeholder="iltuoindirizzo@email.com" required />
              </div>
              <div style={styles.inputGroup}>
                <label htmlFor="password" style={styles.label}>Password</label>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} className="login-input" placeholder="••••••••" required />
              </div>
              <button type="submit" style={styles.loginButton}>Accedi</button>
            </form>
            <button onClick={() => setView('register')} style={styles.switchLink}>
                Non hai un account? Registrati adesso
            </button>
            <button onClick={onGuestAccess} style={styles.guestLink}>
                Accedi senza essere registrato
            </button>
          </>
        ) : (
          <RegistrationForm onRegister={onRegister} setView={setView} />
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: COLORS.base, padding: '20px' },
    loginBox: { backgroundColor: COLORS.card, padding: '40px', borderRadius: '12px', border: `1px solid ${COLORS.divider}`, width: '100%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
    logoContainer: { marginBottom: '24px', display: 'flex', justifyContent: 'center' },
    logoImage: {
        width: '100%',
        maxWidth: '250px',
        height: 'auto',
    },
    title: { fontSize: '24px', color: COLORS.textAccent, marginBottom: '32px', fontWeight: 400, lineHeight: 1.4 },
    subtitle: { fontSize: '16px', color: COLORS.textAccent, margin: '0 auto 32px', lineHeight: 1.6 },
    form: { display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' },
    inputGroup: { display: 'flex', flexDirection: 'column', flex: 1 },
    label: { marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: COLORS.textAccent },
    input: { padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, fontFamily: 'inherit', backgroundColor: COLORS.base, color: COLORS.textPrimary },
    loginButton: { padding: '14px', fontSize: '16px', fontWeight: 'bold', color: 'white', background: COLORS.primaryGradient, border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '8px', transition: 'opacity 0.2s ease' },
    guestLink: { marginTop: '16px', background: 'none', border: 'none', color: COLORS.textAccent, textDecoration: 'underline', cursor: 'pointer', fontSize: '14px' },
    switchLink: { marginTop: '24px', background: 'none', border: 'none', color: COLORS.textAccent, cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
    errorText: { color: 'white', backgroundColor: COLORS.error, padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', border: 'none', textAlign: 'center' },
    successText: { color: 'white', backgroundColor: COLORS.success, padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', border: 'none', textAlign: 'center' }
};