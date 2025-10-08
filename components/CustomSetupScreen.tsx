import React, { useState, useRef } from 'react';
import { Module, IconComponent } from '../types';
import { COLORS } from '../constants';
import { HomeIcon, UploadIcon, ConflictIcon, FeedbackIcon, ListeningIcon, QuestionIcon, NextIcon } from './Icons';
import { soundService } from '../services/soundService';

interface CustomSetupScreenProps {
  module: Module;
  onStart: (scenario: string, task: string) => void;
  onBack: () => void;
}

interface TrainingObjective {
    id: string;
    label: string;
    icon: IconComponent;
    color: string;
}

const trainingObjectives: TrainingObjective[] = [
    {
        id: 'feedback',
        label: "Dare un feedback efficace",
        icon: FeedbackIcon,
        color: COLORS.success,
    },
    {
        id: 'listening',
        label: "Evitare di dare consigli non richiesti (Smutandamento)",
        icon: ListeningIcon,
        color: COLORS.secondary,
    },
    {
        id: 'questions',
        label: "Guidare la conversazione con domande efficaci",
        icon: QuestionIcon,
        color: COLORS.warning,
    },
    {
        id: 'conflict',
        label: "Gestire un conflitto",
        icon: ConflictIcon,
        color: COLORS.error,
    },
];


