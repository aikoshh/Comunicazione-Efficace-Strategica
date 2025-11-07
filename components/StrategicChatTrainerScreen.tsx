// components/StrategicChatTrainerScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  UserProfile,
  StrategicResponse,
  ContinuedStrategicResponse,
  ChatMessage,
} from '../types';
import { COLORS } from '../constants';
import { getStrategicResponse, continueWithPersona } from '../services/geminiService';
import { useToast } from '../hooks/useToast';
import { Spinner } from './Loader';
import { SendIcon, LightbulbIcon, RetryIcon } from './Icons';
import { soundService } from '../services/soundService';
import { chatTrainerHeaderVideo, mainLogoUrl } from '../assets';

interface StrategicChatTrainerScreenProps {
  user: UserProfile;
  isPro: boolean;
  onApiKeyError: (error: string) => void;
}

const UserMessage: React.FC<{ message: ChatMessage }> = ({ message }) => (
    <div style={styles.userMessageContainer}>
        <div style={styles.userMessage}>
            {message.content}
        </div>
    </div>
);

const PersonaMessage = React.forwardRef<HTMLDivElement, { message: ChatMessage }>(
    ({ message }, ref) => (
        <div style={styles.personaMessageContainer} ref={ref}>
            <div style={styles.personaMessage}>
                {message.content}
            </div>
        </div>
    )
);


const CoachMessage: React.FC<{ message: ChatMessage; onSelect: (suggestion: string) => void; isLoading: boolean }> = ({ message, onSelect, isLoading }) => {
    const [customResponse, setCustomResponse] = useState('');

    const handleCustomSubmit = () => {
        if (!customResponse.trim() || isLoading) return;
        soundService.playClick();
        onSelect(customResponse);
    };
    
    return (
        <div style={styles.coachMessage}>
            <div style={styles.coachHeader}>
                <LightbulbIcon style={{color: COLORS.warning}} />
                <h3 style={styles.coachTitle}>Analisi Strategica del Coach</h3>
            </div>
            <p style={styles.analysisText}>{message.analysis}</p>

            {/* NEW: Custom response input */}
            <div style={styles.customResponseContainer}>
                <textarea
                    style={styles.customResponseTextarea}
                    value={customResponse}
                    onChange={(e) => setCustomResponse(e.target.value)}
                    placeholder="Oppure, scrivi qui la tua risposta personalizzata..."
                    rows={3}
                    onKeyPress={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCustomSubmit(); }}}
                    disabled={isLoading}
                />
                <button
                    onClick={handleCustomSubmit}
                    style={{...styles.customResponseButton, ...((!customResponse.trim() || isLoading) ? styles.sendButtonDisabled : {})}}
                    disabled={!customResponse.trim() || isLoading}
                    title="Invia risposta personalizzata"
                >
                    {isLoading ? <Spinner size={24} color="white"/> : <SendIcon />}
                </button>
            </div>


            {/* NEW: Label for suggestions */}
            <h4 style={styles.suggestionsTitle}>Risposte suggerite</h4>
            
            <div style={styles.suggestionsContainer}>
                {message.suggestions?.map((s, i) => (
                    <button key={i} style={styles.suggestionButton} onClick={() => onSelect(s.response)} disabled={isLoading}>
                        <span style={styles.suggestionType}>{s.type.charAt(0).toUpperCase() + s.type.slice(1)}</span>
                        <p style={styles.suggestionText}>"{s.response}"</p>
                    </button>
                ))}
            </div>
        </div>
    );
};


