import React, { useState } from 'react';
import { Module, PersonalizationData } from '../types';
import { COLORS } from '../constants';
import { NextIcon } from './Icons';
import { soundService } from '../services/soundService';
import { generateCustomExercise } from '../services/geminiService';
import { FullScreenLoader } from './Loader';
import { useToast } from '../hooks/useToast';

interface CustomSetupScreenProps {
  module: Module;
  onStart: (scenario: string, task: string, customObjective?: string) => void;
  onBack: () => void;
  onApiKeyError: (error: string) => void;
}


export const CustomSetupScreen: React.FC<CustomSetupScreenProps> = ({ module, onStart, onBack, onApiKeyError }) => {
    const [personalizationData, setPersonalizationData] = useState<PersonalizationData>({
        professione: '',
        livelloCarriera: '',
        eta: '',
        contestoComunicativo: '',
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
                addToast('Per favore, completa tutti i campi del profilo.', 'error');
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
                    Crea un esercizio su misura per te. Compila il tuo profilo e lascia che l'AI generi lo scenario perfetto per le tue esigenze.
                </p>
            </header>
            <form onSubmit={handleCreateAndStart} style={styles.setupForm}>
                <h2 style={styles.formTitle}>1. Definisci il Tuo Profilo</h2>

                <div style={styles.inputGrid}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="professione">Professione</label>
                        <input id="professione" type="text" style={styles.input} className="form-input" value={personalizationData.professione} onChange={(e) => handleInputChange('professione', e.target.value)} placeholder="Es: Project Manager, Sviluppatore" />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="livelloCarriera">Livello di Carriera</label>
                        <select id="livelloCarriera" style={styles.select} className="form-select" value={personalizationData.livelloCarriera} onChange={(e) => handleInputChange('livelloCarriera', e.target.value)}>
                            <option value="">Seleziona...</option>
                            <option value="Studente/Neolaureato">Studente/Neolaureato</option>
                            <option value="Junior/Entry-level">Junior/Entry-level</option>
                            <option value="Mid-level/Specialist">Mid-level/Specialist</option>
                            <option value="Senior/Expert">Senior/Expert</option>
                            <option value="Manager/Team Leader">Manager/Team Leader</option>
                            <option value="Director/Executive">Director/Executive</option>
                            <option value="Imprenditore/Libero Professionista">Imprenditore/Libero Professionista</option>
                        </select>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="eta">Fascia d'età</label>
                        <select id="eta" style={styles.select} className="form-select" value={personalizationData.eta} onChange={(e) => handleInputChange('eta', e.target.value)}>
                            <option value="">Seleziona...</option>
                            <option value="<25 anni">&lt;25 anni</option>
                            <option value="25-35 anni">25-35 anni</option>
                            <option value="36-50 anni">36-50 anni</option>
                            <option value=">50 anni">&gt;50 anni</option>
                        </select>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="contestoComunicativo">Contesto Comunicativo Tipico</label>
                        <select id="contestoComunicativo" style={styles.select} className="form-select" value={personalizationData.contestoComunicativo} onChange={(e) => handleInputChange('contestoComunicativo', e.target.value)}>
                             <option value="">Seleziona...</option>
                             <option value="Meeting con il team interno">Meeting con il team interno</option>
                             <option value="Conversazioni 1-to-1 con colleghi o manager">Conversazioni 1-to-1</option>
                             <option value="Interazioni con clienti o fornitori">Interazioni con clienti/fornitori</option>
                             <option value="Presentazioni o public speaking">Presentazioni/Public Speaking</option>
                             <option value="Negoziazioni o gestione conflitti">Negoziazioni/Gestione Conflitti</option>
                             <option value="Comunicazione in ambito familiare/personale">Ambito familiare/personale</option>
                        </select>
                    </div>
                </div>

                <div style={{...styles.inputGroup, gridColumn: '1 / -1'}}>
                    <label style={styles.label} htmlFor="sfidaPrincipale">Qual è la tua sfida di comunicazione più grande?</label>
                    <input id="sfidaPrincipale" type="text" style={styles.input} className="form-input" value={personalizationData.sfidaPrincipale} onChange={(e) => handleInputChange('sfidaPrincipale', e.target.value)} placeholder="Es: 'Dire di no senza sentirmi in colpa', 'Gestire le obiezioni dei clienti'" />
                </div>
                
                <div style={{ paddingBottom: '8px', borderBottom: `2px solid ${COLORS.secondary}` }}></div>
                <button type="submit" style={{...styles.startButton, ...(!isReadyToStart ? styles.startButtonDisabled : {})}} disabled={!isReadyToStart} className="start-button">
                    Crea e Inizia Allenamento <NextIcon/>
                </button>
            </form>
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
  description: { fontSize: '18px', color: COLORS.textSecondary, lineHeight: 1.6, maxWidth: '650px', margin: '0 auto' },
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
      transition: 'border-color 0.2s, box-shadow 0.2s' 
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
};
