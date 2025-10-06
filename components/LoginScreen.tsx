import React, { useState } from 'react';
import { COLORS } from '../constants';
import { Logo } from './Logo';

interface LoginScreenProps {
  onLogin: (email: string, pass: string) => void;
  onGuestAccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGuestAccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.logoContainer}>
            <Logo />
        </div>
        <h1 style={styles.title}>
            <strong>Comunicazione Efficace Strategica®</strong>
        </h1>
        <p style={styles.subtitle}>Il tuo coach personale per la comunicazione.</p>
        
        <form onSubmit={handleLoginSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="iltuoindirizzo@email.com"
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" style={styles.loginButton}>Accedi</button>
        </form>

        <button onClick={onGuestAccess} style={styles.guestLink}>
          Accedi senza essere registrato
        </button>
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
        backgroundColor: COLORS.fondo,
        padding: '20px',
    },
    loginBox: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        border: '1px solid #eee',
    },
    logoContainer: {
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'center'
    },
    title: {
        fontSize: '24px',
        color: COLORS.nero,
        marginBottom: '8px',
    },
    subtitle: {
        fontSize: '16px',
        color: '#666',
        marginBottom: '32px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        textAlign: 'left',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '500',
        color: COLORS.nero,
    },
    input: {
        padding: '12px 16px',
        fontSize: '16px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontFamily: 'inherit',
    },
    loginButton: {
        padding: '14px',
        fontSize: '16px',
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: COLORS.accentoVerde,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        marginTop: '8px',
    },
    guestLink: {
        marginTop: '24px',
        background: 'none',
        border: 'none',
        color: '#555',
        textDecoration: 'underline',
        cursor: 'pointer',
        fontSize: '14px',
    }
};
