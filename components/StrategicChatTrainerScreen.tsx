// components/StrategicChatTrainerScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, StrategicResponse, ChatMessage, ContinuedStrategicResponse, ResponseStyle } from '../types';
import { COLORS } from '../constants';
import { LightbulbIcon, SendIcon, CrownIcon, LockIcon } from './Icons';
import { getStrategicSuggestions, continueStrategicChat } from '../services/geminiService';
import { soundService } from '../services/soundService';
import { Spinner } from './Loader';
import { useToast } from '../hooks/useToast';

interface StrategicChatTrainerScreenProps {
  user: UserProfile;
  isPro: boolean;
  onApiKeyError: (error: string) => void;
}

const SuggestionCard: React.FC<{ type: StrategicResponse['suggestions'][0]['type'], response: string, onCopy: (text: string) => void }> = ({ type, response, onCopy }) => {
    const details = {
        'assertiva': { label: 'Approccio Assertivo', color: COLORS.error },
        'empatica': { label: 'Approccio Empatico', color: COLORS.success },
        'chiarificatrice': { label: 'Approccio Chiarificatore', color: COLORS.secondary },
        'solutiva': { label: 'Approccio Solutivo', color: COLORS.primary },
    }[type];

    return (
        <div style={{...styles.suggestionCard, borderLeftColor: details.color}}>
            <h4 style={{...styles.suggestionTitle, color: details.color}}>{details.label}</h4>
            <p style={styles.suggestionText}>"{response}"</p>
            <button onClick={() => onCopy(response)} style={styles.copyButton}>Copia Testo</button>
        </div>
    )
};


