// components/StrategicChatTrainerScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile, StrategicResponse, ChatMessage, ResponseStyle } from '../types';
import { COLORS } from '../constants';
import { SendIcon, LightbulbIcon, BackIcon, CrownIcon } from './Icons';
import { getStrategicSuggestions, continueStrategicChat } from '../services/geminiService';
import { FullScreenLoader, Spinner } from './Loader';
import { useToast } from '../hooks/useToast';
import { soundService } from '../services/soundService';
import { chatTrainerHeaderVideo } from '../assets';

interface StrategicChatTrainerScreenProps {
  user: UserProfile;
  isPro: boolean;
  onApiKeyError: (error: string) => void;
}

const SuggestionCard: React.FC<{ type: string, response: string }> = ({ type, response }) => (
    <div style={styles.suggestionCard}>
        <h4 style={styles.suggestionTitle}>{type.charAt(0).toUpperCase() + type.slice(1)}</h4>
        <p style={styles.suggestionText}>"{response}"</p>
    </div>
);

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => (
    <div style={message.role === 'user' ? styles.userMessageContainer : styles.personaMessageContainer}>
        <div style={{ ...styles.messageBubble, ...(message.role === 'user' ? styles.userMessageBubble : styles.personaMessageBubble) }}>
            {message.content}
        </div>
        {message.role === 'user' && message.feedback && (
            <div style={styles.coachFeedback}>
                <LightbulbIcon style={{ color: COLORS.warning, flexShrink: 0 }} />
                <div>
                    <strong>Coach:</strong> {message.feedback}
                </div>
            </div>
        )}
    </div>
);

