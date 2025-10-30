// components/StrategicChatTrainerScreen.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, ResponseStyle } from '../types';
import { continueStrategicChat, generateChatSuggestion } from '../services/geminiService';
import { COLORS } from '../constants';
import { SendIcon, LightbulbIcon, CrownIcon } from './Icons';
import { Spinner } from './Loader';
import { useToast } from '../hooks/useToast';
import { soundService } from '../services/soundService';

interface StrategicChatTrainerScreenProps {
  user: UserProfile;
  isPro: boolean;
  onApiKeyError: (error: string) => void;
}

const SetupScreen: React.FC<{ onStart: (situation: string, goal: string, personaStyle: ResponseStyle) => void }> = ({ onStart }) => {
    const [situation, setSituation] = useState('');
    const [goal, setGoal] = useState('');
    const [personaStyle, setPersonaStyle] = useState<ResponseStyle>('Diretta');
    const { addToast } = useToast();
    
    const handleStart = () => {
        if (!situation.trim() || !goal.trim()) {
            addToast('Per favore, compila sia la situazione che l\'obiettivo.', 'error');
            return;
        }
        onStart(situation, goal, personaStyle);
    };

    return (
        <div style={styles.setupContainer}>
            <h1 style={styles.setupTitle}>Imposta la Simulazione</h1>
            <p style={styles.setupSubtitle}>Definisci il contesto per iniziare il tuo allenamento personalizzato.</p>
            <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="situation">Qual è la situazione o il messaggio che hai ricevuto?</label>
                <textarea
                    id="situation"
                    style={styles.textarea}
                    rows={4}
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    placeholder="Es: Ho ricevuto un'email da un cliente che si lamenta del ritardo di una consegna..."
                />
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="goal">Qual è il tuo obiettivo strategico in questa conversazione?</label>
                <input
                    id="goal"
                    type="text"
                    style={styles.input}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Es: Calmare il cliente e concordare una nuova data di consegna."
                />
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="persona-style">Quale stile deve avere il tuo interlocutore?</label>
                <select id="persona-style" style={styles.select} value={personaStyle} onChange={(e) => setPersonaStyle(e.target.value as ResponseStyle)}>
                    <option value="Diretta">Diretto e Franco</option>
                    <option value="Empatica">Empatico e Comprensivo</option>
                    <option value="Strategica">Strategico e Analitico</option>
                </select>
            </div>
            <button style={styles.startButton} onClick={handleStart}>Avvia Simulazione</button>
        </div>
    );
};