export const StrategicChatTrainerScreen: React.FC<StrategicChatTrainerScreenProps> = ({ user, isPro, onApiKeyError }) => {
    const [mode, setMode] = useState<'initial' | 'suggestions' | 'chatting'>('initial');
    
    // Initial form
    const [situation, setSituation] = useState('');
    const [goal, setGoal] = useState('');
    const [context, setContext] = useState('');
    
    // AI responses
    const [initialResponse, setInitialResponse] = useState<StrategicResponse | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [currentUserMessage, setCurrentUserMessage] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPro) {
            addToast("Questa è una funzionalità PRO. Esegui l'upgrade per utilizzarla.", 'info');
            return;
        }
        if (!situation.trim() || !goal.trim()) {
            addToast('Situazione e Obiettivo sono obbligatori.', 'error');
            return;
        }
        soundService.playClick();
        setIsLoading(true);
        setInitialResponse(null);
        try {
            const result = await getStrategicSuggestions(situation, goal, context);
            setInitialResponse(result);
            setMode('suggestions');
        } catch (error: any) {
             if (error.message.includes('API key') || error.message.includes('API_KEY')) {
                onApiKeyError(error.message);
            } else {
                addToast(error.message || "Si è verificato un errore sconosciuto.", 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleStartChat = () => {
        soundService.playClick();
        const firstUserMessage = initialResponse?.suggestions.find(s => s.type === 'empatica')?.response || initialResponse?.suggestions[0].response || '';
        setChatHistory([
            { id: `msg-${Date.now()}-1`, role: 'user', content: situation },
            { id: `msg-${Date.now()}-2`, role: 'coach-analysis', content: initialResponse!.analysis },
            { id: `msg-${Date.now()}-3`, role: 'coach-suggestions', content: initialResponse!.suggestions },
        ]);
        setMode('chatting');
    }
    
    const handleContinueChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUserMessage.trim()) return;

        soundService.playClick();
        const newUserMessage: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', content: currentUserMessage };
        const updatedHistory = [...chatHistory, newUserMessage];
        setChatHistory(updatedHistory);
        setCurrentUserMessage('');
        setIsLoading(true);

        // FIX: The `map` function now explicitly casts `m.role` and `m.content` to the correct narrowed types.
        // This ensures `apiHistory` matches the type expected by `continueStrategicChat`.
        const apiHistory = updatedHistory
            .filter(m => m.role === 'user' || m.role === 'persona')
            .map(m => ({ role: m.role as 'user' | 'persona', content: m.content as string }));

        try {
            const result = await continueStrategicChat(apiHistory, situation, goal, context);
            const personaMessage: ChatMessage = { id: `msg-${Date.now()}-persona`, role: 'persona', content: result.personaResponse };
            const coachAnalysis: ChatMessage = { id: `msg-${Date.now()}-analysis`, role: 'coach-analysis', content: result.analysis };
            const coachSuggestions: ChatMessage = { id: `msg-${Date.now()}-suggestions`, role: 'coach-suggestions', content: result.suggestions };

            setChatHistory(prev => [...prev, personaMessage, coachAnalysis, coachSuggestions]);
        } catch (error: any) {
             if (error.message.includes('API key') || error.message.includes('API_KEY')) {
                onApiKeyError(error.message);
            } else {
                addToast(error.message || "Errore durante la simulazione.", 'error');
                // Revert history on error
                setChatHistory(chatHistory);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        addToast('Testo copiato!', 'success');
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                 <h1 style={styles.title}>
                    <LightbulbIcon style={{color: COLORS.primary}}/> Chat Trainer Strategico
                    {isPro ? <CrownIcon style={{color: COLORS.warning}}/> : <LockIcon style={{color: COLORS.textSecondary}}/>}
                 </h1>
                <p style={styles.subtitle}>Simula una conversazione e ricevi feedback ad ogni passo per affinare la tua strategia comunicativa.</p>
            </header>

            <main style={styles.main}>
                {!isPro && (
                    <div style={styles.proOverlay}>
                        <h2>Funzionalità PRO</h2>
                        <p>Esegui l'upgrade per sbloccare il Chat Trainer e ricevere suggerimenti illimitati in tempo reale.</p>
                    </div>
                )}
                
                {mode === 'initial' && (
                    <form onSubmit={handleInitialSubmit} style={styles.inputSection}>
                        <label style={styles.label}>1. Definisci il Contesto</label>
                        <input type="text" style={styles.input} placeholder="Situazione (es: 'Un cliente si lamenta di un ritardo')" value={situation} onChange={e => setSituation(e.target.value)} disabled={!isPro || isLoading} />
                        <input type="text" style={styles.input} placeholder="Il tuo Obiettivo (es: 'Mantenere il cliente e trovare una soluzione')" value={goal} onChange={e => setGoal(e.target.value)} disabled={!isPro || isLoading} />
                        <textarea
                            style={styles.textarea}
                            rows={3}
                            placeholder="Contesto aggiuntivo (opzionale)"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            disabled={!isPro || isLoading}
                        />
                        <button style={styles.analyzeButton} type="submit" disabled={!isPro || isLoading || !situation.trim() || !goal.trim()}>
                            {isLoading ? <Spinner color="white"/> : <>Genera Analisi Iniziale</>}
                        </button>
                    </form>
                )}
                
                {isLoading && mode !== 'chatting' && <div style={{textAlign: 'center', padding: '40px'}}><Spinner size={48} color={COLORS.primary} /></div>}

                {mode === 'suggestions' && initialResponse && (
                    <div style={styles.resultsSection}>
                        <div style={styles.analysisBox}>
                            <h3 style={styles.analysisTitle}>Analisi Strategica</h3>
                            <p style={styles.analysisText}>{initialResponse.analysis}</p>
                        </div>
                        <h3 style={styles.suggestionsHeader}>Bozze di Risposta Suggerite</h3>
                        <div style={styles.suggestionsGrid}>
                            {initialResponse.suggestions.map((s, i) => (
                                <SuggestionCard key={i} type={s.type} response={s.response} onCopy={handleCopy} />
                            ))}
                        </div>
                        <button style={styles.continueButton} onClick={handleStartChat}>
                            Continua Chat (Simulazione)
                        </button>
                    </div>
                )}
                
                {mode === 'chatting' && (
                    <div style={styles.chatContainer}>
                        <div style={styles.chatHistory}>
                            {chatHistory.map(msg => {
                                if (msg.role === 'user' || msg.role === 'persona') {
                                    return (
                                        <div key={msg.id} style={{...styles.bubble, ...(msg.role === 'user' ? styles.userBubble : styles.personaBubble)}}>
                                            {/* FIX: Cast `msg.content` to string, as React cannot render the complex union type directly. For these roles, content is always a string. */}
                                            {msg.content as string}
                                        </div>
                                    )
                                }
                                if (msg.role === 'coach-analysis') {
                                    return (
                                        <div key={msg.id} style={styles.analysisBox}>
                                            <h3 style={styles.analysisTitle}>Analisi Strategica</h3>
                                            {/* FIX: Cast `msg.content` to string to resolve the render error. For this role, content is always a string. */}
                                            <p style={styles.analysisText}>{msg.content as string}</p>
                                        </div>
                                    )
                                }
                                if (msg.role === 'coach-suggestions') {
                                    return (
                                        <div key={msg.id}>
                                            <h3 style={styles.suggestionsHeader}>Bozze di Risposta Suggerite</h3>
                                            <div style={styles.suggestionsGrid}>
                                                {(msg.content as StrategicResponse['suggestions']).map((s, i) => (
                                                    <SuggestionCard key={i} type={s.type} response={s.response} onCopy={handleCopy} />
                                                ))}
                                            </div>
                                        </div>
                                    )
                                }
                                return null;
                            })}
                            {isLoading && (
                                <div style={{...styles.bubble, ...styles.personaBubble, color: COLORS.textSecondary}}>
                                    <Spinner size={20} color={COLORS.textSecondary}/>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <form onSubmit={handleContinueChat} style={styles.chatInputForm}>
                            <input
                                type="text"
                                style={styles.chatInput}
                                placeholder="Scrivi la tua risposta..."
                                value={currentUserMessage}
                                onChange={e => setCurrentUserMessage(e.target.value)}
                                disabled={isLoading}
                            />
                            <button type="submit" style={styles.sendButton} disabled={isLoading || !currentUserMessage.trim()}>
                                <SendIcon />
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '900px', margin: '0 auto', padding: '40px 20px' },
    header: { textAlign: 'center', marginBottom: '32px' },
    title: { fontSize: '28px', fontWeight: 'bold', color: COLORS.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },
    subtitle: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.6, maxWidth: '700px', margin: '12px auto 0' },
    main: { backgroundColor: COLORS.card, borderRadius: '12px', padding: '32px', position: 'relative', border: `1px solid ${COLORS.divider}` },
    inputSection: { display: 'flex', flexDirection: 'column', gap: '16px'},
    label: { display: 'block', fontSize: '16px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '4px' },
    input: {
        width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, fontFamily: 'inherit', boxSizing: 'border-box'
    },
    textarea: {
        width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
    },
    analyzeButton: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        width: '100%', padding: '14px', marginTop: '8px',
        fontSize: '16px', fontWeight: 'bold', color: 'white',
        background: COLORS.primaryGradient, border: 'none', borderRadius: '8px', cursor: 'pointer',
    },
    proOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(248, 247, 244, 0.95)', borderRadius: '12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '20px',
    },
    resultsSection: { marginTop: '32px', paddingTop: '32px', borderTop: `1px solid ${COLORS.divider}` },
    analysisBox: { backgroundColor: COLORS.cardDark, padding: '20px', borderRadius: '8px', margin: '16px 0' },
    analysisTitle: { margin: '0 0 8px 0', fontSize: '18px', color: COLORS.primary },
    analysisText: { margin: 0, fontSize: '15px', lineHeight: 1.6, color: COLORS.textSecondary },
    suggestionsHeader: { fontSize: '20px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '16px' },
    suggestionsGrid: { display: 'grid', gap: '16px' },
    suggestionCard: { backgroundColor: COLORS.cardDark, padding: '16px', borderRadius: '8px', borderLeft: '4px solid' },
    suggestionTitle: { margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 },
    suggestionText: { margin: '0 0 12px 0', fontSize: '15px', color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 1.6 },
    copyButton: {
        background: 'none', border: `1px solid ${COLORS.secondary}`, color: COLORS.secondary,
        padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500
    },
    continueButton: {
        display: 'block', margin: '32px auto 0', padding: '12px 24px',
        fontSize: '16px', fontWeight: 'bold', color: 'white', backgroundColor: COLORS.secondary,
        border: 'none', borderRadius: '8px', cursor: 'pointer'
    },
    chatContainer: { display: 'flex', flexDirection: 'column', height: '60vh' },
    chatHistory: { flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '12px' },
    bubble: { padding: '10px 15px', borderRadius: '18px', maxWidth: '80%', lineHeight: 1.5 },
    userBubble: { backgroundColor: COLORS.secondary, color: 'white', alignSelf: 'flex-end' },
    personaBubble: { backgroundColor: COLORS.cardDark, color: COLORS.textPrimary, alignSelf: 'flex-start' },
    chatInputForm: { display: 'flex', gap: '10px', paddingTop: '10px', borderTop: `1px solid ${COLORS.divider}` },
    chatInput: { flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${COLORS.divider}` },
    sendButton: { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: COLORS.primary, color: 'white', cursor: 'pointer' }
};
