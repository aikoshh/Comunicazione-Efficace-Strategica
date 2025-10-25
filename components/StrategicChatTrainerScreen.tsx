import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { COLORS } from '../constants';
import { BackIcon, SendIcon, LightbulbIcon } from './Icons';
import { generateStrategicChatResponse } from '../services/geminiService';
import { useToast } from '../hooks/useToast';
import { soundService } from '../services/soundService';
import { Spinner } from './Loader';
import ReactMarkdown from 'react-markdown';

interface StrategicChatTrainerScreenProps {
  user: UserProfile;
  onBack: () => void;
  isPro: boolean;
  onApiKeyError: (error: string) => void;
}

type Tone = 'Empatico' | 'Diretto' | 'Chiarificatore';

export const StrategicChatTrainerScreen: React.FC<StrategicChatTrainerScreenProps> = ({ onBack, onApiKeyError }) => {
    const [receivedMessage, setReceivedMessage] = useState('');
    const [objective, setObjective] = useState('');
    const [context, setContext] = useState('');
    const [tone, setTone] = useState<Tone>('Empatico');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null);
    const { addToast } = useToast();
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (response) {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [response]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        soundService.playClick();

        if (!receivedMessage.trim() || !objective.trim()) {
            addToast('Il messaggio ricevuto e l\'obiettivo sono obbligatori.', 'error');
            return;
        }

        setIsLoading(true);
        setResponse(null);

        try {
            const result = await generateStrategicChatResponse(receivedMessage, objective, context, tone);
            setResponse(result);
        } catch (error: any) {
            console.error(error);
            if (error.message.includes('API key')) {
                onApiKeyError(error.message);
            } else {
                addToast(error.message || "Si è verificato un errore durante la generazione della risposta.", 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isFormComplete = receivedMessage.trim() && objective.trim();

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <button onClick={onBack} style={styles.backButton}><BackIcon/> Indietro</button>
                <div style={styles.titleContainer}>
                    <LightbulbIcon style={styles.titleIcon} />
                    <h1 style={styles.title}>Chat Trainer Strategico</h1>
                </div>
                <p style={styles.subtitle}>
                    Incolla un messaggio, definisci il tuo obiettivo e ottieni una risposta strategica generata dall'AI.
                </p>
            </header>
            
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                    <label htmlFor="receivedMessage">1. Messaggio Ricevuto</label>
                    <textarea
                        id="receivedMessage"
                        value={receivedMessage}
                        onChange={e => setReceivedMessage(e.target.value)}
                        placeholder="Incolla qui il messaggio che hai ricevuto (email, chat, etc.)"
                        rows={5}
                        style={styles.textarea}
                        required
                    />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="objective">2. Il Tuo Obiettivo</label>
                    <input
                        id="objective"
                        type="text"
                        value={objective}
                        onChange={e => setObjective(e.target.value)}
                        placeholder="Es: Ottenere uno sconto, declinare la richiesta, chiedere chiarimenti"
                        style={styles.input}
                        required
                    />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="context">3. Contesto Aggiuntivo (Opzionale)</label>
                    <input
                        id="context"
                        type="text"
                        value={context}
                        onChange={e => setContext(e.target.value)}
                        placeholder="Es: È un cliente importante, ho già parlato con il suo collega"
                        style={styles.input}
                    />
                </div>
                 <div style={styles.inputGroup}>
                    <label>4. Tono Strategico Richiesto</label>
                    <div style={styles.toneSelector}>
                        {(['Empatico', 'Diretto', 'Chiarificatore'] as Tone[]).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTone(t)}
                                style={{ ...styles.toneButton, ...(tone === t ? styles.toneButtonActive : {})}}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                <button type="submit" style={{...styles.submitButton, ...(!isFormComplete || isLoading ? styles.submitButtonDisabled : {})}} disabled={!isFormComplete || isLoading}>
                    {isLoading ? <Spinner color="white" /> : <>Genera Risposta Strategica <SendIcon/></>}
                </button>
            </form>

            {response && (
                 <div style={styles.responseContainer} ref={resultsRef}>
                    <ReactMarkdown
                        components={{
                            h1: ({node, ...props}) => <h2 style={styles.responseTitle} {...props} />,
                            h2: ({node, ...props}) => <h3 style={styles.responseSubtitle} {...props} />,
                            p: ({node, ...props}) => <p style={styles.responseText} {...props} />,
                            ul: ({node, ...props}) => <ul style={styles.responseList} {...props} />,
                            li: ({node, ...props}) => <li style={styles.responseListItem} {...props} />,
                            strong: ({node, ...props}) => <strong style={{color: COLORS.primary}} {...props} />,
                        }}
                    >
                        {response}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px' },
    header: { textAlign: 'center', marginBottom: '32px', position: 'relative' },
    backButton: { background: 'none', border: 'none', color: COLORS.textSecondary, padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', position: 'absolute', top: 0, left: 0 },
    titleContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },
    titleIcon: { width: '32px', height: '32px', color: COLORS.primary },
    title: { fontSize: '28px', fontWeight: 'bold', color: COLORS.primary, margin: 0 },
    subtitle: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.6, marginTop: '8px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: COLORS.card, padding: '24px', borderRadius: '12px', border: `1px solid ${COLORS.divider}` },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '16px', fontWeight: 500, color: COLORS.textPrimary },
    input: { padding: '12px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${COLORS.divider}` },
    textarea: { padding: '12px', fontSize: '16px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, fontFamily: 'inherit', resize: 'vertical' },
    toneSelector: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
    toneButton: { padding: '10px 16px', fontSize: '15px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, backgroundColor: COLORS.cardDark, cursor: 'pointer', fontWeight: 500 },
    toneButtonActive: { backgroundColor: COLORS.secondary, color: 'white', borderColor: COLORS.secondary },
    submitButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '16px', fontSize: '18px', fontWeight: 'bold', color: 'white', backgroundColor: COLORS.primary, border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '16px', minHeight: '58px' },
    submitButtonDisabled: { backgroundColor: '#ccc', cursor: 'not-allowed' },
    responseContainer: { marginTop: '32px', backgroundColor: COLORS.card, padding: '24px', borderRadius: '12px', border: `1px solid ${COLORS.divider}`, animation: 'fadeInUp 0.5s ease-out' },
    responseTitle: { fontSize: '24px', color: COLORS.primary, borderBottom: `2px solid ${COLORS.secondary}`, paddingBottom: '8px' },
    responseSubtitle: { fontSize: '20px', color: COLORS.textPrimary, marginTop: '24px' },
    responseText: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.7 },
    responseList: { paddingLeft: '20px' },
    responseListItem: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.7, marginBottom: '8px' },
};
