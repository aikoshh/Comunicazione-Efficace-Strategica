import React, { useState } from 'react';
import { Module, PersonalizationData } from '../types';
import { COLORS } from '../constants';
import { NextIcon } from './Icons';
import { soundService } from '../services/soundService';
import { generateCustomExercise } from '../services/geminiService';
import { FullScreenLoader } from './Loader';
import { useToast } from '../hooks/useToast';
import { mainLogoUrl } from '../assets';

interface CustomSetupScreenProps {
  module: Module;
  onStart: (scenario: string, task: string, customObjective?: string) => void;
  onBack: () => void;
  onApiKeyError: (error: string) => void;
}


export const CustomSetupScreen: React.FC<CustomSetupScreenProps> = ({ module, onStart, onBack, onApiKeyError }) => {
    const [personalizationData, setPersonalizationData] = useState<PersonalizationData>({
        areaDiVita: '',
        ruoloContesto: '',
        interlocutore: '',
        obiettivoConversazione: '',
        sfidaPrincipale: '',
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const { addToast } = useToast();

    const handleInputChange = (field: keyof PersonalizationData, value: string) => {
        setPersonalizationData(prev => ({ ...prev, [field]: value }));
    };

    const handleCreateAndStart = async (e: React.FormEvent) => {
        e.preventDefault();
        soundService.playClick();
        
        for (const key in personalizationData) {
            if (!personalizationData[key as keyof PersonalizationData]) {
                addToast('Per favore, completa tutti i campi per creare il tuo scenario.', 'error');
                return;
            }
        }
        
        setIsGenerating(true);
        try {
            const { scenario, task } = await generateCustomExercise(personalizationData);
            onStart(scenario, task);
        } catch (error: any) {
            console.error(error);
            if (error.message.includes('API key') || error.message.includes('API_KEY')) {
                onApiKeyError(error.message);
            } else {
                addToast(error.message || "Si è verificato un errore sconosciuto.", 'error');
            }
            setIsGenerating(false);
        }
    };
    
    const isReadyToStart = Object.values(personalizationData).every(value => typeof value === 'string' && value.trim() !== '');
    
    const hoverStyle = `
      .form-input:focus, .form-select:focus {
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

    if (isGenerating) {
        return <FullScreenLoader estimatedTime={20} />;
    }
    
    const isHeaderVideo = module.headerImage && module.headerImage.toLowerCase().endsWith('.mp4');

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
                <p style={styles.description}>
                    Crea un esercizio su misura per te. Descrivi la situazione e lascia che l'AI generi lo scenario perfetto per le tue esigenze.
                </p>
            </header>
            <form onSubmit={handleCreateAndStart} style={styles.setupForm}>
                <h2 style={styles.formTitle}>Definisci il Tuo Scenario</h2>

                <div style={styles.inputGrid}>
                    <div style={{...styles.inputGroup, gridColumn: '1 / -1'}}>
                        <label style={styles.label} htmlFor="areaDiVita">1. Scegli un'area della tua vita</label>
                        <select id="areaDiVita" style={styles.select} className="form-select" value={personalizationData.areaDiVita} onChange={(e) => handleInputChange('areaDiVita', e.target.value)}>
                            <option value="">Seleziona un'area...</option>
                            <option value="Lavoro">Lavoro (colleghi, capo, clienti)</option>
                            <option value="Relazioni Personali">Relazioni Personali (partner, famiglia, amici)</option>
                            <option value="Crescita Personale">Crescita Personale (gestione di sé, nuove abitudini)</option>
                        </select>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="ruoloContesto">2. Il tuo ruolo nel contesto</label>
                        <input id="ruoloContesto" type="text" style={styles.input} className="form-input" value={personalizationData.ruoloContesto} onChange={(e) => handleInputChange('ruoloContesto', e.target.value)} placeholder="Es: Manager, Genitore, Amico/a" />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="interlocutore">3. Con chi devi comunicare?</label>
                        <input id="interlocutore" type="text" style={styles.input} className="form-input" value={personalizationData.interlocutore} onChange={(e) => handleInputChange('interlocutore', e.target.value)} placeholder="Es: Un cliente scontento, Mio figlio" />
                    </div>

                    <div style={{...styles.inputGroup, gridColumn: '1 / -1'}}>
                        <label style={styles.label} htmlFor="obiettivoConversazione">4. Qual è il tuo obiettivo principale?</label>
                        <input id="obiettivoConversazione" type="text" style={styles.input} className="form-input" value={personalizationData.obiettivoConversazione} onChange={(e) => handleInputChange('obiettivoConversazione', e.target.value)} placeholder="Es: Calmare la situazione e trovare un accordo" />
                    </div>

                    <div style={{...styles.inputGroup, gridColumn: '1 / -1'}}>
                        <label style={styles.label} htmlFor="sfidaPrincipale">5. Qual è la tua sfida più grande in questa situazione?</label>
                        <input id="sfidaPrincipale" type="text" style={styles.input} className="form-input" value={personalizationData.sfidaPrincipale} onChange={(e) => handleInputChange('sfidaPrincipale', e.target.value)} placeholder="Es: Paura di ferire i suoi sentimenti, gestire la sua rabbia" />
                    </div>
                </div>
                
                <div style={{ paddingBottom: '8px', borderBottom: `2px solid ${COLORS.secondary}` }}></div>
                <button type="submit" style={{...styles.startButton, ...(!isReadyToStart ? styles.startButtonDisabled : {})}} disabled={!isReadyToStart} className="start-button">
                    Crea e Inizia Allenamento <NextIcon/>
                </button>
            </form>
            <div style={styles.logoContainer}>
                <img src={mainLogoUrl} alt="CES Coach Logo" style={styles.footerLogo} />
            </div>
        </div>
    );
};


const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px', backgroundColor: COLORS.base, minHeight: '100vh' },
  header: { marginBottom: '40px', textAlign: 'center' },
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
    marginBottom: '16px',
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '22px',
    color: 'white',
    fontWeight: 'bold',
    margin: 0
  },
  description: { fontSize: '16px', color: COLORS.textSecondary, lineHeight: 1.6, maxWidth: '650px', margin: '0 auto' },
  setupForm: { display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: COLORS.card, padding: '32px', borderRadius: '12px', border: `1px solid ${COLORS.divider}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  formTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: COLORS.primary,
    margin: '0 0 8px 0',
    paddingBottom: '8px',
    borderBottom: `2px solid ${COLORS.secondary}`
  },
  inputGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: { fontSize: '15px', fontWeight: '600', color: COLORS.textPrimary, marginBottom: '8px' },
  input: { 
      width: '100%', 
      padding: '12px 16px', 
      fontSize: '16px', 
      borderRadius: '8px', 
      border: `1px solid ${COLORS.divider}`, 
      fontFamily: 'inherit', 
      backgroundColor: 'white', 
      color: COLORS.textPrimary, 
      outline: 'none', 
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxSizing: 'border-box'
  },
  select: {
      width: '100%', 
      padding: '12px 16px', 
      fontSize: '16px', 
      borderRadius: '8px', 
      border: `1px solid ${COLORS.divider}`, 
      fontFamily: 'inherit', 
      backgroundColor: 'white', 
      color: COLORS.textPrimary, 
      outline: 'none', 
      transition: 'border-color 0.2s, box-shadow 0.2s',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 0.75rem center',
      backgroundSize: '16px 12px',
      boxSizing: 'border-box'
  },
  startButton: { 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: '8px', 
      padding: '16px 24px', 
      fontSize: '18px', 
      fontWeight: 'bold', 
      borderRadius: '8px', 
      border: 'none', 
      background: COLORS.primaryGradient, 
      color: 'white', 
      cursor: 'pointer', 
      transition: 'all 0.2s ease', 
      alignSelf: 'center', 
      marginTop: '16px',
      boxShadow: '0 4px 15px rgba(14, 58, 93, 0.3)' 
  },
  startButtonDisabled: { 
      background: '#ccc', 
      cursor: 'not-allowed', 
      opacity: 0.7, 
      color: '#666', 
      boxShadow: 'none' 
  },
  logoContainer: {
    textAlign: 'center',
    paddingTop: '40px',
  },
  footerLogo: {
    width: '150px',
    height: 'auto',
    opacity: 0.7
  }
};