export const StrategicChatTrainerScreen: React.FC<StrategicChatTrainerScreenProps> = ({ user, isPro, onApiKeyError }) => {
  const [userInput, setUserInput] = useState('');
  const [context, setContext] = useState('');
  const [objective, setObjective] = useState('');
  
  const [initialUserInput, setInitialUserInput] = useState(''); // Stores the very first message
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  
  const lastPersonaMessageRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if the last message is from the coach. When it is, it means a new persona message
    // has just been added before it. We want to scroll to that new persona message.
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (lastMessage && lastMessage.role === 'coach' && lastPersonaMessageRef.current) {
        // Scroll to the top of the new persona message to make it visible.
        // The coach analysis will appear below it, requiring the user to scroll down.
        lastPersonaMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        // For user messages or initial load, scroll to the very bottom of the chat.
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);

  const handleStartSimulation = async () => {
    if (!userInput.trim() || isLoading) {
        if (!userInput.trim()) addToast("Inserisci un messaggio da analizzare.", 'error');
        return;
    }
    soundService.playClick();
    setIsLoading(true);

    try {
        const response = await getStrategicResponse(userInput, 'Strategica', [], context, objective);
        setInitialUserInput(userInput); // Save the first message

        const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'persona', content: userInput };
        const coachMsg: ChatMessage = { 
            id: `coach-${Date.now()}`, 
            role: 'coach', 
            content: '', 
            analysis: response.analysis,
            suggestions: response.suggestions
        };

        setChatHistory([userMsg, coachMsg]);
        setUserInput(''); // Clear input for next turn
    } catch (error: any) {
        console.error("Error starting simulation:", error);
        if (error.message.includes('API key')) {
            onApiKeyError(error.message);
        } else {
            addToast(error.message || "Errore durante l'analisi iniziale.", 'error');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: string) => {
    soundService.playClick();
    
    const userChoiceMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: suggestion };
    setChatHistory(prev => [...prev.filter(m => m.role !== 'coach'), userChoiceMsg]);
    setIsLoading(true);

    try {
        const response: ContinuedStrategicResponse = await continueWithPersona(
            initialUserInput,
            suggestion,
            chatHistory,
            context,
            objective
        );
        
        const personaResponseMsg: ChatMessage = { id: `persona-${Date.now()}`, role: 'persona', content: response.personaResponse };
        const coachResponseMsg: ChatMessage = {
            id: `coach-${Date.now()}`,
            role: 'coach',
            content: '',
            analysis: response.analysis,
            suggestions: response.suggestions
        };
        
        setChatHistory(prev => [...prev, personaResponseMsg, coachResponseMsg]);

    } catch (error: any) {
        console.error("Error continuing simulation:", error);
        if (error.message.includes('API key')) {
            onApiKeyError(error.message);
        } else {
            addToast(error.message || "Errore durante la simulazione.", 'error');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleReset = () => {
      soundService.playClick();
      setChatHistory([]);
      setInitialUserInput('');
      setUserInput('');
      setContext('');
      setObjective('');
      window.scrollTo(0,0);
  };

  const renderInitialForm = () => (
    <div style={styles.inputArea}>
        <div style={styles.initialInputsContainer}>
            <textarea
                style={{...styles.smallTextarea}}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Contesto (opzionale): Es. Sto parlando con un cliente scontento..."
                rows={2}
                disabled={isLoading}
            />
            <textarea
                style={{...styles.smallTextarea}}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Obiettivo (opzionale): Es. Voglio calmarlo e fissare una chiamata..."
                rows={2}
                disabled={isLoading}
            />
        </div>
        <div style={styles.mainInputWrapper}>
            <textarea
                style={styles.textarea}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Incolla o scrivi qui il messaggio per iniziare la simulazione..."
                rows={3}
                onKeyPress={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleStartSimulation(); }}}
                disabled={isLoading}
            />
            <button 
                onClick={handleStartSimulation} 
                style={{...styles.sendButton, ...((!userInput.trim() || isLoading) ? styles.sendButtonDisabled : {})}}
                disabled={!userInput.trim() || isLoading}
                title="Inizia Simulazione"
            >
                {isLoading ? <Spinner size={24} color="white"/> : <SendIcon/>}
            </button>
        </div>
    </div>
  );
  
  const renderChat = () => (
    <div style={styles.chatContainer}>
        {chatHistory.map((msg, index) => {
            // Identify the target persona message to attach the ref to.
            // This is the persona message that appears just before the latest coach message.
            const isTargetPersonaMessage = msg.role === 'persona' && 
                                           index === chatHistory.length - 2 && 
                                           chatHistory[chatHistory.length - 1]?.role === 'coach';

            switch(msg.role) {
                case 'user': return <UserMessage key={msg.id} message={msg} />;
                case 'persona': return <PersonaMessage ref={isTargetPersonaMessage ? lastPersonaMessageRef : null} key={msg.id} message={msg} />;
                case 'coach': return <CoachMessage key={msg.id} message={msg} onSelect={handleSelectSuggestion} isLoading={isLoading} />;
                default: return null;
            }
        })}
        {isLoading && chatHistory[chatHistory.length - 1]?.role !== 'coach' && (
            <div style={styles.centeredMessage}>
                <Spinner size={32} color={COLORS.primary} />
            </div>
        )}
        <div ref={chatEndRef} />
    </div>
  );

  return (
    <div style={styles.container}>
        <header style={styles.header}>
            <video src={chatTrainerHeaderVideo} style={styles.headerVideo} autoPlay muted loop playsInline />
            <div style={styles.headerOverlay} />
            <div style={styles.headerContent}>
                <h1 style={styles.title}>Chat Trainer Strategico</h1>
                <p style={styles.subtitle}>Simula una conversazione. Incolla un messaggio, definisci contesto e obiettivo, e allenati a rispondere in tempo reale.</p>
            </div>
        </header>

        <div style={styles.contentContainer} className="main-content-mobile chat-trainer-screen-mobile-scroll">
            {chatHistory.length === 0 ? renderInitialForm() : renderChat()}
        </div>
        
        {chatHistory.length > 0 && (
            <div style={styles.footerActions}>
                <button onClick={handleReset} style={styles.resetButton} disabled={isLoading}>
                    <RetryIcon />
                    Nuova Simulazione
                </button>
            </div>
        )}
        <div style={styles.logoContainer}>
            <img src={mainLogoUrl} alt="CES Coach Logo" style={styles.footerLogo} />
        </div>
    </div>
  );
};


const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', backgroundColor: COLORS.base },
  header: { position: 'relative', textAlign: 'center', padding: '32px 20px', backgroundColor: COLORS.primary },
  headerVideo: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1, opacity: 0.2 },
  headerOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(28, 62, 94, 0.7)', zIndex: 2 },
  headerContent: { zIndex: 3, position: 'relative' },
  title: { fontSize: '24px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' },
  subtitle: { fontSize: '14px', color: 'white', opacity: 0.9, maxWidth: '600px', margin: '0 auto' },
  contentContainer: { 
      flex: 1, 
      maxWidth: '800px', 
      width: '100%', 
      margin: '-40px auto 0', 
      zIndex: 4, 
      backgroundColor: COLORS.card, 
      borderRadius: '12px', 
      padding: '24px', 
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '400px',
  },
  
  // Chat styles
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1,
  },
  userMessageContainer: { display: 'flex', justifyContent: 'flex-end' },
  userMessage: { backgroundColor: COLORS.secondary, color: 'white', padding: '12px 16px', borderRadius: '18px 18px 4px 18px', maxWidth: '80%' },
  personaMessageContainer: { display: 'flex', justifyContent: 'flex-start' },
  personaMessage: { backgroundColor: COLORS.cardDark, color: COLORS.textPrimary, padding: '12px 16px', borderRadius: '18px 18px 18px 4px', maxWidth: '80%' },
  
  centeredMessage: { display: 'flex', justifyContent: 'center', padding: '20px' },
  
  coachMessage: { backgroundColor: '#FFFBEA', border: `1px solid ${COLORS.warning}`, borderRadius: '12px', padding: '16px' },
  coachHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  coachTitle: { fontSize: '16px', fontWeight: 'bold', color: COLORS.textPrimary, margin: 0 },
  analysisText: { fontSize: '15px', color: COLORS.textSecondary, margin: '0 0 16px 0', lineHeight: 1.6, borderLeft: `3px solid ${COLORS.warning}`, paddingLeft: '12px' },
  
  customResponseContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    margin: '16px 0',
  },
  customResponseTextarea: {
    flex: 1,
    resize: 'vertical',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.divider}`,
    fontSize: '15px',
    fontFamily: 'inherit',
    backgroundColor: 'white',
  },
  customResponseButton: {
    backgroundColor: COLORS.secondary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    width: '48px',
    height: '48px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  suggestionsTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    margin: '24px 0 12px 0',
    paddingBottom: '8px',
    borderBottom: `2px solid ${COLORS.secondary}`,
  },
  suggestionsContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },
  suggestionButton: {
    background: 'white',
    border: `1px solid ${COLORS.divider}`,
    borderRadius: '8px',
    padding: '12px',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  suggestionType: { color: COLORS.secondary, fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' },
  suggestionText: { color: COLORS.textPrimary, fontStyle: 'italic', fontSize: '14px', margin: 0 },
  
  // Input form styles
  inputArea: { display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'flex-end' },
  initialInputsContainer: { display: 'flex', gap: '12px', flexDirection: 'column' },
  smallTextarea: { width: '100%', resize: 'none', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' },
  mainInputWrapper: { display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%', margin: '0 auto' },
  textarea: { width: '100%', boxSizing: 'border-box', resize: 'none', padding: '12px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, fontSize: '16px', fontFamily: 'inherit' },
  sendButton: { backgroundColor: COLORS.secondary, color: 'white', border: 'none', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendButtonDisabled: { backgroundColor: '#ccc', cursor: 'not-allowed' },
  
  footerActions: {
    padding: '16px 24px',
    textAlign: 'center',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  resetButton: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '12px 24px', fontSize: '16px', fontWeight: 'bold',
    border: `1px solid ${COLORS.secondary}`, backgroundColor: 'transparent',
    color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer',
  },
  
  logoContainer: { textAlign: 'center', padding: '40px 0', backgroundColor: COLORS.base },
  footerLogo: { width: '150px', height: 'auto', opacity: 0.7 }
};