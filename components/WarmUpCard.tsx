// components/WarmUpCard.tsx
import React, { useState, useEffect } from 'react';
import { COLORS, WARMUP_QUESTIONS } from '../constants';
import { LightbulbIcon } from './Icons';
import { soundService } from '../services/soundService';

export const WarmUpCard: React.FC = () => {
    const [questionIndex, setQuestionIndex] = useState(() => Math.floor(Math.random() * WARMUP_QUESTIONS.length));
    const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const currentQuestion = WARMUP_QUESTIONS[questionIndex];

    const handleAnswerSelect = (index: number) => {
        if (isAnswered) return;
        
        setIsAnswered(true);
        setSelectedAnswerIndex(index);
        
        if (index === currentQuestion.correctAnswerIndex) {
            soundService.playSuccess();
        } else {
            soundService.playScoreSound(20); // Fail sound
        }
    };

    const handleNextQuestion = () => {
        soundService.playClick();
        setIsAnswered(false);
        setSelectedAnswerIndex(null);
        setQuestionIndex(prevIndex => (prevIndex + 1) % WARMUP_QUESTIONS.length);
    };

    const getButtonStyle = (index: number): React.CSSProperties => {
        const baseStyle = styles.optionButton;
        if (!isAnswered) {
            return baseStyle;
        }
        
        if (index === currentQuestion.correctAnswerIndex) {
            return { ...baseStyle, ...styles.correctAnswer };
        }
        if (index === selectedAnswerIndex) {
            return { ...baseStyle, ...styles.incorrectAnswer };
        }
        return { ...baseStyle, ...styles.disabledAnswer };
    };

    return (
        <div style={styles.container}>
            <h3 style={styles.title}><LightbulbIcon /> Warm-Up da 1 Minuto</h3>
            <p style={styles.questionText}>{currentQuestion.question}</p>
            <div style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => (
                    <button
                        key={index}
                        style={getButtonStyle(index)}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={isAnswered}
                    >
                        {option}
                    </button>
                ))}
            </div>
            {isAnswered && (
                <div style={styles.explanationContainer}>
                    <p style={styles.explanationText}>{currentQuestion.explanation}</p>
                    <button style={styles.nextButton} onClick={handleNextQuestion}>
                        Prossima Domanda
                    </button>
                </div>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        backgroundColor: COLORS.card,
        padding: '24px',
        borderRadius: '12px',
        border: `1px solid ${COLORS.divider}`,
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        marginTop: '24px',
    },
    title: {
        fontSize: '18px',
        fontWeight: 600,
        color: COLORS.textPrimary,
        margin: '0 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    questionText: {
        fontSize: '16px',
        color: COLORS.textSecondary,
        lineHeight: 1.6,
        margin: '0 0 20px 0',
    },
    optionsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    optionButton: {
        width: '100%',
        padding: '14px',
        fontSize: '15px',
        textAlign: 'left',
        border: `1px solid ${COLORS.divider}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: COLORS.cardDark,
        color: COLORS.textPrimary,
    },
    correctAnswer: {
        backgroundColor: '#D9F7E6',
        borderColor: COLORS.success,
        color: COLORS.success,
        fontWeight: 'bold',
    },
    incorrectAnswer: {
        backgroundColor: '#FDE2E2',
        borderColor: COLORS.error,
        color: COLORS.error,
        fontWeight: 'bold',
    },
    disabledAnswer: {
        opacity: 0.6,
        cursor: 'default',
    },
    explanationContainer: {
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#E3F2FD',
        borderRadius: '8px',
        border: `1px solid ${COLORS.secondary}`,
        animation: 'fadeIn 0.3s ease-out'
    },
    explanationText: {
        fontSize: '14px',
        color: COLORS.textPrimary,
        lineHeight: 1.6,
        margin: '0 0 16px 0',
    },
    nextButton: {
        padding: '10px 20px',
        fontSize: '15px',
        fontWeight: 'bold',
        color: 'white',
        background: COLORS.primaryGradient,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    },
};