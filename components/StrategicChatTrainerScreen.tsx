// components/StrategicChatTrainerScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile, ChatMessage, ResponseStyle } from '../types';
import { COLORS } from '../constants';
import { SendIcon, LightbulbIcon, CrownIcon } from './Icons';
import { continueStrategicChat } from '../services/geminiService';
import { soundService } from '../services/soundService';
import { Spinner } from './Loader';
import { useToast } from '../hooks/useToast';
import { chatTrainerHeaderVideo } from '../assets';

interface StrategicChatTrainerScreenProps {
  user: UserProfile;
  isPro: boolean;
  onApiKeyError: (error: string) => void;
}

const ChatMessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const [showFeedback, setShowFeedback] = useState(false);
    const isUser = message.role === 'user';
    const isPersona = message.role === 'persona';
    const isCoach = message.role === 'coach';

    const bubbleStyle: React.CSSProperties = {
        ...styles.messageBubble,
        ...(isUser ? styles.userBubble : {}),
        ...(isPersona ? styles.personaBubble : {}),
        ...(isCoach ? styles.coachBubble : {}),
    };
    
    return (
        <div style={{...styles.messageRow, justifyContent: isUser ? 'flex-end' : 'flex-start'}}>
            {isUser && message.feedback && (
                <button 
                    style={styles.feedbackButton}
                    onMouseEnter={() => setShowFeedback(true)}
                    onMouseLeave={() => setShowFeedback(false)}
                    aria-label="Mostra feedback"
                >
                    <LightbulbIcon />
                </button>
            )}
             {showFeedback && (
                <div style={styles.feedbackTooltip}>
                    <strong>Feedback del Coach:</strong> {message.feedback}
                </div>
            )}
            <div style={bubbleStyle}>
                <p style={styles.messageContent}>{message.content}</p>
            </div>
        </div>
    );
};