const ChatScreen: React.FC<{
    situation: string;
    goal: string;
    personaStyle: ResponseStyle;
    onApiKeyError: (error: string) => void;
}> = ({ situation, goal, personaStyle, onApiKeyError }) => {
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const { addToast } = useToast();
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSendMessage = useCallback(async () => {
        if (!userInput.trim() || isLoading) return;
        
        soundService.playClick();
        const newUserMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: userInput };
        const currentHistory = [...chatHistory, newUserMessage];
        setChatHistory(currentHistory);
        setUserInput('');
        setIsLoading(true);

        try {
            const { personaResponse, coachFeedback } = await continueStrategicChat(currentHistory, situation, goal, personaStyle);
            const newPersonaMessage: ChatMessage = { id: `persona-${Date.now()}`, role: 'persona', content: personaResponse };
            const newCoachMessage: ChatMessage = { id: `coach-${Date.now()}`, role: 'coach', content: coachFeedback };
            setChatHistory(prev => [...prev, newPersonaMessage, newCoachMessage]);
        } catch (error: any) {
            console.error(error);
            if (error.message.includes('API key')) {
                onApiKeyError(error.message);
            } else {
                addToast(error.message || 'Si è verificato un errore.', 'error');
            }
            // remove user message on error to allow retry
            setChatHistory(chatHistory); 
            setUserInput(userInput);
        } finally {
            setIsLoading(false);
        }
    }, [userInput, isLoading, chatHistory, situation, goal, personaStyle, addToast, onApiKeyError]);

    const handleGetSuggestion = useCallback(async () => {
        if (isSuggesting) return;
        soundService.playClick();
        setIsSuggesting(true);
        try {
            const suggestion = await generateChatSuggestion(chatHistory, situation, goal);
            setUserInput(suggestion);
        } catch (error: any) {
            console.error(error);
             if (error.message.includes('API key')) {
                onApiKeyError(error.message);
            } else {
                addToast(error.message || 'Impossibile generare il suggerimento.', 'error');
            }
        } finally {
            setIsSuggesting(false);
        }
    }, [isSuggesting, chatHistory, situation, goal, addToast, onApiKeyError]);

    return (
        <div style={styles.chatContainer}>
            <div style={styles.chatHeader}>
                <p><strong>Obiettivo:</strong> {goal}</p>
            </div>
            <div style={styles.chatArea}>
                {chatHistory.map(msg => (
                    <div key={msg.id} style={{ ...styles.messageRow, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{ ...styles.messageBubble, ...(msg.role === 'user' ? styles.userBubble : (msg.role === 'persona' ? styles.personaBubble : styles.coachBubble)) }}>
                           {msg.role === 'coach' && <LightbulbIcon style={styles.coachIcon} />}
                           <p style={styles.messageText}>{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div style={{...styles.messageRow, justifyContent: 'flex-start'}}>
                         <div style={{...styles.messageBubble, ...styles.personaBubble}}>
                            <Spinner size={20} color={COLORS.textPrimary}/>
                         </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div style={styles.inputArea}>
                <textarea
                    style={styles.chatInput}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Scrivi la tua risposta..."
                    rows={2}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    disabled={isLoading}
                />
                <button onClick={handleGetSuggestion} style={styles.suggestButton} disabled={isSuggesting || isLoading}>
                    {isSuggesting ? <Spinner size={20}/> : <LightbulbIcon />}
                </button>
                <button onClick={handleSendMessage} style={styles.sendButton} disabled={!userInput.trim() || isLoading}>
                    <SendIcon />
                </button>
            </div>
        </div>
    );
};

export const StrategicChatTrainerScreen: React.FC<StrategicChatTrainerScreenProps> = ({ user, isPro, onApiKeyError }) => {
  const [setupComplete, setSetupComplete] = useState(false);
  const [config, setConfig] = useState<{ situation: string; goal: string; personaStyle: ResponseStyle } | null>(null);

  const handleStart = (situation: string, goal: string, personaStyle: ResponseStyle) => {
    soundService.playClick();
    setConfig({ situation, goal, personaStyle });
    setSetupComplete(true);
  };

  if (!isPro) {
    return (
      <div style={styles.proWall}>
        <h2><CrownIcon /> Funzionalità PRO</h2>
        <p>Questa funzionalità è disponibile solo per gli utenti PRO. Esegui l'upgrade per sbloccare l'allenamento in tempo reale con il Chat Trainer Strategico.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {!setupComplete ? (
        <SetupScreen onStart={handleStart} />
      ) : (
        <ChatScreen
          situation={config!.situation}
          goal={config!.goal}
          personaStyle={config!.personaStyle}
          onApiKeyError={onApiKeyError}
        />
      )}
    </div>
  );
};


const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px' },
  proWall: { textAlign: 'center', padding: '50px 20px', color: COLORS.textSecondary },

  // Setup Screen
  setupContainer: { backgroundColor: COLORS.card, padding: '32px', borderRadius: '12px', border: `1px solid ${COLORS.divider}` },
  setupTitle: { fontSize: '24px', fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', margin: '0 0 8px 0' },
  setupSubtitle: { fontSize: '16px', color: COLORS.textSecondary, textAlign: 'center', margin: '0 0 32px 0' },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '15px', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '8px' },
  input: { width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${COLORS.divider}` },
  textarea: { width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, fontFamily: 'inherit', resize: 'vertical' },
  select: { width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, backgroundColor: 'white' },
  startButton: { width: '100%', padding: '14px', fontSize: '16px', fontWeight: 'bold', color: 'white', backgroundColor: COLORS.secondary, border: 'none', borderRadius: '8px', cursor: 'pointer' },

  // Chat Screen
  chatContainer: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', backgroundColor: COLORS.card, borderRadius: '12px', border: `1px solid ${COLORS.divider}`, overflow: 'hidden' },
  chatHeader: { padding: '12px 20px', borderBottom: `1px solid ${COLORS.divider}`, backgroundColor: COLORS.cardDark, color: COLORS.textSecondary, fontSize: '14px' },
  chatArea: { flex: 1, overflowY: 'auto', padding: '20px' },
  messageRow: { display: 'flex', marginBottom: '12px' },
  messageBubble: { maxWidth: '75%', padding: '10px 15px', borderRadius: '18px', lineHeight: 1.5 },
  userBubble: { backgroundColor: COLORS.secondary, color: 'white', borderBottomRightRadius: '4px' },
  personaBubble: { backgroundColor: COLORS.cardDark, color: COLORS.textPrimary, borderBottomLeftRadius: '4px' },
  coachBubble: { backgroundColor: '#FFFBEA', color: COLORS.textAccent, border: `1px solid ${COLORS.warning}`, borderBottomLeftRadius: '4px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontStyle: 'italic', fontSize: '14px' },
  coachIcon: { color: COLORS.warning, width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' },
  messageText: { margin: 0 },
  inputArea: { display: 'flex', padding: '12px', borderTop: `1px solid ${COLORS.divider}`, gap: '8px', alignItems: 'center' },
  chatInput: { flex: 1, resize: 'none', padding: '10px 15px', borderRadius: '18px', border: `1px solid ${COLORS.divider}`, fontSize: '15px', maxHeight: '100px', fontFamily: 'inherit' },
  sendButton: { background: COLORS.secondary, color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  suggestButton: { background: 'transparent', color: COLORS.warning, border: `1px solid ${COLORS.warning}`, borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
};
