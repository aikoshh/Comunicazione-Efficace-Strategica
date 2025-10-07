import React, { useState, useRef } from 'react';
import { Module, IconComponent } from '../types';
import { COLORS } from '../constants';
import { HomeIcon, UploadIcon, ConflictIcon, FeedbackIcon, ListeningIcon, QuestionIcon } from './Icons';

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
    backgroundColor: string;
}

const trainingObjectives: TrainingObjective[] = [
    {
        id: 'conflict',
        label: "Gestire un conflitto",
        icon: ConflictIcon,
        color: COLORS.error,
        backgroundColor: 'rgba(231, 111, 81, 0.1)',
    },
    {
        id: 'feedback',
        label: "Dare un feedback efficace",
        icon: FeedbackIcon,
        color: COLORS.success,
        backgroundColor: 'rgba(71, 195, 124, 0.1)',
    },
    {
        id: 'listening',
        label: "Evitare di dare consigli non richiesti (Smutandamento)",
        icon: ListeningIcon,
        color: COLORS.secondary,
        backgroundColor: 'rgba(88, 166, 166, 0.1)',
    },
    {
        id: 'questions',
        label: "Guidare la conversazione con domande efficaci",
        icon: QuestionIcon,
        color: COLORS.warning,
        backgroundColor: 'rgba(247, 184, 1, 0.1)',
    },
];


const CustomSetupScreen: React.FC<CustomSetupScreenProps> = ({ module, onStart, onBack }) => {
    const [scenario, setScenario] = useState('');
    const [selectedObjective, setSelectedObjective] = useState<TrainingObjective>(trainingObjectives[0]);
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
        fileInputRef.current?.click();
    };

    const isReadyToStart = scenario.trim() !== '' && selectedObjective.label.trim() !== '';
    
    const hoverStyle = `
      .objective-button:not(.selected):hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 15px rgba(0,0,0,0.08);
        border-color: rgba(0,0,0,0.1);
      }
    `;

    return (
        <div style={styles.container}>
            <style>{hoverStyle}</style>
            <header style={styles.header}>
                <button onClick={onBack} style={styles.backButton}>
                    <HomeIcon /> Menu
                </button>
                <div style={styles.titleContainer}>
                    <module.icon width={32} height={32} color={COLORS.primary} />
                    <h1 style={styles.title}>{module.title}</h1>
                </div>
                <p style={styles.description}>{module.description}</p>
            </header>
            <main style={styles.setupForm}>
                <div style={styles.step}>
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
                        <button onClick={handleUploadClick} style={styles.uploadButton}>
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

                <div style={styles.step}>
                    <label style={styles.label}>2. Scegli il tuo obiettivo di allenamento</label>
                    <div style={styles.objectiveOptions}>
                        {trainingObjectives.map(objective => {
                            const isSelected = selectedObjective.id === objective.id;
                            const Icon = objective.icon;
                            return (
                                <button
                                    key={objective.id}
                                    onClick={() => setSelectedObjective(objective)}
                                    style={{
                                        ...styles.objectiveButton,
                                        backgroundColor: isSelected ? objective.color : objective.backgroundColor,
                                        color: isSelected ? 'white' : COLORS.textPrimary,
                                        border: `2px solid ${isSelected ? objective.color : 'transparent'}`,
                                    }}
                                    className={`objective-button ${isSelected ? 'selected' : ''}`}
                                >
                                    <Icon style={{ ...styles.objectiveIcon, color: isSelected ? 'white' : objective.color }}/>
                                    <span style={styles.objectiveLabel}>{objective.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={() => onStart(scenario, selectedObjective.label)}
                    style={{...styles.startButton, ...(!isReadyToStart ? styles.startButtonDisabled : {})}}
                    disabled={!isReadyToStart}
                >
                    Inizia Allenamento
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
    background: 'transparent',
    color: COLORS.primary,
    border: `1px solid ${COLORS.primary}`,
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    position: 'absolute',
    top: '20px',
    left: '20px',
    transition: 'all 0.2s ease',
  },
  titleContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' },
  title: { fontSize: '32px', color: COLORS.textPrimary, fontWeight: 'bold' },
  description: { fontSize: '18px', color: COLORS.textSecondary, lineHeight: 1.6 },
  setupForm: { display: 'flex', flexDirection: 'column', gap: '32px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: `1px solid ${COLORS.divider}` },
  step: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { fontSize: '18px', fontWeight: '600', color: COLORS.textPrimary, textAlign: 'left' },
  textarea: { width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '12px', border: `1px solid ${COLORS.divider}`, resize: 'vertical', fontFamily: 'inherit' },
  uploadSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  uploadButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', fontSize: '14px', borderRadius: '8px', border: `1px solid ${COLORS.divider}`, backgroundColor: 'white', cursor: 'pointer', color: COLORS.textSecondary },
  fileMessage: {
    fontSize: '13px',
    color: COLORS.secondary,
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
      border: '2px solid transparent',
  },
  objectiveIcon: {
      width: '28px',
      height: '28px',
      flexShrink: 0,
  },
  objectiveLabel: {
      lineHeight: 1.4,
  },
  startButton: { padding: '16px 24px', fontSize: '18px', fontWeight: 'bold', borderRadius: '8px', border: 'none', background: COLORS.primaryGradient, color: 'white', cursor: 'pointer', transition: 'all 0.2s ease', alignSelf: 'center' },
  startButtonDisabled: { background: '#ccc', cursor: 'not-allowed', opacity: 0.7 },
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