const CustomSetupScreen: React.FC<CustomSetupScreenProps> = ({ module, onStart, onBack }) => {
    const [scenario, setScenario] = useState('');
    const [selectedObjective, setSelectedObjective] = useState<TrainingObjective | null>(null);
    const [fileMessage, setFileMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setFileMessage(''); // Clear previous message
        if (file) {
            if (file.type === 'application/pdf') {
                setFileMessage("Per garantire la migliore analisi, apri il tuo PDF, copia il testo e incollalo direttamente nell'area di testo.");
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''; // Reset file input
                }
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    setScenario(text);
                }
            };
            reader.readAsText(file);
        }
    };

    const handleUploadClick = () => {
        soundService.playClick();
        fileInputRef.current?.click();
    };
    
    const handleObjectiveClick = (objective: TrainingObjective) => {
        soundService.playClick();
        setSelectedObjective(objective);
    };
    
    const handleStartClick = () => {
        if(selectedObjective) {
            soundService.playClick();
            onStart(scenario, selectedObjective.label)
        }
    };
    
    const handleBackClick = () => {
        soundService.playClick();
        onBack();
    };

    const isReadyToStart = scenario.trim() !== '' && selectedObjective !== null;
    
    const hoverStyle = `
      .objective-button:not(.selected):hover {
        background-color: ${COLORS.cardDark};
        transform: translateY(-3px);
      }
      .back-button:hover, .upload-button:hover, .start-button:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }
      .start-button:active {
        transform: translateY(0px);
      }
      #scenario-input::placeholder {
        color: ${COLORS.textSecondary};
        opacity: 1;
      }
       #scenario-input:focus {
        border-color: ${COLORS.secondary};
        box-shadow: 0 0 0 3px rgba(88, 166, 166, 0.2);
    }
    `;

    return (
        <div style={styles.container}>
            <style>{hoverStyle}</style>
            <header style={styles.header}>
                <button onClick={handleBackClick} className="back-button" style={styles.backButton}>
                    <HomeIcon /> Menu
                </button>
                <div style={styles.titleContainer}>
                    <module.icon width={32} height={32} color={COLORS.secondary} />
                    <h1 style={styles.title}>{module.title}</h1>
                </div>
                <p style={styles.description}>{module.description}</p>
            </header>
            <main style={styles.setupForm}>
                <div style={{...styles.step, animation: 'fadeInUp 0.3s ease-out both'}}>
                    <label style={styles.label} htmlFor="scenario-input">1. Descrivi il tuo scenario</label>
                    <textarea
                        id="scenario-input"
                        style={styles.textarea}
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        placeholder="Es: 'Un collega mi ha criticato davanti a tutto il team durante una riunione...'"
                        rows={8}
                    />
                    <div style={styles.uploadSection}>
                        <button onClick={handleUploadClick} style={styles.uploadButton} className="upload-button">
                            <UploadIcon /> Carica da File (.txt, .pdf)
                        </button>
                        {fileMessage && <p style={styles.fileMessage}>{fileMessage}</p>}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".txt,.pdf"
                        style={{ display: 'none' }}
                    />
                </div>

                <div style={{...styles.step, animation: 'fadeInUp 0.3s 0.1s ease-out both'}}>
                    <label style={styles.label}>2. Scegli il tuo obiettivo di allenamento</label>
                    <div style={styles.objectiveOptions}>
                        {trainingObjectives.map(objective => {
                            const isSelected = selectedObjective?.id === objective.id;
                            const Icon = objective.icon;
                            return (
                                <button
                                    key={objective.id}
                                    onClick={() => handleObjectiveClick(objective)}
                                    onMouseEnter={() => soundService.playHover()}
                                    style={{
                                        ...styles.objectiveButton,
                                        backgroundColor: isSelected ? objective.color : 'white',
                                        color: isSelected ? 'white' : COLORS.textPrimary,
                                        border: `2px solid ${isSelected ? objective.color : COLORS.divider}`,
                                        transform: isSelected ? 'translateY(-3px)' : 'none',
                                    }}
                                    className={`objective-button ${isSelected ? 'selected' : ''}`}
                                >
                                    <Icon style={{ ...styles.objectiveIcon, color: isSelected ? 'white' : COLORS.textPrimary }}/>
                                    <span style={styles.objectiveLabel}>{objective.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={handleStartClick}
                    style={{...styles.startButton, ...(!isReadyToStart ? styles.startButtonDisabled : {}), animation: 'fadeInUp 0.3s 0.2s ease-out both'}}
                    disabled={!isReadyToStart}
                    className="start-button"
                >
                    Inizia Allenamento <NextIcon/>
                </button>
            </main>
        </div>
    );
};


const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px', backgroundColor: COLORS.base, minHeight: '100vh' },
  header: { marginBottom: '40px', textAlign: 'center', paddingTop: '60px' }, // Add padding to avoid overlap
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: COLORS.secondary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    position: 'absolute',
    top: '20px',
    left: '20px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  titleContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' },
  title: { fontSize: '32px', color: COLORS.textPrimary, fontWeight: 'bold' },
  description: { fontSize: '18px', color: COLORS.textSecondary, lineHeight: 1.6 },
  setupForm: { display: 'flex', flexDirection: 'column', gap: '32px', backgroundColor: COLORS.accentBeige, padding: '24px', borderRadius: '12px' },
  step: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { fontSize: '18px', fontWeight: '600', color: COLORS.textPrimary, textAlign: 'left' },
  textarea: { width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '12px', border: `1px solid ${COLORS.divider}`, resize: 'vertical', fontFamily: 'inherit', backgroundColor: 'white', color: COLORS.textPrimary, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' },
  uploadSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  uploadButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', fontSize: '14px', borderRadius: '8px', border: 'none', backgroundColor: COLORS.secondary, cursor: 'pointer', color: 'white', transition: 'opacity 0.2s ease, transform 0.2s ease' },
  fileMessage: {
    fontSize: '13px',
    color: COLORS.textSecondary,
    margin: 0,
    flex: 1,
  },
  objectiveOptions: { 
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
  },
  objectiveButton: { 
      padding: '16px',
      fontSize: '15px',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease-out',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      textAlign: 'left',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  objectiveIcon: {
      width: '28px',
      height: '28px',
      flexShrink: 0,
  },
  objectiveLabel: {
      lineHeight: 1.4,
  },
  startButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 24px', fontSize: '18px', fontWeight: 'bold', borderRadius: '8px', border: 'none', background: COLORS.primaryGradient, color: 'white', cursor: 'pointer', transition: 'all 0.2s ease', alignSelf: 'center', boxShadow: '0 4px 15px rgba(14, 58, 93, 0.3)' },
  startButtonDisabled: { background: '#ccc', cursor: 'not-allowed', opacity: 0.7, color: '#666', boxShadow: 'none' },
  footer: {
      marginTop: '40px',
      display: 'flex',
      justifyContent: 'center',
  },
  footerButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'transparent',
      border: `1px solid ${COLORS.primary}`,
      borderRadius: '8px',
      padding: '10px 20px',
      cursor: 'pointer',
      fontSize: '16px',
      color: COLORS.primary,
      fontWeight: '500',
      transition: 'all 0.2s ease',
  },
};

export default CustomSetupScreen;