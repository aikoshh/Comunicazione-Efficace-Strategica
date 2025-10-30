// components/StrategicChatTrainerScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, ResponseStyle } from '../types';
import { COLORS } from '../constants';
import { continueStrategicChat, generateChatSuggestion } from '../services/geminiService';
import { useToast } from '../hooks/useToast';
import { Spinner } from './Loader';
import { SendIcon, LightbulbIcon, CloseIcon } from './Icons';
import { soundService } from '../services/soundService';

interface StrategicChatTrainerScreenProps {
  user: UserProfile;
  isPro: boolean;
  onApiKeyError: (error: string) => void;
}

export const StrategicChatTrainerScreen: React.FC<StrategicChatTrainerScreenProps> = ({ user, isPro, onApiKeyError }) => {
  // State for setup
  const [situation, setSituation] = useState('');
  const [goal, setGoal] = useState('');
  const [personaStyle, setPersonaStyle] = useState<ResponseStyle>('Diretta');
  const [isChatting, setIsChatting] = useState(false);
  
  // State for chat
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const { addToast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleStartChat = () => {
    if (!situation.trim() || !goal.trim()) {
      addToast('Per favore, definisci sia la situazione che il tuo obiettivo.', 'error');
      return;
    }
    soundService.playClick();
    const initialMessage: ChatMessage = {
      id: `coach-${Date.now()}`,
      role: 'coach',
      content: `Ok, iniziamo. L'interlocutore risponderà in modo ${personaStyle}. Qual è il tuo primo messaggio?`
    };
    setChatHistory([initialMessage]);
    setIsChatting(true);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    soundService.playClick();
    
    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
    };

    const newHistory = [...chatHistory, newUserMessage];
    setChatHistory(newHistory);
    setUserInput('');
    setIsLoading(true);

    try {
      const { personaResponse, coachFeedback } = await continueStrategicChat(newHistory, situation, goal, personaStyle);
      
      const personaMessage: ChatMessage = {
        id: `persona-${Date.now()}`,
        role: 'persona',
        content: personaResponse,
        feedback: coachFeedback,
      };
      
      setChatHistory(prev => [...prev, personaMessage]);

    } catch (error: any) {
      console.error(error);
      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        onApiKeyError(error.message);
      } else {
        addToast(error.message || 'Si è verificato un errore.', 'error');
        setUserInput(newUserMessage.content); 
        setChatHistory(chatHistory);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGetSuggestion = async () => {
    if (!isPro) {
      addToast('Questa funzionalità è riservata agli utenti PRO. Effettua l\'upgrade per sbloccarla.', 'info');
      return;
    }
    soundService.playClick();
    setIsSuggesting(true);
    try {
      const suggestion = await generateChatSuggestion(chatHistory, situation, goal);
      setUserInput(suggestion);
    } catch (error: any) {
       console.error(error);
      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        onApiKeyError(error.message);
      } else {
        addToast(error.message || 'Impossibile generare il suggerimento.', 'error');
      }
    } finally {
      setIsSuggesting(false);
    }
  };
  
  const handleReset = () => {
    soundService.playClick();
    setIsChatting(false);
    setChatHistory([]);
    setSituation('');
    setGoal('');
  };
  
  if (!isChatting) {
    return (
      <div style={styles.setupContainer}>
        <div style={styles.setupCard}>
          <h1 style={styles.setupTitle}>Chat Trainer Strategico</h1>
          <p style={styles.setupDescription}>Simula una conversazione difficile. Definisci il contesto e allenati a rispondere in tempo reale con il feedback dell'AI.</p>
          
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="situation">1. Qual è la situazione?</label>
            <textarea id="situation" value={situation} onChange={(e) => setSituation(e.target.value)} style={styles.textarea} rows={3} placeholder="Es: 'Devo comunicare al mio team una decisione impopolare che so non piacerà.'" />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="goal">2. Qual è il tuo obiettivo comunicativo?</label>
            <textarea id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} style={styles.textarea} rows={2} placeholder="Es: 'Comunicare la notizia con empatia, mantenendo la fiducia del team.'" />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>3. Che stile avrà il tuo interlocutore?</label>
            <div style={styles.personaOptions}>
              {(['Empatica', 'Diretta', 'Strategica'] as ResponseStyle[]).map(style => (
                <button key={style} onClick={() => setPersonaStyle(style)} style={{...styles.personaButton, ...(personaStyle === style ? styles.personaButtonSelected : {})}}>{style}</button>
              ))}
            </div>
          </div>
          
          <button onClick={handleStartChat} style={{...styles.startButton, ...(!situation.trim() || !goal.trim() ? styles.buttonDisabled : {})}} disabled={!situation.trim() || !goal.trim()}>Inizia la Simulazione</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.chatContainer}>
      <header style={styles.chatHeader}>
        <div>
          <p style={styles.contextLabel}><strong>Situazione:</strong> {situation}</p>
          <p style={styles.contextLabel}><strong>Obiettivo:</strong> {goal}</p>
        </div>
        <button onClick={handleReset} style={styles.resetButton}><CloseIcon/> Termina</button>
      </header>

      <main style={styles.chatArea}>
        {chatHistory.map(msg => (
          <div key={msg.id} style={{...styles.messageRow, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'}}>
            <div style={{...styles.messageBubble, ...(styles[`bubble_${msg.role}` as keyof typeof styles] || {}) }}>
              <p style={styles.messageContent}>{msg.content}</p>
              {msg.role === 'persona' && msg.feedback && (
                <div style={styles.feedbackBox}>
                  <strong>Coach AI:</strong> {msg.feedback}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{...styles.messageRow, justifyContent: 'flex-start'}}>
            <div style={{...styles.messageBubble, ...styles.bubble_persona}}>
              <Spinner size={20} color={COLORS.textPrimary} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>
      
      <footer style={styles.chatFooter}>
        <button onClick={handleGetSuggestion} style={{...styles.suggestButton, ...(!isPro ? styles.suggestButtonDisabled : {})}} disabled={isLoading || isSuggesting || !isPro} title={isPro ? "Suggerisci una risposta" : "Funzionalità PRO"}>
          {isSuggesting ? <Spinner size={20} /> : <LightbulbIcon />}
        </button>
        <textarea
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          style={styles.chatInput}
          placeholder="Scrivi la tua risposta..."
          rows={1}
          disabled={isLoading}
        />
        <button onClick={handleSendMessage} style={{...styles.sendButton, ...(!userInput.trim() ? styles.buttonDisabled : {})}} disabled={isLoading || !userInput.trim()}>
          <SendIcon />
        </button>
      </footer>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  // Setup styles
  setupContainer: { maxWidth: '700px', margin: '40px auto', padding: '20px' },
  setupCard: { backgroundColor: COLORS.card, padding: '32px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  setupTitle: { fontSize: '24px', fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: '12px' },
  setupDescription: { fontSize: '16px', color: COLORS.textSecondary, textAlign: 'center', marginBottom: '32px', lineHeight: 1.6 },
  inputGroup: { marginBottom: '24px' },
  label: { display: 'block', fontSize: '16px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px' },
  textarea: { width: '100%', padding: '12px', fontSize: '15px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, resize: 'vertical', boxSizing: 'border-box' },
  personaOptions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  personaButton: { padding: '10px 16px', fontSize: '14px', border: `1px solid ${COLORS.divider}`, backgroundColor: 'transparent', borderRadius: '8px', cursor: 'pointer' },
  personaButtonSelected: { backgroundColor: COLORS.secondary, color: 'white', borderColor: COLORS.secondary },
  startButton: { width: '100%', padding: '16px', fontSize: '18px', fontWeight: 'bold', color: 'white', backgroundColor: COLORS.primary, border: 'none', borderRadius: '8px', cursor: 'pointer' },

  // Chat styles
  chatContainer: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' },
  chatHeader: { padding: '12px 20px', borderBottom: `1px solid ${COLORS.divider}`, backgroundColor: COLORS.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  contextLabel: { margin: 0, fontSize: '14px', color: COLORS.textSecondary },
  contextText: { fontWeight: 500, color: COLORS.textPrimary },
  resetButton: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textSecondary },
  chatArea: { flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: COLORS.base },
  messageRow: { display: 'flex', marginBottom: '16px' },
  messageBubble: { maxWidth: '75%', padding: '12px 16px', borderRadius: '18px', lineHeight: 1.5 },
  messageContent: { margin: 0 },
  bubble_user: { backgroundColor: COLORS.primary, color: 'white', alignSelf: 'flex-end', borderBottomRightRadius: '4px' },
  bubble_persona: { backgroundColor: COLORS.card, color: COLORS.textPrimary, border: `1px solid ${COLORS.divider}`, borderBottomLeftRadius: '4px' },
  bubble_coach: { width: '100%', backgroundColor: 'transparent', color: COLORS.textSecondary, textAlign: 'center', fontStyle: 'italic', fontSize: '14px', padding: '8px 0' },
  feedbackBox: { marginTop: '12px', paddingTop: '12px', borderTop: `1px dashed ${COLORS.accentBeige}`, fontSize: '14px', color: COLORS.textAccent },
  chatFooter: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderTop: `1px solid ${COLORS.divider}`, backgroundColor: COLORS.card },
  chatInput: { flex: 1, padding: '12px 16px', borderRadius: '22px', border: `1px solid ${COLORS.divider}`, resize: 'none', maxHeight: '100px', overflowY: 'auto' },
  sendButton: { background: COLORS.secondary, border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' },
  suggestButton: { background: 'transparent', border: `1px solid ${COLORS.warning}`, borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: COLORS.textAccent },
  suggestButtonDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  buttonDisabled: { opacity: 0.5, cursor: 'not-allowed' },
};
