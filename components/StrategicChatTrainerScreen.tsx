// components/StrategicChatTrainerScreen.tsx
// FIX: Create full content for the Strategic Chat Trainer component.
import React, { useState, useRef, useEffect } from 'react';
import {
  UserProfile,
  ChatMessage,
  StrategicResponse,
  ResponseStyle,
} from '../types';
import { COLORS } from '../constants';
import { getStrategicResponse, continueWithPersona } from '../services/geminiService';
import { useToast } from '../hooks/useToast';
import { Spinner } from './Loader';
import { SendIcon, LightbulbIcon } from './Icons';
import { soundService } from '../services/soundService';
import { SuggestionStyleModal } from './SuggestionStyleModal';// components/StrategicChatTrainerScreen.tsx
// FIX: Create full content for the Strategic Chat Trainer component.
import React, { useState, useRef, useEffect } from 'react';
import {
  UserProfile,
  ChatMessage,
  StrategicResponse,
  ResponseStyle,
} from '../types';
import { COLORS } from '../constants';
import { getStrategicResponse, continueWithPersona } from '../services/geminiService';
import { useToast } from '../hooks/useToast';
import { Spinner } from './Loader';
import { SendIcon, LightbulbIcon } from './Icons';
import { soundService } from '../services/soundService';
import { SuggestionStyleModal } from './SuggestionStyleModal';
import { chatTrainerHeaderVideo } from '../assets';

interface StrategicChatTrainerScreenProps {
  user: UserProfile;
  isPro: boolean;
  onApiKeyError: (error: string) => void;
}

