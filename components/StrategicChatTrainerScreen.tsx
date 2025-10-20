import React, { useState, useEffect, useRef } from 'react';
import { Module } from '../types';
import { COLORS } from '../constants';
import { SendIcon, BackIcon, CopyIcon, CheckCircleIcon } from './Icons';
import { soundService } from '../services/soundService';
import { generateStrategicChatResponse } from '../services/geminiService';
import { useToast } from '../hooks/useToast';
import { Spinner } from './Loader';

type Tone = 'Empatico' | 'Diretto' | 'Chiarificatore';

interface StrategicChatTrainerScreenProps {
  module: Module;
  onBack: () => void;
  onApiKeyError: (error: string) => void;
  apiKey: string | null;
}

const StrategicChatTrainerScreen: React.FC<StrategicChatTrainerScreenProps> = ({ module, onBack, onApiKeyError, apiKey }) => {
    const [receivedMessage, setReceivedMessage] = useState('');
    const [context, setContext] = useState('');
    const [objective, setObjective] = useState('');
    const [tone, setTone] = useState<Tone>('Empatico');
    const [generatedResponse, setGeneratedResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    // FIX: Using NodeJS.Timeout in a browser environment is incorrect.
    // The return type of setInterval in a browser is a number.
    // Using ReturnType<typeof setInterval> makes this code environment-agnostic.
    const countdownRef = useRef<ReturnType<typeof setInterval>>();

    const { addToast } = useToast();

    useEffect(() => {
        if (isLoading) {
            setCountdown(20);
            countdownRef.current = setInterval(() => {
                setCountdown(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        } else {
            clearInterval(countdownRef.current);
        }
        return () => clearInterval(countdownRef.current);
    }, [isLoading]);

    const handleGenerate = async () => {
        if (!receivedMessage.trim()) {
            addToast('Per favore, inserisci il messaggio ricevuto.', 'error');
            return;
        }
        soundService.playClick();
        setIsLoading(true);
        setGeneratedResponse('');
        try {
            const response = await generateStrategicChatResponse(receivedMessage, objective, context, tone, apiKey);
            setGeneratedResponse(response);
        } catch (error: any) {
            console.error(error);
            if (error.message.includes('API key') || error.message.includes('API_KEY')) {
                onApiKeyError(error.message);
            } else {
                addToast(error.message || "Si è verificato un errore sconosciuto.", 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const isReady = receivedMessage.trim() !== '';

    const isHeaderVideo = module.headerImage && module.headerImage.toLowerCase().endsWith('.mp4');
    
    // --- RENDER FUNCTIONS FOR RESPONSE ---
    
    const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

    const handleCopy = (textToCopy: string, key: string) => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            soundService.playClick();
            setCopiedStates(prev => ({ ...prev, [key]: true }));
            setTimeout(() => {
                setCopiedStates(prev => ({ ...prev, [key]: false }));
            }, 2000);
        });
    };

    const renderResponse = () => {
        if (!generatedResponse) return null;
        
        const sections: { [key: string]: string } = {};
        let currentTitle = 'Risposta Suggerita'; // Default title
        let rawContent = generatedResponse;

        const titles = ["Risposta Breve", "Risposta Elaborata", "Spiegazione della Strategia", "Avvertenza fondamentale"];
        const regex = new RegExp(`((${titles.join('|')}|### Avvertenza fondamentale):?)`, 'g');
        const parts = rawContent.split(regex);
        
        let i = 1;
        while(i < parts.length) {
            let title = parts[i].replace('###', '').replace(':', '').trim();
            let content = parts[i+1]?.trim() || '';
            sections[title] = content;
            i += 2;
        }
        
        if (Object.keys(sections).length === 0) {
             // Fallback for unstructured response
             sections[currentTitle] = rawContent;
        }

        const renderSection = (title: string, content: string) => {
            const canCopy = title.includes("Risposta");
            const copyKey = title.replace(/\s/g, '');
            const isCopied = copiedStates[copyKey];

            return (
                <div key={title} style={styles.responseSection}>
                    <div style={styles.responseSectionHeader}>
                        <h3 style={title === "Avvertenza fondamentale" ? styles.warningTitle : (title.includes("Risposta") ? styles.responseTitleOrange : styles.responseTitleGreen)}>
                             {title === "Avvertenza fondamentale" && <span style={{marginRight: '8px'}}>⚠️</span>}
                             {title}
                        </h3>
                        {canCopy && (
                             <button onClick={() => handleCopy(content, copyKey)} style={styles.copyButton}>
                                {isCopied ? <><CheckCircleIcon/> Copiato!</> : <><CopyIcon/> Copia</>}
                            </button>
                        )}
                    </div>
                    {title === "Spiegazione della Strategia" ? (
                        <ul style={styles.strategyList}>
                            {content.split('*').filter(s => s.trim()).map((item, index) => (
                                <li key={index} style={styles.strategyItem}>
                                    <span style={styles.strategyIcon}>🎯</span>
                                    <span>{item.trim()}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={styles.responseText}>{content}</p>
                    )}
                </div>
            )
        }

        return (
            <div style={styles.resultsSection}>
                {renderSection("Risposta Suggerita", "")}
                {Object.entries(sections).map(([title, content]) => renderSection(title, content))}
            </div>
        )
    };


    return (
        <div style={styles.container}>
            <header style={styles.header}>
                 {isHeaderVideo ? (
                    <video 
                        src={module.headerImage} 
                        style={styles.headerImage} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline 
                        title={`Video per ${module.title}`} 
                    />
                ) : module.headerImage && (
                    <img src={module.headerImage} alt={`Illustrazione per ${module.title}`} style={styles.headerImage} />
                )}
                <div style={styles.titleContainer}>
                    <module.icon width={32} height={32} color="white" />
                    <h1 style={styles.title}>{module.title}</h1>
                </div>
            </header>

            <main style={styles.mainContent}>
                <div style={styles.inputSection}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="received-message">1. Messaggio Ricevuto *</label>
                        <textarea
                            id="received-message"
                            style={styles.textarea}
                            rows={5}
                            placeholder="Incolla qui l'email, il messaggio WhatsApp, ecc..."
                            value={receivedMessage}
                            onChange={(e) => setReceivedMessage(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                     <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="context">2. Contesto (Opzionale)</label>
                        <textarea
                            id="context"
                            style={styles.textarea}
                            rows={3}
                            placeholder="A chi ti rivolgi? Qual è la relazione? Qual è il tuo stato d'animo?"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="objective">3. Obiettivo (Opzionale)</label>
                        <textarea
                            id="objective"
                            style={styles.textarea}
                            rows={3}
                            placeholder="Es: 'Voglio declinare la richiesta mantenendo un buon rapporto', 'Voglio essere assertivo e definire un confine'."
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                     <div style={styles.inputGroup}>
                        <label style={styles.label}>4. Tono della Risposta *</label>
                        <div style={styles.toneSelector}>
                           {(['Empatico', 'Diretto', 'Chiarificatore'] as Tone[]).map(t => (
                               <button 
                                 key={t}
                                 style={{...styles.toneButton, ...(tone === t ? styles.toneButtonActive : {})}}
                                 onClick={() => setTone(t)}
                                 disabled={isLoading}
                               >
                                {t}
                               </button>
                           ))}
                        </div>
                    </div>
                    <button 
                        style={{...styles.generateButton, ...(!isReady ? styles.buttonDisabled : {}), ...(isLoading ? styles.buttonLoading : {})}}
                        onClick={handleGenerate}
                        disabled={!isReady || isLoading}
                    >
                         {isLoading ? (
                            <>
                                <Spinner size={20} color="white" />
                                Creazione della risposta... ({countdown}s)
                            </>
                        ) : (
                            <>
                                Crea Risposta Strategica <SendIcon/>
                            </>
                        )}
                    </button>
                </div>
                
                {generatedResponse && renderResponse()}
            </main>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px', backgroundColor: COLORS.base, minHeight: '100vh' },
  header: { marginBottom: '32px', textAlign: 'center' },
   headerImage: {
    width: '100%',
    height: '250px',
    objectFit: 'cover',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  title: { fontSize: '22px', color: 'white', fontWeight: 'bold', margin: 0 },
  mainContent: { display: 'flex', flexDirection: 'column', gap: '32px' },
  inputSection: { backgroundColor: COLORS.card, padding: '24px', borderRadius: '12px', border: `1px solid ${COLORS.divider}`, display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: {},
  label: { display: 'block', fontSize: '16px', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '8px' },
  textarea: { width: '100%', padding: '12px', fontSize: '15px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, resize: 'vertical', fontFamily: 'inherit', backgroundColor: 'white' },
  toneSelector: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
  },
  toneButton: {
      padding: '10px 16px',
      fontSize: '14px',
      fontWeight: '500',
      border: `1px solid ${COLORS.divider}`,
      backgroundColor: COLORS.cardDark,
      color: COLORS.textSecondary,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
  },
  toneButtonActive: {
      backgroundColor: COLORS.secondary,
      color: 'white',
      borderColor: COLORS.secondary,
      transform: 'scale(1.05)',
  },
  generateButton: { padding: '14px 24px', fontSize: '16px', fontWeight: 'bold', borderRadius: '8px', border: 'none', background: COLORS.primaryGradient, color: 'white', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', alignSelf: 'stretch', boxShadow: '0 4px 15px rgba(14, 58, 93, 0.3)' },
  buttonDisabled: { background: '#ccc', cursor: 'not-allowed', opacity: 0.7, boxShadow: 'none' },
  buttonLoading: {
      backgroundColor: '#E67E22', // Carrot Orange
      cursor: 'wait',
  },
  resultsSection: { backgroundColor: COLORS.card, padding: '24px', borderRadius: '12px', border: `1px solid ${COLORS.divider}`, animation: 'fadeInUp 0.5s ease-out' },
  responseSection: {
      marginBottom: '20px',
      paddingBottom: '20px',
      borderBottom: `1px solid ${COLORS.divider}`,
  },
  responseSectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px',
  },
  responseTitleGreen: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#27ae60', // Darker green
    margin: 0,
  },
  responseTitleOrange: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#d35400', // Darker orange
    margin: 0,
  },
  warningTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#d35400', // Darker orange
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  responseText: {
      fontSize: '16px',
      lineHeight: 1.7,
      color: COLORS.textSecondary,
      whiteSpace: 'pre-wrap',
      margin: 0,
      backgroundColor: COLORS.cardDark,
      padding: '16px',
      borderRadius: '8px',
  },
  strategyList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
  },
  strategyItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      fontSize: '15px',
      color: COLORS.textSecondary,
      lineHeight: 1.6,
  },
  strategyIcon: {
      fontSize: '18px',
  },
  copyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    border: `1px solid ${COLORS.secondary}`,
    backgroundColor: 'transparent',
    color: COLORS.secondary,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500'
  },
};

export default StrategicChatTrainerScreen;
