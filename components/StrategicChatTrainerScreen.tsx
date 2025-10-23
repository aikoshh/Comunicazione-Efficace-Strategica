import React, { useState, useRef } from 'react';
import { Module } from '../types';
import { COLORS } from '../constants';
import { SendIcon, WrittenIcon, LightbulbIcon, DocumentTextIcon } from './Icons';
import { soundService } from '../services/soundService';
import { generateStrategicChatResponse } from '../services/geminiService';
import { FullScreenLoader } from './Loader';
import { useToast } from '../hooks/useToast';

interface StrategicChatTrainerScreenProps {
  module: Module;
  onBack: () => void;
  onApiKeyError: (error: string) => void;
}

const ResponseDisplay: React.FC<{ markdownText: string }> = ({ markdownText }) => {
    const sections = markdownText.split(/-\sTitolo:\s/g).filter(s => s.trim());
    
    const titleIconMap: { [key: string]: React.FC<any> } = {
        'risposta breve': WrittenIcon,
        'risposta elaborata': WrittenIcon, // Changed to match "Risposta Breve"
        'spiegazione della strategia': LightbulbIcon,
    };

    const parseSection = (sectionText: string) => {
        const lines = sectionText.split('\n');
        const title = lines[0].replace(/"/g, '').trim();
        const content = lines.slice(1).join('\n');

        const normalizedTitle = title.toLowerCase();
        const iconKey = Object.keys(titleIconMap).find(key => normalizedTitle.includes(key));
        const IconComponent = iconKey ? titleIconMap[iconKey] : null;

        const renderContent = (text: string) => {
            return text.split('\n').map((line, i) => {
                if (line.trim().startsWith('* ')) {
                    const boldedLine = line.trim().substring(2).split(/(\*\*.*?\*\*)/g).map((part, j) => 
                        part.startsWith('**') ? <strong key={j} style={{color: COLORS.primary}}>{part.slice(2, -2)}</strong> : part
                    );
                    return <li key={i} style={styles.listItem}>{boldedLine}</li>;
                }
                const boldedLine = line.split(/(\*\*.*?\*\*)/g).map((part, j) => 
                    part.startsWith('**') ? <strong key={j} style={{color: COLORS.primary}}>{part.slice(2, -2)}</strong> : part
                );
                return <p key={i} style={styles.responseText}>{boldedLine}</p>;
            });
        };
        
        const isExplanation = title.toLowerCase().includes('spiegazione');

        return (
            <div key={title} style={styles.responseSection}>
                <div style={styles.responseSectionTitleContainer}>
                    {IconComponent && <IconComponent style={styles.responseSectionIcon} />}
                    <h3 style={styles.responseSectionTitle}>{title}</h3>
                </div>
                {isExplanation ? <ul>{renderContent(content)}</ul> : renderContent(content)}
            </div>
        );
    };

    return <div style={styles.responseContainer}>{sections.map(parseSection)}</div>;
};

// FIX: Changed to a named export to match the import style in App.tsx.
export const StrategicChatTrainerScreen: React.FC<StrategicChatTrainerScreenProps> = ({ module, onBack, onApiKeyError }) => {
    const [receivedMessage, setReceivedMessage] = useState('');
    const [objective, setObjective] = useState('');
    const [context, setContext] = useState('');
    const [tone, setTone] = useState<'Empatico' | 'Diretto' | 'Chiarificatore'>('Empatico');
    
    const [isLoading, setIsLoading] = useState(false);
    const [generatedResponse, setGeneratedResponse] = useState<string | null>(null);
    const { addToast } = useToast();
    const responseAreaRef = useRef<HTMLDivElement>(null);


    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        soundService.playClick();
        if (!receivedMessage || !objective) {
            addToast("Il messaggio ricevuto e l'obiettivo sono obbligatori.", 'error');
            return;
        }
        setIsLoading(true);
        setGeneratedResponse(null);
        
        setTimeout(() => {
            responseAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        try {
            const response = await generateStrategicChatResponse(receivedMessage, objective, context, tone);
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
    
    const isReadyToStart = receivedMessage.trim() !== '' && objective.trim() !== '';
    const isHeaderVideo = module.headerImage && module.headerImage.toLowerCase().endsWith('.mp4');

    const hoverStyle = `
      .form-input:focus, .form-select:focus, .form-textarea:focus {
        border-color: ${COLORS.secondary};
        box-shadow: 0 0 0 3px rgba(88, 166, 166, 0.2);
      }
      .start-button:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }
      .start-button:active {
        transform: translateY(0px) scale(0.98);
      }
    `;

    return (
        <div style={styles.container}>
            <style>{hoverStyle}</style>
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
                <p style={styles.description}>{module.description}</p>
            </header>
            <form onSubmit={handleGenerate} style={styles.setupForm}>
                <h2 style={styles.formTitle}>Crea la tua risposta</h2>
                <div style={styles.inputGroup}>
                    <label style={styles.label} htmlFor="receivedMessage">Messaggio ricevuto (WhatsApp, email, ecc.)</label>
                    <textarea id="receivedMessage" style={styles.textarea} className="form-textarea" value={receivedMessage} onChange={(e) => setReceivedMessage(e.target.value)} placeholder="Es: 'Non sono soddisfatto del lavoro, dobbiamo rifare tutto.'" rows={3}/>
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label} htmlFor="objective">Il tuo obiettivo</label>
                    <input id="objective" type="text" style={styles.input} className="form-input" value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Es: 'Capire il problema senza essere difensivo'" />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label} htmlFor="context">Contesto (opzionale)</label>
                    <input id="context" type="text" style={styles.input} className="form-input" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Es: 'È un cliente importante ma spesso critico'" />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label} htmlFor="tone">Tono strategico da usare</label>
                    <select id="tone" style={styles.select} className="form-select" value={tone} onChange={(e) => setTone(e.target.value as any)}>
                        <option value="Empatico">Empatico</option>
                        <option value="Diretto">Diretto</option>
                        <option value="Chiarificatore">Chiarificatore</option>
                    </select>
                </div>
                <button type="submit" style={{...styles.startButton, ...(!isReadyToStart ? styles.startButtonDisabled : {})}} disabled={!isReadyToStart || isLoading} className="start-button">
                    {isLoading ? 'Generazione...' : (<>Genera Risposta Strategica <SendIcon/></>)}
                </button>
            </form>

            <div ref={responseAreaRef}>
                {isLoading && <FullScreenLoader estimatedTime={10} />}

                {generatedResponse && !isLoading && (
                     <ResponseDisplay markdownText={generatedResponse} />
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px', backgroundColor: COLORS.base, minHeight: '100vh' },
  header: { marginBottom: '40px', textAlign: 'center' },
  headerImage: {
    width: '100%', height: '250px', objectFit: 'cover', borderRadius: '12px',
    marginBottom: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  titleContainer: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
    marginBottom: '16px', background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
    padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  title: { fontSize: '22px', color: 'white', fontWeight: 'bold', margin: 0 },
  description: { fontSize: '18px', color: COLORS.textSecondary, lineHeight: 1.6, maxWidth: '650px', margin: '0 auto' },
  setupForm: { display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: COLORS.card, padding: '32px', borderRadius: '12px', border: `1px solid ${COLORS.divider}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '32px' },
  formTitle: {
    fontSize: '20px', fontWeight: 'bold', color: COLORS.primary, margin: '0 0 8px 0',
    paddingBottom: '8px', borderBottom: `2px solid ${COLORS.secondary}`
  },
  inputGroup: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '15px', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '8px' },
  input: { 
      padding: '12px 16px', fontSize: '16px', borderRadius: '8px', 
      border: `1px solid ${COLORS.divider}`, fontFamily: 'inherit', backgroundColor: 'white', 
      color: COLORS.textPrimary, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' 
  },
  textarea: {
      padding: '12px 16px', fontSize: '16px', borderRadius: '8px', resize: 'vertical',
      border: `1px solid ${COLORS.divider}`, fontFamily: 'inherit', backgroundColor: 'white', 
      color: COLORS.textPrimary, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  select: {
      padding: '12px 16px', fontSize: '16px', borderRadius: '8px', 
      border: `1px solid ${COLORS.divider}`, fontFamily: 'inherit', backgroundColor: 'white', 
      color: COLORS.textPrimary, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '16px 12px',
  },
  startButton: { 
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
      padding: '14px 24px', fontSize: '16px', fontWeight: 'bold', borderRadius: '8px', 
      border: 'none', background: COLORS.primaryGradient, color: 'white', cursor: 'pointer', 
      transition: 'all 0.2s ease', alignSelf: 'stretch', marginTop: '8px',
      boxShadow: '0 4px 15px rgba(14, 58, 93, 0.3)' 
  },
  startButtonDisabled: { 
      background: '#ccc', cursor: 'not-allowed', opacity: 0.7, 
      color: '#666', boxShadow: 'none' 
  },
  responseContainer: {
      backgroundColor: COLORS.card, padding: '32px', borderRadius: '12px',
      border: `1px solid ${COLORS.divider}`, animation: 'fadeInUp 0.5s ease-out both'
  },
  responseSection: { marginBottom: '24px' },
  responseSectionTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '8px',
    borderBottom: `2px solid ${COLORS.secondary}`,
    marginBottom: '12px',
  },
  responseSectionIcon: {
      width: '24px',
      height: '24px',
      color: COLORS.primary,
      flexShrink: 0,
  },
  responseSectionTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: COLORS.primary,
      margin: 0,
  },
  responseText: {
      fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.7,
      whiteSpace: 'pre-wrap', margin: '0 0 10px 0'
  },
  listItem: {
      fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.7,
      marginBottom: '10px', marginLeft: '20px'
  }
};