const CoachMessage: React.FC<{ analysis: string, suggestions: StrategicResponse['suggestions'], onSelectSuggestion: (text: string) => void }> = ({ analysis, suggestions, onSelectSuggestion }) => {
    return (
        <div style={styles.coachMessage}>
            <div style={styles.coachHeader}>
                <LightbulbIcon style={{color: COLORS.warning}} />
                <h3 style={styles.coachTitle}>Analisi Strategica del Coach</h3>
            </div>
            <p style={styles.analysisText}>{analysis}</p>
            <div style={styles.suggestionsContainer}>
                {suggestions.map((s, i) => (
                    <div key={i} style={styles.suggestionItem}>
                        <div style={styles.suggestionContent}>
                            <span style={styles.suggestionType}>{s.type.charAt(0).toUpperCase() + s.type.slice(1)}</span>
                            <p style={styles.suggestionText}>"{s.response}"</p>
                        </div>
                        <button style={styles.selectButton} onClick={() => onSelectSuggestion(s.response)}>
                            Seleziona
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
};

export const StrategicChatTrainerScreen: React.FC<StrategicChatTrainerScreenProps> = ({ user, isPro, onApiKeyError }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [context, setContext] = useState('');
  const [objective, setObjective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [currentStrategicResponse, setCurrentStrategicResponse] = useState<StrategicResponse | null>(null);
  const [conversationState, setConversationState] = useState<'idle' | 'analyzing' | 'suggesting' | 'waiting_for_persona'>('idle');
  const [originalInput, setOriginalInput] = useState('');
  const [suggestionStyle, setSuggestionStyle] = useState<ResponseStyle>('Strategica');
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isLoading]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || conversationState !== 'idle') return;
    soundService.playClick();

    const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: userInput };
    setChatMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setOriginalInput(userInput); 
    setConversationState('analyzing');
    setIsLoading(true);
    setCurrentStrategicResponse(null);

    try {
        const response = await getStrategicResponse(userInput, suggestionStyle, [], context, objective);
        setCurrentStrategicResponse(response);
        setConversationState('suggesting');
    } catch (error: any) {
        console.error("Error getting strategic response:", error);
        if (error.message.includes('API key')) {
            onApiKeyError(error.message);
        } else {
            addToast(error.message || "Errore durante l'analisi.", 'error');
        }
        setConversationState('idle');
    } finally {
        setIsLoading(false);
    }
  };

  const handleSelectSuggestion = async (chosenResponse: string) => {
    soundService.playClick();
    
    const userResponseMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'user', content: chosenResponse, feedback: 'Scelto dal coach' };
    setChatMessages(prev => [...prev, userResponseMessage]);
    setCurrentStrategicResponse(null);
    setConversationState('waiting_for_persona');
    setIsLoading(true);
    
    try {
        const result = await continueWithPersona(originalInput, chosenResponse, [], context, objective);
        const personaMessage: ChatMessage = { id: (Date.now() + 2).toString(), role: 'persona', content: result.personaResponse };
        setChatMessages(prev => [...prev, personaMessage]);
        setCurrentStrategicResponse(result);
        setConversationState('suggesting');
    } catch (error: any) {
        console.error("Error continuing conversation:", error);
         if (error.message.includes('API key')) {
            onApiKeyError(error.message);
        } else {
            addToast(error.message || "Errore nella simulazione.", 'error');
            setConversationState('idle');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const isInitialState = chatMessages.length === 0;

  return (
    <div style={styles.container}>
        <header style={styles.header}>
            <video src={chatTrainerHeaderVideo} style={styles.headerVideo} autoPlay muted loop playsInline />
            <div style={styles.headerOverlay} />
            <div style={styles.headerContent}>
                <h1 style={styles.title}>Chat Trainer Strategico</h1>
                <p style={styles.subtitle}>Incolla un messaggio, definisci il contesto e il tuo obiettivo. L'AI ti fornirà un'analisi e bozze di risposta strategiche.</p>
            </div>
        </header>

        <div style={styles.chatContainer}>
            <div style={styles.inputArea}>
                 {isInitialState && (
                    <div style={styles.initialInputsContainer}>
                        <textarea
                            style={{...styles.smallTextarea}}
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Contesto (opzionale): Es. Sto parlando con un cliente scontento..."
                            rows={2}
                            disabled={isLoading || conversationState !== 'idle'}
                        />
                        <textarea
                            style={{...styles.smallTextarea}}
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                            placeholder="Obiettivo (opzionale): Es. Voglio calmarlo e fissare una chiamata..."
                            rows={2}
                            disabled={isLoading || conversationState !== 'idle'}
                        />
                    </div>
                )}
                <div style={styles.mainInputWrapper}>
                    <textarea
                        style={styles.textarea}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={isInitialState ? "Incolla qui il messaggio da analizzare..." : "Scrivi qui per rispondere..."}
                        rows={isInitialState ? 3 : 2}
                        onKeyPress={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                        disabled={isLoading || conversationState !== 'idle'}
                    />
                    <button 
                        onClick={handleSendMessage} 
                        style={styles.sendButton} 
                        disabled={isLoading || !userInput.trim() || conversationState !== 'idle'}
                    >
                        <SendIcon/>
                    </button>
                </div>
            </div>

            <div style={styles.chatWindow}>
                {isInitialState && !isLoading && (
                    <div style={styles.initialMessage}>
                        <LightbulbIcon style={{width: 48, height: 48, color: COLORS.secondary}} />
                        <p>La conversazione e l'analisi del coach appariranno qui sotto.</p>
                    </div>
                )}
                {chatMessages.map((msg, index) => {
                    const isLastMessage = index === chatMessages.length - 1;
                    return (
                        <div 
                            key={msg.id} 
                            ref={isLastMessage ? lastMessageRef : null}
                            style={{...styles.messageBubble, ...(msg.role === 'user' ? styles.userBubble : styles.personaBubble)}}>
                            {msg.content}
                        </div>
                    );
                })}
                {isLoading && (
                    <div style={{...styles.messageBubble, ...styles.personaBubble}}>
                        <Spinner color={COLORS.primary} />
                    </div>
                )}
                {currentStrategicResponse && conversationState === 'suggesting' && (
                    <CoachMessage
                        analysis={currentStrategicResponse.analysis}
                        suggestions={currentStrategicResponse.suggestions}
                        onSelectSuggestion={handleSelectSuggestion}
                    />
                )}
                <div ref={chatEndRef} />
            </div>
        </div>
        <SuggestionStyleModal
            isOpen={isStyleModalOpen}
            onClose={() => setIsStyleModalOpen(false)}
            onSelectStyle={setSuggestionStyle}
            currentStyle={suggestionStyle}
        />
    </div>
  );
};


const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' },
  header: { position: 'relative', textAlign: 'center', padding: '32px 20px', backgroundColor: COLORS.primary },
  headerVideo: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1, opacity: 0.2 },
  headerOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(28, 62, 94, 0.7)', zIndex: 2 },
  headerContent: { zIndex: 3, position: 'relative' },
  title: { fontSize: '24px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' },
  subtitle: { fontSize: '15px', color: 'white', opacity: 0.9, maxWidth: '600px', margin: '0 auto' },
  chatContainer: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '800px', width: '100%', margin: '-40px auto 0', zIndex: 4, backgroundColor: COLORS.card, borderRadius: '12px 12px 0 0' },
  chatWindow: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  messageBubble: { padding: '12px 16px', borderRadius: '18px', maxWidth: '80%', lineHeight: 1.5, wordBreak: 'break-word' },
  userBubble: { backgroundColor: COLORS.secondary, color: 'white', alignSelf: 'flex-end', borderRadius: '18px 18px 4px 18px' },
  personaBubble: { backgroundColor: COLORS.cardDark, color: COLORS.textPrimary, alignSelf: 'flex-start', borderRadius: '18px 18px 18px 4px' },
  coachMessage: { backgroundColor: '#FFFBEA', border: `1px solid ${COLORS.warning}`, borderRadius: '12px', padding: '16px' },
  coachHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  coachTitle: { fontSize: '16px', fontWeight: 'bold', color: COLORS.textPrimary, margin: 0 },
  analysisText: { fontSize: '15px', color: COLORS.textSecondary, margin: '0 0 16px 0', lineHeight: 1.6, borderLeft: `3px solid ${COLORS.warning}`, paddingLeft: '12px' },
  suggestionsContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  suggestionItem: {
    background: 'white',
    border: `1px solid ${COLORS.divider}`,
    borderRadius: '8px',
    padding: '12px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  suggestionContent: {
    flex: 1,
    textAlign: 'left',
  },
  suggestionType: { color: COLORS.secondary, fontWeight: 'bold', fontSize: '13px', marginBottom: '4px', display: 'block' },
  suggestionText: { color: COLORS.textPrimary, fontStyle: 'italic', fontSize: '14px', margin: 0 },
  selectButton: {
    backgroundColor: COLORS.secondary,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    flexShrink: 0,
    transition: 'background-color 0.2s ease',
  },
  inputArea: { display: 'flex', flexDirection: 'column', padding: '16px', borderBottom: `1px solid ${COLORS.divider}`, backgroundColor: COLORS.card, gap: '12px', borderRadius: '12px 12px 0 0' },
  initialInputsContainer: { display: 'flex', gap: '12px', flexDirection: 'column' },
  smallTextarea: { width: '100%', resize: 'none', padding: '10px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' },
  mainInputWrapper: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  textarea: { flex: 1, resize: 'none', padding: '12px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, fontSize: '16px', fontFamily: 'inherit' },
  sendButton: { backgroundColor: COLORS.secondary, color: 'white', border: 'none', borderRadius: '8px', width: '48px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  initialMessage: { textAlign: 'center', padding: '40px 20px', color: COLORS.textSecondary },
};
import { chatTrainerHeaderVideo } from '../assets';

interface StrategicChatTrainerScreenProps {
  user: UserProfile;
  isPro: boolean;
  onApiKeyError: (error: string) => void;
}

const CoachMessage: React.FC<{ analysis: string, suggestions: StrategicResponse['suggestions'], onSelectSuggestion: (text: string) => void }> = ({ analysis, suggestions, onSelectSuggestion }) => {
    return (
        <div style={styles.coachMessage}>
            <div style={styles.coachHeader}>
                <LightbulbIcon style={{color: COLORS.warning}} />
                <h3 style={styles.coachTitle}>Analisi Strategica del Coach</h3>
            </div>
            <p style={styles.analysisText}>{analysis}</p>
            <div style={styles.suggestionsContainer}>
                {suggestions.map((s, i) => (
                    <div key={i} style={styles.suggestionItem}>
                        <div style={styles.suggestionContent}>
                            <span style={styles.suggestionType}>{s.type.charAt(0).toUpperCase() + s.type.slice(1)}</span>
                            <p style={styles.suggestionText}>"{s.response}"</p>
                        </div>
                        <button style={styles.selectButton} onClick={() => onSelectSuggestion(s.response)}>
                            Seleziona
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
};

export const StrategicChatTrainerScreen: React.FC<StrategicChatTrainerScreenProps> = ({ user, isPro, onApiKeyError }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [context, setContext] = useState('');
  const [objective, setObjective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [currentStrategicResponse, setCurrentStrategicResponse] = useState<StrategicResponse | null>(null);
  const [conversationState, setConversationState] = useState<'idle' | 'analyzing' | 'suggesting' | 'waiting_for_persona'>('idle');
  const [originalInput, setOriginalInput] = useState('');
  const [suggestionStyle, setSuggestionStyle] = useState<ResponseStyle>('Strategica');
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading, currentStrategicResponse]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || conversationState !== 'idle') return;
    soundService.playClick();

    const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: userInput };
    setChatMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setOriginalInput(userInput); // Save the very first message for context
    setConversationState('analyzing');
    setIsLoading(true);
    setCurrentStrategicResponse(null);

    try {
        const response = await getStrategicResponse(userInput, suggestionStyle, [], context, objective);
        setCurrentStrategicResponse(response);
        setConversationState('suggesting');
    } catch (error: any) {
        console.error("Error getting strategic response:", error);
        if (error.message.includes('API key')) {
            onApiKeyError(error.message);
        } else {
            addToast(error.message || "Errore durante l'analisi.", 'error');
        }
        setConversationState('idle');
    } finally {
        setIsLoading(false);
    }
  };

  const handleSelectSuggestion = async (chosenResponse: string) => {
    soundService.playClick();
    
    const userResponseMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'user', content: chosenResponse, feedback: 'Scelto dal coach' };
    setChatMessages(prev => [...prev, userResponseMessage]);
    setCurrentStrategicResponse(null);
    setConversationState('waiting_for_persona');
    setIsLoading(true);
    
    try {
        const result = await continueWithPersona(originalInput, chosenResponse, [], context, objective);
        const personaMessage: ChatMessage = { id: (Date.now() + 2).toString(), role: 'persona', content: result.personaResponse };
        setChatMessages(prev => [...prev, personaMessage]);
        setCurrentStrategicResponse(result);
        setConversationState('suggesting');
    } catch (error: any) {
        console.error("Error continuing conversation:", error);
         if (error.message.includes('API key')) {
            onApiKeyError(error.message);
        } else {
            addToast(error.message || "Errore nella simulazione.", 'error');
            setConversationState('idle'); // or back to suggesting
        }
    } finally {
        setIsLoading(false);
    }
  };

  const isInitialState = chatMessages.length === 0;

  return (
    <div style={styles.container}>
        <header style={styles.header}>
            <video src={chatTrainerHeaderVideo} style={styles.headerVideo} autoPlay muted loop playsInline />
            <div style={styles.headerOverlay} />
            <div style={styles.headerContent}>
                <h1 style={styles.title}>Chat Trainer Strategico</h1>
                <p style={styles.subtitle}>Incolla un messaggio, definisci il contesto e il tuo obiettivo. L'AI ti fornirà un'analisi e bozze di risposta strategiche.</p>
            </div>
        </header>

        <div style={styles.chatContainer}>
            <div style={styles.chatWindow}>
                {isInitialState && (
                    <div style={styles.initialMessage}>
                        <LightbulbIcon style={{width: 48, height: 48, color: COLORS.secondary}} />
                        <p>Incolla qui un'email, un messaggio o una qualsiasi comunicazione a cui vuoi rispondere in modo strategico.</p>
                    </div>
                )}
                {chatMessages.map(msg => (
                    <div key={msg.id} style={{...styles.messageBubble, ...(msg.role === 'user' ? styles.userBubble : styles.personaBubble)}}>
                        {msg.content}
                    </div>
                ))}
                {isLoading && (
                    <div style={{...styles.messageBubble, ...styles.personaBubble}}>
                        <Spinner color={COLORS.primary} />
                    </div>
                )}
                {currentStrategicResponse && conversationState === 'suggesting' && (
                    <CoachMessage
                        analysis={currentStrategicResponse.analysis}
                        suggestions={currentStrategicResponse.suggestions}
                        onSelectSuggestion={handleSelectSuggestion}
                    />
                )}
                <div ref={chatEndRef} />
            </div>

            <div style={styles.inputArea}>
                 {isInitialState && (
                    <div style={styles.initialInputsContainer}>
                        <textarea
                            style={{...styles.smallTextarea}}
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Contesto (opzionale): Es. Sto parlando con un cliente scontento..."
                            rows={2}
                            disabled={isLoading || conversationState !== 'idle'}
                        />
                        <textarea
                            style={{...styles.smallTextarea}}
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                            placeholder="Obiettivo (opzionale): Es. Voglio calmarlo e fissare una chiamata..."
                            rows={2}
                            disabled={isLoading || conversationState !== 'idle'}
                        />
                    </div>
                )}
                <div style={styles.mainInputWrapper}>
                    <textarea
                        style={styles.textarea}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={isInitialState ? "Incolla qui il messaggio da analizzare..." : "Scrivi qui per rispondere..."}
                        rows={isInitialState ? 3 : 2}
                        onKeyPress={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                        disabled={isLoading || conversationState !== 'idle'}
                    />
                    <button 
                        onClick={handleSendMessage} 
                        style={styles.sendButton} 
                        disabled={isLoading || !userInput.trim() || conversationState !== 'idle'}
                    >
                        <SendIcon/>
                    </button>
                </div>
            </div>
        </div>
        <SuggestionStyleModal
            isOpen={isStyleModalOpen}
            onClose={() => setIsStyleModalOpen(false)}
            onSelectStyle={setSuggestionStyle}
            currentStyle={suggestionStyle}
        />
    </div>
  );
};


const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' },
  header: { position: 'relative', textAlign: 'center', padding: '32px 20px', backgroundColor: COLORS.primary },
  headerVideo: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1, opacity: 0.2 },
  headerOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(28, 62, 94, 0.7)', zIndex: 2 },
  headerContent: { zIndex: 3, position: 'relative' },
  title: { fontSize: '24px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' },
  subtitle: { fontSize: '15px', color: 'white', opacity: 0.9, maxWidth: '600px', margin: '0 auto' },
  chatContainer: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '800px', width: '100%', margin: '-40px auto 0', zIndex: 4, backgroundColor: COLORS.card, borderRadius: '12px 12px 0 0', overflow: 'hidden' },
  chatWindow: { flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' },
  messageBubble: { padding: '12px 16px', borderRadius: '18px', maxWidth: '80%', lineHeight: 1.5, wordBreak: 'break-word' },
  userBubble: { backgroundColor: COLORS.secondary, color: 'white', alignSelf: 'flex-end', borderRadius: '18px 18px 4px 18px' },
  personaBubble: { backgroundColor: COLORS.cardDark, color: COLORS.textPrimary, alignSelf: 'flex-start', borderRadius: '18px 18px 18px 4px' },
  coachMessage: { backgroundColor: '#FFFBEA', border: `1px solid ${COLORS.warning}`, borderRadius: '12px', padding: '16px' },
  coachHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  coachTitle: { fontSize: '16px', fontWeight: 'bold', color: COLORS.textPrimary, margin: 0 },
  analysisText: { fontSize: '15px', color: COLORS.textSecondary, margin: '0 0 16px 0', lineHeight: 1.6, borderLeft: `3px solid ${COLORS.warning}`, paddingLeft: '12px' },
  suggestionsContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  suggestionItem: {
    background: 'white',
    border: `1px solid ${COLORS.divider}`,
    borderRadius: '8px',
    padding: '12px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  suggestionContent: {
    flex: 1,
    textAlign: 'left',
  },
  suggestionType: { color: COLORS.secondary, fontWeight: 'bold', fontSize: '13px', marginBottom: '4px', display: 'block' },
  suggestionText: { color: COLORS.textPrimary, fontStyle: 'italic', fontSize: '14px', margin: 0 },
  selectButton: {
    backgroundColor: COLORS.secondary,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    flexShrink: 0,
    transition: 'background-color 0.2s ease',
  },
  inputArea: { display: 'flex', flexDirection: 'column', padding: '16px', borderTop: `1px solid ${COLORS.divider}`, backgroundColor: COLORS.card, gap: '12px' },
  initialInputsContainer: { display: 'flex', gap: '12px', flexDirection: 'column' },
  smallTextarea: { width: '100%', resize: 'none', padding: '10px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' },
  mainInputWrapper: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  textarea: { flex: 1, resize: 'none', padding: '12px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, fontSize: '16px', fontFamily: 'inherit' },
  sendButton: { backgroundColor: COLORS.secondary, color: 'white', border: 'none', borderRadius: '8px', width: '48px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  initialMessage: { textAlign: 'center', padding: '40px 20px', color: COLORS.textSecondary },
};