export const StrategicChatTrainerScreen: React.FC<StrategicChatTrainerScreenProps> = ({ user, isPro, onApiKeyError }) => {
    const [step, setStep] = useState<'setup' | 'chat'>('setup');
    const [situation, setSituation] = useState('');
    const [goal, setGoal] = useState('');
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [selectedStyle, setSelectedStyle] = useState<ResponseStyle>('Diretta');
    const [isLoading, setIsLoading] = useState(false);
    
    const { addToast } = useToast();
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!isPro) {
        return (
            <div style={{...styles.container, textAlign: 'center', paddingTop: '80px'}}>
                <CrownIcon style={{width: 64, height: 64, color: COLORS.warning, margin: '0 auto 24px'}}/>
                <h1 style={styles.setupTitle}>Funzionalità PRO</h1>
                <p style={styles.setupDescription}>Il Chat Trainer Strategico è uno strumento avanzato per allenare le tue abilità in tempo reale. <br/>Passa a PRO per sbloccare questo e altri strumenti avanzati.</p>
            </div>
        );
    }

    const handleStartChat = () => {
        if (!situation.trim() || !goal.trim()) {
            addToast('Per favore, compila sia la situazione che l\'obiettivo.', 'error');
            return;
        }
        soundService.playClick();
        setMessages([
            {
                id: 'start-1',
                role: 'coach',
                content: `Perfetto! Iniziamo la simulazione. L'obiettivo è: "${goal}". Tu inizi la conversazione.`
            }
        ]);
        setStep('chat');
    };

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;

        const newUserMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: userInput.trim(),
        };

        const currentHistory = [...messages, newUserMessage];
        setMessages(currentHistory);
        setUserInput('');
        setIsLoading(true);
        soundService.playClick();

        try {
            const { personaResponse, coachFeedback } = await continueStrategicChat(
                currentHistory.filter(m => m.role !== 'coach'),
                situation,
                goal,
                selectedStyle
            );

            const updatedMessagesWithFeedback = currentHistory.map(msg => 
                msg.id === newUserMessage.id ? { ...msg, feedback: coachFeedback } : msg
            );
            
            const personaMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'persona',
                content: personaResponse
            };

            setMessages([...updatedMessagesWithFeedback, personaMessage]);

        } catch (error: any) {
            console.error(error);
            if (error.message.includes('API key')) {
                onApiKeyError(error.message);
            } else {
                addToast(error.message || "Si è verificato un errore.", 'error');
            }
            setMessages(messages); // Revert on error
        } finally {
            setIsLoading(false);
        }
    };
    
    if (step === 'setup') {
        return (
             <div style={styles.container}>
                <header style={styles.header}>
                    <video src={chatTrainerHeaderVideo} style={styles.headerVideo} autoPlay muted loop playsInline />
                    <div style={styles.headerOverlay} />
                    <div style={styles.headerContent}>
                        <h1 style={styles.title}>Chat Trainer Strategico</h1>
                        <p style={styles.setupDescription}>Allenati in tempo reale in una conversazione simulata con un interlocutore guidato dall'AI.</p>
                    </div>
                </header>
                <form onSubmit={(e) => { e.preventDefault(); handleStartChat(); }} style={styles.setupForm}>
                    <h2 style={styles.setupTitle}>Imposta la Simulazione</h2>
                    <div style={styles.inputGroup}>
                        <label htmlFor="situation" style={styles.label}>Qual è la situazione che vuoi allenare?</label>
                        <textarea id="situation" style={styles.textarea} value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="Es: Devo comunicare un ritardo su un progetto a un cliente." rows={3} />
                    </div>
                     <div style={styles.inputGroup}>
                        <label htmlFor="goal" style={styles.label}>Qual è il tuo obiettivo per questa conversazione?</label>
                        <textarea id="goal" style={styles.textarea} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Es: Mantenere la fiducia del cliente e definire un nuovo piano d'azione." rows={3} />
                    </div>
                    <button type="submit" style={styles.startButton}>Inizia Simulazione</button>
                </form>
            </div>
        );
    }
    
    return (
        <div style={styles.chatScreenContainer}>
            <header style={styles.chatHeader}>
                <div style={styles.chatHeaderInfo}>
                    <p><strong>Situazione:</strong> {situation}</p>
                    <p><strong>Tuo Obiettivo:</strong> {goal}</p>
                </div>
                <button onClick={() => setStep('setup')} style={styles.resetButton}>Ricomincia</button>
            </header>
            <main style={styles.messagesContainer}>
                {messages.map(msg => <ChatMessageBubble key={msg.id} message={msg} />)}
                {isLoading && (
                    <div style={{...styles.messageRow, justifyContent: 'flex-start'}}>
                        <div style={{...styles.messageBubble, ...styles.personaBubble}}>
                            <Spinner size={20} color={COLORS.textPrimary}/>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </main>
            <footer style={styles.inputArea}>
                <div style={styles.styleSelector}>
                    <span style={styles.styleLabel}>Stile Risposta Persona:</span>
                    {(['Empatica', 'Diretta', 'Strategica'] as ResponseStyle[]).map(style => (
                        <button 
                            key={style}
                            onClick={() => setSelectedStyle(style)}
                            style={{...styles.styleButton, ...(selectedStyle === style ? styles.styleButtonActive : {})}}
                        >
                            {style}
                        </button>
                    ))}
                </div>
                <div style={styles.inputRow}>
                    <input 
                        type="text" 
                        style={styles.textInput}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Scrivi la tua risposta..."
                        disabled={isLoading}
                    />
                    <button onClick={handleSendMessage} style={styles.sendButton} disabled={isLoading || !userInput.trim()}>
                        <SendIcon />
                    </button>
                </div>
            </footer>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    // Shared
    container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px' },
    title: { fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '12px' },
    // Setup View
    header: { position: 'relative', height: '250px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' },
    headerVideo: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 },
    headerOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(28, 62, 94, 0.7)', zIndex: 2 },
    headerContent: { zIndex: 3, padding: '20px' },
    setupDescription: { fontSize: '18px', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 },
    setupForm: { backgroundColor: COLORS.card, padding: '32px', borderRadius: '12px', border: `1px solid ${COLORS.divider}` },
    setupTitle: { fontSize: '22px', fontWeight: 600, color: COLORS.primary, margin: '0 0 24px 0' },
    inputGroup: { marginBottom: '20px' },
    label: { display: 'block', fontSize: '16px', fontWeight: 500, color: COLORS.textPrimary, marginBottom: '8px' },
    textarea: { width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, resize: 'vertical', fontFamily: 'inherit' },
    startButton: { padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', color: 'white', backgroundColor: COLORS.secondary, border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' },
    // Chat View
    chatScreenContainer: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', backgroundColor: COLORS.base },
    chatHeader: { padding: '16px', backgroundColor: COLORS.card, borderBottom: `1px solid ${COLORS.divider}`, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' },
    chatHeaderInfo: { fontSize: '14px', color: COLORS.textSecondary },
    resetButton: { background: 'none', border: `1px solid ${COLORS.divider}`, padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' },
    messagesContainer: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
    messageRow: { display: 'flex', gap: '10px', alignItems: 'flex-end', position: 'relative', width: '100%' },
    messageBubble: { maxWidth: '75%', padding: '12px 16px', borderRadius: '18px', lineHeight: 1.5, wordBreak: 'break-word' },
    userBubble: { backgroundColor: COLORS.secondary, color: 'white', borderBottomRightRadius: '4px' },
    personaBubble: { backgroundColor: COLORS.cardDark, color: COLORS.textPrimary, borderBottomLeftRadius: '4px' },
    coachBubble: { width: '100%', backgroundColor: 'rgba(255, 193, 7, 0.15)', color: COLORS.textPrimary, textAlign: 'center', borderRadius: '8px', fontStyle: 'italic', fontSize: '14px', borderLeft: `3px solid ${COLORS.warning}` },
    messageContent: { margin: 0 },
    feedbackButton: { position: 'absolute', left: '0', bottom: '5px', background: 'none', border: 'none', cursor: 'pointer', color: COLORS.warning, padding: '4px', zIndex: 5 },
    feedbackTooltip: { position: 'absolute', right: 'calc(100% + 5px)', bottom: '0', backgroundColor: COLORS.textPrimary, color: 'white', padding: '10px', borderRadius: '8px', zIndex: 10, width: '250px', fontSize: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
    inputArea: { padding: '16px', backgroundColor: COLORS.card, borderTop: `1px solid ${COLORS.divider}`, flexShrink: 0 },
    styleSelector: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' },
    styleLabel: { fontSize: '14px', color: COLORS.textSecondary, fontWeight: 500 },
    styleButton: { padding: '6px 12px', fontSize: '14px', border: `1px solid ${COLORS.divider}`, backgroundColor: 'transparent', color: COLORS.textPrimary, borderRadius: '16px', cursor: 'pointer' },
    styleButtonActive: { backgroundColor: COLORS.primary, color: 'white', borderColor: COLORS.primary },
    inputRow: { display: 'flex', gap: '10px' },
    textInput: { flex: 1, padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, outline: 'none' },
    sendButton: { padding: '12px', backgroundColor: COLORS.secondary, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
};