export const StrategicChatTrainerScreen: React.FC<StrategicChatTrainerScreenProps> = ({ user, isPro, onApiKeyError }) => {
  const [situation, setSituation] = useState('');
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [suggestions, setSuggestions] = useState<StrategicResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isChatting, setIsChatting] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [personaStyle, setPersonaStyle] = useState<ResponseStyle>('Empatica');
  
  const { addToast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleGetSuggestions = async () => {
    if (!situation.trim() || !goal.trim()) {
      addToast('Per favore, compila almeno la situazione e l\'obiettivo.', 'error');
      return;
    }
    soundService.playClick();
    setIsLoading(true);
    try {
      const result = await getStrategicSuggestions(situation, goal, context);
      setSuggestions(result);
    } catch (error: any) {
      console.error(error);
      if (error.message.includes('API key')) {
        onApiKeyError(error.message);
      } else {
        addToast(error.message || 'Si è verificato un errore sconosciuto.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = () => {
    soundService.playClick();
    setChatHistory([
      { id: 'start', role: 'persona', content: situation },
    ]);
    setIsChatting(true);
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isLoading) return;
    soundService.playClick();
    
    const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: userMessage };
    const currentHistory = [...chatHistory, newUserMessage];
    setChatHistory(currentHistory);
    setUserMessage('');
    setIsLoading(true);

    try {
      const { personaResponse, coachFeedback } = await continueStrategicChat(currentHistory, situation, goal, personaStyle);
      
      setChatHistory(prev => {
        const updatedHistory = [...prev];
        const lastMessage = updatedHistory[updatedHistory.length - 1];
        if (lastMessage.role === 'user') {
          lastMessage.feedback = coachFeedback;
        }
        return [...updatedHistory, { id: Date.now().toString() + '-persona', role: 'persona', content: personaResponse }];
      });

    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'Errore durante la chat.', 'error');
      setChatHistory(prev => prev.slice(0, prev.length -1)); // remove user message on error
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    soundService.playClick();
    setSituation('');
    setGoal('');
    setContext('');
    setSuggestions(null);
    setIsChatting(false);
    setChatHistory([]);
  };

  if (!isPro) {
    return (
      <div style={styles.proLockContainer}>
        <CrownIcon style={{ width: 48, height: 48, color: COLORS.warning, marginBottom: '16px' }}/>
        <h2 style={styles.proLockTitle}>Funzionalità PRO</h2>
        <p style={styles.proLockText}>Il Chat Trainer Strategico è uno strumento avanzato per gli utenti PRO. Esegui l'upgrade per accedere a questa e a molte altre funzionalità esclusive!</p>
      </div>
    );
  }

  if (isLoading && !isChatting) {
    return <FullScreenLoader estimatedTime={20} />;
  }

  return (
    <div style={styles.container}>
       <header style={styles.header}>
        <video src={chatTrainerHeaderVideo} style={styles.headerVideo} autoPlay muted loop playsInline />
        <div style={styles.headerOverlay} />
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Chat Trainer Strategico</h1>
          <p style={styles.subtitle}>Allenati in tempo reale. Incolla un messaggio ricevuto e ottieni suggerimenti strategici su come rispondere.</p>
        </div>
      </header>

       <main style={styles.mainContent}>
        {!suggestions && !isChatting && (
          <form onSubmit={(e) => { e.preventDefault(); handleGetSuggestions(); }} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="situation">1. Messaggio ricevuto o situazione</label>
              <textarea id="situation" value={situation} onChange={e => setSituation(e.target.value)} rows={4} style={styles.textarea} placeholder="Es: 'La tua proposta è interessante, ma il costo è troppo alto.'" />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="goal">2. Il tuo obiettivo</label>
              <input id="goal" type="text" value={goal} onChange={e => setGoal(e.target.value)} style={styles.input} placeholder="Es: 'Spostare il focus sul valore e non sul prezzo.'" />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="context">3. Contesto aggiuntivo (opzionale)</label>
              <input id="context" type="text" value={context} onChange={e => setContext(e.target.value)} style={styles.input} placeholder="Es: 'È un cliente importante ma molto attento al budget.'" />
            </div>
            <button type="submit" style={styles.actionButton} disabled={isLoading}>
              {isLoading ? <Spinner color="white" size={20}/> : 'Genera Suggerimenti'}
            </button>
          </form>
        )}

        {suggestions && !isChatting && (
          <div style={styles.suggestionsContainer}>
            <button onClick={handleReset} style={styles.resetButton}><BackIcon/> Nuova Simulazione</button>
            <div style={styles.analysisSection}>
              <h3 style={styles.sectionTitle}><LightbulbIcon/> Analisi Strategica</h3>
              <p>{suggestions.analysis}</p>
            </div>
            <h3 style={styles.sectionTitle}>Opzioni di Risposta</h3>
            <div style={styles.suggestionsGrid}>
              {suggestions.suggestions.map(s => <SuggestionCard key={s.type} type={s.type} response={s.response} />)}
            </div>
            <div style={styles.chatStartContainer}>
              <p>Vuoi allenarti a rispondere? Avvia una simulazione di chat.</p>
              <button onClick={handleStartChat} style={styles.actionButton}>Avvia Chat</button>
            </div>
          </div>
        )}

        {isChatting && (
          <div style={styles.chatContainer}>
            <div style={styles.chatHeader}>
              <h3 style={styles.sectionTitle}>Simulazione di Chat</h3>
              <button onClick={handleReset} style={styles.resetButton}><BackIcon/> Termina Chat</button>
            </div>
            <div style={styles.chatHistory}>
              {chatHistory.map(msg => <ChatBubble key={msg.id} message={msg} />)}
              <div ref={chatEndRef} />
            </div>
            <div style={styles.chatInputArea}>
              <div style={styles.personaStyleSelector}>
                <label style={styles.styleLabel}>Stile Risposta Interlocutore:</label>
                <div>
                  {(['Empatica', 'Diretta', 'Strategica'] as ResponseStyle[]).map(style => (
                    <button
                      key={style}
                      onClick={() => setPersonaStyle(style)}
                      style={personaStyle === style ? styles.styleButtonActive : styles.styleButton}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.inputWrapper}>
                <input 
                  type="text" 
                  value={userMessage} 
                  onChange={e => setUserMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Scrivi la tua risposta..."
                  style={styles.chatInput}
                  disabled={isLoading}
                />
                <button onClick={handleSendMessage} style={styles.sendButton} disabled={isLoading || !userMessage.trim()}>
                  {isLoading ? <Spinner size={20}/> : <SendIcon/>}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { backgroundColor: COLORS.base, minHeight: 'calc(100vh - 64px)' },
    header: { position: 'relative', height: '250px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
    headerVideo: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 },
    headerOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(28, 62, 94, 0.7)', zIndex: 2 },
    headerContent: { zIndex: 3, padding: '20px', maxWidth: '700px' },
    title: { fontSize: '28px', fontWeight: 'bold', margin: '0 0 12px 0' },
    subtitle: { fontSize: '16px', lineHeight: 1.6, opacity: 0.9, margin: 0 },
    mainContent: { maxWidth: '800px', margin: '-80px auto 40px', backgroundColor: COLORS.card, borderRadius: '12px', padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', position: 'relative', zIndex: 4 },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: {},
    label: { display: 'block', fontSize: '15px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px' },
    input: { width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${COLORS.divider}` },
    textarea: { width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' },
    actionButton: { padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', color: 'white', background: COLORS.primaryGradient, border: 'none', borderRadius: '8px', cursor: 'pointer', alignSelf: 'flex-start', minHeight: '48px' },
    suggestionsContainer: { animation: 'fadeIn 0.5s ease' },
    analysisSection: { background: COLORS.cardDark, padding: '20px', borderRadius: '8px', marginBottom: '24px' },
    sectionTitle: { fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 12px 0' },
    suggestionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' },
    suggestionCard: { border: `1px solid ${COLORS.divider}`, padding: '16px', borderRadius: '8px' },
    suggestionTitle: { margin: '0 0 8px 0', fontSize: '16px', color: COLORS.secondary, fontWeight: 'bold' },
    suggestionText: { margin: 0, fontStyle: 'italic', color: COLORS.textSecondary },
    chatStartContainer: { textAlign: 'center', padding: '20px', borderTop: `1px solid ${COLORS.divider}`, marginTop: '24px' },
    resetButton: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: `1px solid ${COLORS.divider}`, padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: COLORS.textSecondary },
    chatContainer: {},
    chatHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: `1px solid ${COLORS.divider}`, marginBottom: '16px' },
    chatHistory: { height: '400px', overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '16px', background: COLORS.cardDark, borderRadius: '8px' },
    personaMessageContainer: { display: 'flex', justifyContent: 'flex-start' },
    userMessageContainer: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
    messageBubble: { padding: '12px 16px', borderRadius: '18px', maxWidth: '75%', lineHeight: 1.5 },
    personaMessageBubble: { background: COLORS.divider, color: COLORS.textPrimary, borderBottomLeftRadius: '4px' },
    userMessageBubble: { background: COLORS.primary, color: 'white', borderBottomRightRadius: '4px' },
    coachFeedback: { display: 'flex', gap: '8px', fontSize: '13px', color: COLORS.textSecondary, fontStyle: 'italic', padding: '8px 12px', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', marginTop: '8px', maxWidth: '75%' },
    chatInputArea: { borderTop: `1px solid ${COLORS.divider}`, paddingTop: '16px', marginTop: '16px' },
    personaStyleSelector: { marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
    styleLabel: { fontSize: '14px', fontWeight: 500 },
    styleButton: { background: 'transparent', border: `1px solid ${COLORS.divider}`, padding: '6px 12px', borderRadius: '16px', cursor: 'pointer' },
    styleButtonActive: { background: COLORS.secondary, border: `1px solid ${COLORS.secondary}`, color: 'white', padding: '6px 12px', borderRadius: '16px', cursor: 'pointer' },
    inputWrapper: { display: 'flex', gap: '10px' },
    chatInput: { flex: 1, padding: '12px 16px', borderRadius: '24px', border: `1px solid ${COLORS.divider}` },
    sendButton: { background: COLORS.secondary, border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' },
    proLockContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px', minHeight: 'calc(100vh - 128px)'},
    proLockTitle: { fontSize: '24px', fontWeight: 'bold' },
    proLockText: { fontSize: '16px', color: COLORS.textSecondary, maxWidth: '500px', lineHeight: 1.6 },
};
