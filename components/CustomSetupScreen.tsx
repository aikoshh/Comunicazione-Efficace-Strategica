import React, { useState, useRef } from 'react';
import { Module } from '../types';
import { COLORS } from '../constants';
import { HomeIcon, UploadIcon } from './Icons';

interface CustomSetupScreenProps {
  module: Module;
  onStart: (scenario: string, task: string) => void;
  onBack: () => void;
}

const trainingObjectives = [
    "Gestire un conflitto",
    "Dare un feedback efficace",
    "Evitare di dare consigli non richiesti (Smutandamento)",
    "Guidare la conversazione con domande efficaci",
];

const CustomSetupScreen: React.FC<CustomSetupScreenProps> = ({ module, onStart, onBack }) => {
    const [scenario, setScenario] = useState('');
    const [selectedObjective, setSelectedObjective] = useState(trainingObjectives[0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
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

    const isReadyToStart = scenario.trim() !== '' && selectedObjective.trim() !== '';

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <button onClick={onBack} style={styles.backButton}>
                    Torna al Menu
                    <HomeIcon />
                </button>
                <div style={styles.titleContainer}>
                    <module.icon width={40} height={40} color={COLORS.nero} />
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
                    <button onClick={handleUploadClick} style={styles.uploadButton}>
                        <UploadIcon /> Carica da File (.txt)
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".txt"
                        style={{ display: 'none' }}
                    />
                </div>

                <div style={styles.step}>
                    <label style={styles.label}>2. Scegli il tuo obiettivo di allenamento</label>
                    <div style={styles.objectiveOptions}>
                        {trainingObjectives.map(objective => (
                            <button
                                key={objective}
                                onClick={() => setSelectedObjective(objective)}
                                style={{
                                    ...styles.objectiveButton,
                                    ...(selectedObjective === objective ? styles.objectiveButtonSelected : {})
                                }}
                            >
                                {objective}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => onStart(scenario, selectedObjective)}
                    style={{...styles.startButton, ...(!isReadyToStart ? styles.startButtonDisabled : {})}}
                    disabled={!isReadyToStart}
                >
                    Inizia Allenamento
                </button>
            </main>
            <div style={styles.footer}>
                <button onClick={onBack} style={styles.footerButton}>
                    Torna al Menu
                    <HomeIcon />
                </button>
            </div>
        </div>
    );
};


const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px', backgroundColor: COLORS.fondo, minHeight: '100vh' },
  header: { marginBottom: '40px', textAlign: 'center', paddingTop: '60px' }, // Add padding to avoid overlap
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: COLORS.salviaVerde,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    position: 'absolute',
    top: '20px',
    left: '20px',
    transition: 'background-color 0.2s ease',
  },
  titleContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' },
  title: { fontSize: '32px', color: COLORS.nero },
  description: { fontSize: '18px', color: '#666' },
  setupForm: { display: 'flex', flexDirection: 'column', gap: '32px' },
  step: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { fontSize: '18px', fontWeight: '600', color: COLORS.nero, textAlign: 'left' },
  textarea: { width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', resize: 'vertical', fontFamily: 'inherit' },
  uploadButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', fontSize: '14px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: 'white', cursor: 'pointer', alignSelf: 'flex-start' },
  objectiveOptions: { display: 'flex', flexWrap: 'wrap', gap: '12px' },
  objectiveButton: { padding: '10px 16px', fontSize: '14px', borderRadius: '20px', border: '1px solid #ccc', backgroundColor: 'white', cursor: 'pointer', transition: 'background-color 0.2s, color 0.2s, border-color 0.2s' },
  objectiveButtonSelected: { backgroundColor: COLORS.nero, color: 'white', borderColor: COLORS.nero, fontWeight: '600' },
  startButton: { padding: '16px 24px', fontSize: '18px', fontWeight: 'bold', borderRadius: '8px', border: 'none', backgroundColor: COLORS.accentoVerde, color: 'white', cursor: 'pointer', transition: 'background-color 0.2s' },
  startButtonDisabled: { backgroundColor: '#ccc', cursor: 'not-allowed' },
  footer: {
      marginTop: '40px',
      display: 'flex',
      justifyContent: 'center',
  },
  footerButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: COLORS.salviaVerde,
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      cursor: 'pointer',
      fontSize: '16px',
      color: 'white',
      fontWeight: '500',
      transition: 'background-color 0.2s ease',
  },
};

export default CustomSetupScreen;