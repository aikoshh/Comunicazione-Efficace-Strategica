// components/StrategicChatTrainerScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, ResponseStyle } from '../types';
import { COLORS } from '../constants';
import { SendIcon, LightbulbIcon, TargetIcon, CrownIcon, LockIcon } from './Icons';
import { continueStrategicChat, generateChatSuggestion } from '../services/geminiService';
import { useToast } from '../hooks/useToast';
import { Spinner } from './Loader';
import { soundService } from '../services/soundService';

interface StrategicChatTrainerScreenProps {
  user: UserProfile;
  isPro: boolean;
  onApiKeyError: (error: string) => void;
}

export const StrategicChatTrainerScreen: React.FC<StrategicChatTrainerScreenProps> = ({ user, isPro, onApiKeyError }) => {
  const [step, setStep] = useState<'setup' | 'chat'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { addToast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Setup state
  const [situation, setSituation] = useState('');
  const [goal, setGoal] = useState('');

  // Chat state
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [personaStyle, setPersonaStyle] = useState<ResponseStyle>('Diretta');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleStartChat = () => {
    if (!situation.trim() || !goal.trim()) {
      addToast('Per favore, compila sia la situazione che il tuo obiettivo.', 'error');
      return;
    }
    soundService.playClick();
    setStep('chat');
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    soundService.playClick();
    
    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
    };

    const newHistory = [...history, newUserMessage];
    setHistory(newHistory);
    setUserInput('');
    setIsLoading(true);

    try {
      const { personaResponse, coachFeedback } = await continueStrategicChat(newHistory, situation, goal, personaStyle);
      
      const updatedHistory = newHistory.map(msg => 
        msg.id === newUserMessage.id ? { ...msg, feedback: coachFeedback } : msg
      );

      const personaMessage: ChatMessage = {
        id: `persona-${Date.now()}`,
        role: 'persona',
        content: personaResponse,
      };

      setHistory([...updatedHistory, personaMessage]);

    } catch (error: any) {
      console.error(error);
      if (error.message.includes('API key')) {
        onApiKeyError(error.message);
      } else {
        addToast(error.message || "Si è verificato un errore sconosciuto.", 'error');
        // Restore history to before the failed attempt
        setHistory(history);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuggestResponse = async () => {
    soundService.playClick();
    setIsSuggesting(true);
    try {
      const suggestion = await generateChatSuggestion(history, situation, goal);
      setUserInput(suggestion);
    } catch (error: any) {
      console.error(error);
      if (error.message.includes('API key')) {
        onApiKeyError(error.message);
      } else {
        addToast(error.message || "Impossibile generare il suggerimento.", 'error');
      }
    } finally {
      setIsSuggesting(false);
    }
  };

  if (!isPro) {
      return (
          <div style={styles.proLockOverlay}>
              <LockIcon style={{width: 48, height: 48, color: 'white'}}/>
              <h2 style={styles.proLockTitle}>Funzionalità PRO</h2>
              <p style={styles.proLockText}>Il Chat Trainer Strategico è uno strumento avanzato disponibile solo per gli utenti PRO. Esegui l'upgrade per iniziare ad allenarti in tempo reale.</p>
          </div>
      );
  }

  if (step === 'setup') {
    return (
      <div style={styles.setupContainer}>
        <div style={styles.setupCard}>
          <h1 style={styles.title}><CrownIcon /> Chat Trainer Strategico</h1>
          <p style={styles.description}>Simula una conversazione in tempo reale e ricevi feedback istantanei dal coach AI per affinare le tue risposte.</p>
          <div style={styles.inputGroup}>
            <label style={styles.label}><TargetIcon /> Qual è la situazione?</label>
            <textarea
              style={styles.textarea}
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="Es: Ho ricevuto un'email da un cliente che si lamenta del ritardo di una consegna..."
              rows={4}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}><LightbulbIcon /> Qual è il tuo obiettivo?</label>
            <input
              type="text"
              style={styles.input}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Es: Rassicurare il cliente e concordare una nuova data senza offrire uno sconto."
            />
          </div>
          <button style={styles.startButton} onClick={handleStartChat} disabled={!situation.trim() || !goal.trim()}>Inizia la Simulazione</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.chatContainer}>
      <div style={styles.chatHeader}>
          <h2 style={styles.title}>Simulazione in Corso</h2>
          <div style={styles.contextDisplay}>
              <p><strong>Situazione:</strong> {situation}</p>
              <p><strong>Obiettivo:</strong> {goal}</p>
          </div>
      </div>

      <div style={styles.chatWindow}>
        {history.length === 0 && (
            <div style={styles.emptyChatMessage}>
                <p>La conversazione è iniziata. Scrivi il tuo primo messaggio per avviare la simulazione con il tuo interlocutore.</p>
            </div>
        )}
        {history.map((msg) => (
          <div key={msg.id} style={msg.role === 'user' ? styles.userMessageContainer : styles.personaMessageContainer}>
            <div style={msg.role === 'user' ? styles.userMessage : styles.personaMessage}>
              {msg.content}
            </div>
            {msg.role === 'user' && msg.feedback && (
              <div style={styles.coachFeedback}>
                <strong>Coach AI:</strong> {msg.feedback}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div style={styles.inputArea}>
        <div style={styles.personaStyleSelector}>
          <label>Stile Interlocutore:</label>
          {(['Diretta', 'Empatica', 'Strategica'] as ResponseStyle[]).map(style => (
              <button 
                  key={style}
                  onClick={() => setPersonaStyle(style)}
                  style={personaStyle === style ? styles.styleButtonActive : styles.styleButton}
              >{style}</button>
          ))}
        </div>
        <div style={styles.inputRow}>
            <textarea
              style={styles.chatInput}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Scrivi la tua risposta..."
              rows={2}
              onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                  }
              }}
              disabled={isLoading || isSuggesting}
            />
            <button onClick={handleSuggestResponse} style={styles.suggestButton} disabled={isLoading || isSuggesting}>
              {isSuggesting ? <Spinner size={24} /> : <LightbulbIcon />}
            </button>
            <button onClick={handleSendMessage} style={styles.sendButton} disabled={isLoading || isSuggesting || !userInput.trim()}>
              {isLoading ? <Spinner size={24} /> : <SendIcon />}
            </button>
        </div>
      </div>
    </div>
  );
};


const styles: { [key: string]: React.CSSProperties } = {
  // Setup styles
  setupContainer: {
    maxWidth: '700px',
    margin: '40px auto',
    padding: '20px',
  },
  setupCard: {
    backgroundColor: COLORS.card,
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: COLORS.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  description: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    lineHeight: 1.6,
    marginBottom: '32px',
  },
  inputGroup: {
    textAlign: 'left',
    marginBottom: '24px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.divider}`,
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.divider}`,
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  startButton: {
    padding: '14px 28px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    background: COLORS.primaryGradient,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },

  // Chat styles
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 64px)', // Full height minus header
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: COLORS.card,
  },
  chatHeader: {
      padding: '16px',
      borderBottom: `1px solid ${COLORS.divider}`,
  },
  contextDisplay: {
      fontSize: '14px',
      color: COLORS.textSecondary,
      backgroundColor: COLORS.cardDark,
      padding: '12px',
      borderRadius: '8px',
  },
  chatWindow: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    backgroundColor: COLORS.base,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  emptyChatMessage: {
      textAlign: 'center',
      color: COLORS.textSecondary,
      padding: '40px 20px',
      backgroundColor: COLORS.card,
      borderRadius: '12px',
      margin: 'auto 0'
  },
  userMessageContainer: {
      alignSelf: 'flex-end',
      width: '80%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
  },
  userMessage: {
    backgroundColor: COLORS.primary,
    color: 'white',
    padding: '12px 16px',
    borderRadius: '16px 16px 4px 16px',
    maxWidth: '100%',
    wordWrap: 'break-word',
  },
  coachFeedback: {
      width: '100%',
      fontSize: '13px',
      color: COLORS.textSecondary,
      marginTop: '6px',
      padding: '8px 12px',
      backgroundColor: COLORS.cardDark,
      borderRadius: '8px',
      borderLeft: `3px solid ${COLORS.secondary}`
  },
  personaMessageContainer: {
      alignSelf: 'flex-start',
      width: '80%',
  },
  personaMessage: {
    backgroundColor: COLORS.cardDark,
    color: COLORS.textPrimary,
    padding: '12px 16px',
    borderRadius: '16px 16px 16px 4px',
    maxWidth: '100%',
    wordWrap: 'break-word',
  },
  inputArea: {
    padding: '16px',
    borderTop: `1px solid ${COLORS.divider}`,
    backgroundColor: COLORS.card,
  },
  personaStyleSelector: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px',
      fontSize: '14px',
      fontWeight: 500,
      color: COLORS.textSecondary,
      flexWrap: 'wrap'
  },
  styleButton: {
      padding: '6px 12px',
      borderRadius: '16px',
      border: `1px solid ${COLORS.divider}`,
      backgroundColor: 'transparent',
      cursor: 'pointer'
  },
  styleButtonActive: {
      padding: '6px 12px',
      borderRadius: '16px',
      border: `1px solid ${COLORS.secondary}`,
      backgroundColor: COLORS.secondary,
      color: 'white',
      cursor: 'pointer'
  },
  inputRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px'
  },
  chatInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.divider}`,
    resize: 'none',
    fontFamily: 'inherit',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  suggestButton: {
    backgroundColor: 'transparent',
    border: `1px solid ${COLORS.secondary}`,
    color: COLORS.secondary,
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  sendButton: {
    backgroundColor: COLORS.secondary,
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },

  // Pro Lock styles
  proLockOverlay: { 
      margin: '40px auto',
      maxWidth: '700px',
      background: `linear-gradient(135deg, ${COLORS.primary} 0%, #4A148C 100%)`,
      borderRadius: '12px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      color: 'white', 
      textAlign: 'center', 
      padding: '40px' 
  },
  proLockTitle: { fontSize: '24px', fontWeight: 'bold', margin: '16px 0 8px 0' },
  proLockText: { fontSize: '16px', lineHeight: 1.6, maxWidth: '500px', margin: 0, opacity: 0.9 },
};