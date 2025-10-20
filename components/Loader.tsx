import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';

const DEFAULT_ESTIMATED_TIME = 15; // Default time in seconds

const QUOTES = [
    { text: "La più grande abilità di un conversatore è quella di saper tacere.", author: "Proverbio Cinese" },
    { text: "Il modo in cui comunichiamo con gli altri e con noi stessi, determina la qualità della nostra vita.", author: "Tony Robbins" },
    { text: "La comunicazione efficace è il 20% ciò che sai e l'80% come ti senti riguardo a ciò che sai.", author: "Jim Rohn" },
    { text: "Parla in modo tale che gli altri amino ascoltarti. Ascolta in modo tale che gli altri amino parlarti.", author: "Anonimo" },
    { text: "Il singolo più grande problema nella comunicazione è l'illusione che essa abbia avuto luogo.", author: "George Bernard Shaw" },
    { text: "Le parole gentili possono essere brevi e facili da dire, ma i loro echi sono veramente infiniti.", author: "Madre Teresa" },
    { text: "La comunicazione è una competenza che puoi imparare. È come andare in bicicletta. Se sei disposto a lavorarci, puoi migliorare rapidamente la qualità di ogni parte della tua vita.", author: "Brian Tracy" },
    { text: "La cosa più importante nella comunicazione è ascoltare ciò che non viene detto.", author: "Peter Drucker" },
    { text: "Per comunicare efficacemente, dobbiamo renderci conto che siamo tutti diversi nel modo in cui percepiamo il mondo e usare questa comprensione come guida.", author: "Tony Robbins" },
    { text: "L'arte della comunicazione è il linguaggio della leadership.", author: "James Humes" },
    { text: "Non parlare, a meno che tu non possa migliorare il silenzio.", author: "Jorge Luis Borges" },
    { text: "Molti tentativi di comunicare sono vanificati da parole che nascondono i pensieri invece di rivelarli.", author: "Abraham Lincoln" },
    { text: "La precisione del comunicare è la prima virtù dello stile.", author: "Aristotele" },
    { text: "L'informazione è dare; la comunicazione è ottenere.", author: "Sydney J. Harris" },
    { text: "Il silenzio è una delle arti più grandi della conversazione.", author: "William Hazlitt" },
    { text: "La saggezza è la ricompensa per una vita di ascolto, quando avresti preferito parlare.", author: "Doug Larson" },
    { text: "Quando le persone parlano, ascolta attentamente. La maggior parte delle persone non ascolta mai.", author: "Ernest Hemingway" },
    { text: "Il dialogo genuino richiede di ascoltare con l'intenzione di comprendere, non con l'intenzione di rispondere.", author: "Stephen R. Covey" },
    { text: "Le parole hanno il potere di distruggere e di guarire. Quando le parole sono sia vere che gentili, possono cambiare il nostro mondo.", author: "Buddha" },
    { text: "Parlare è argento, ascoltare è oro.", author: "Proverbio" }
];

interface LoaderProps {
  estimatedTime?: number;
}

export const FullScreenLoader: React.FC<LoaderProps> = ({ estimatedTime = DEFAULT_ESTIMATED_TIME }) => {
  const [timeLeft, setTimeLeft] = useState(estimatedTime);
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    // Select a random quote on mount
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    // Resetta il timer se il componente viene ri-renderizzato con un nuovo tempo
    setTimeLeft(estimatedTime);
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [estimatedTime]); // L'effetto si riattiva se la prop `estimatedTime` cambia

  return (
    <div style={styles.container}>
        <style>{`
            @keyframes slow-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
            }
             @keyframes rapid-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.2; }
            }
        `}</style>
      <img
        src="https://i.gifer.com/ZNeT.gif"
        alt="Analisi in corso..."
        style={styles.gif}
      />
      <p style={{...styles.text, animation: 'rapid-blink 1s infinite ease-in-out'}}>Analisi in corso...</p>
      <p style={styles.subtext}>L'AI sta elaborando la tua risposta, attendi qualche istante.</p>
      <p style={styles.warningText}>Non uscire dalla pagina!</p>

       <div style={styles.quoteContainer}>
        <p style={styles.quoteText}>"{quote.text}"</p>
        <p style={styles.quoteAuthor}>- {quote.author}</p>
      </div>

      <div style={styles.countdownContainer}>
        {timeLeft > 0 ? (
          <p style={styles.countdownText}>
            Tempo stimato: <strong style={styles.countdownNumber}>{timeLeft}s</strong>
          </p>
        ) : (
          <p style={{...styles.countdownText, animation: 'slow-blink 2s infinite ease-in-out'}}>Elaborazione quasi completata...</p>
        )}
      </div>
    </div>
  );
};

export const Spinner: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = 'currentColor' }) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <style>{`
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `}</style>
        <svg 
            style={{ animation: 'spin 1s linear infinite' }}
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M12 2V6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 18V22" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}/>
            <path d="M4.93 4.93L7.76 7.76" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}/>
            <path d="M16.24 16.24L19.07 19.07" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}/>
            <path d="M2 12H6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}/>
            <path d="M18 12H22" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}/>
            <path d="M4.93 19.07L7.76 16.24" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}/>
            <path d="M16.24 7.76L19.07 4.93" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}/>
        </svg>
    </div>
);


const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    textAlign: 'center',
    backgroundColor: COLORS.base,
  },
  gif: {
    width: '150px',
    height: '150px',
    marginBottom: '16px',
  },
  text: {
    marginTop: '16px',
    color: COLORS.textPrimary,
    fontSize: '20px',
    fontWeight: 500,
    margin: '16px 0 8px 0',
  },
  subtext: {
    color: COLORS.textSecondary,
    fontSize: '16px',
    maxWidth: '320px',
    lineHeight: 1.5,
    margin: 0,
  },
  warningText: {
    color: COLORS.error,
    fontSize: '18px',
    fontWeight: 'bold',
    marginTop: '16px',
    animation: 'rapid-blink 1.5s infinite ease-in-out',
  },
   quoteContainer: {
    marginTop: '32px',
    padding: '20px',
    borderRadius: '12px',
    backgroundColor: COLORS.primary,
    maxWidth: '500px',
    width: '90%',
    textAlign: 'center',
    borderLeft: `5px solid ${COLORS.accentBeige}`,
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  quoteText: {
    fontSize: '16px',
    fontStyle: 'italic',
    color: 'white',
    margin: '0 0 12px 0',
    lineHeight: 1.6,
  },
  quoteAuthor: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: COLORS.accentBeige,
    margin: 0,
    textAlign: 'right'
  },
  countdownContainer: {
    marginTop: '24px',
    padding: '8px 24px',
    borderRadius: '16px',
    backgroundColor: COLORS.cardDark,
    border: `1px solid ${COLORS.divider}`,
    minHeight: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  countdownText: {
    color: COLORS.textSecondary,
    fontSize: '16px',
    margin: 0,
  },
  countdownNumber: {
    color: COLORS.primary,
    fontWeight: 700,
    fontSize: '18px',
    minWidth: '30px', // Evita sfarfallio quando le cifre cambiano
    display: 'inline-block'
  },
};