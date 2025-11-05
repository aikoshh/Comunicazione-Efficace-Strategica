// components/WarmUpCard.tsx
import React, { useState, useMemo } from 'react';
import { COLORS, WARMUP_QUESTIONS } from '../constants';
import { LightbulbIcon } from './Icons';
import { soundService } from '../services/soundService';

const PASTEL_COLORS = ['#E3F2FD', '#E8F5E9', '#FFF8E1'];

export const WarmUpCard: React.FC = () => {
    const [questionIndex, setQuestionIndex] = useState(() => Math.floor(Math.random() * WARMUP_QUESTIONS.length));
    const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    // Shuffle options and find new correct index for the current question
    const currentQuestionData = useMemo(() => {
        const originalQuestion = WARMUP_QUESTIONS[questionIndex];
        const originalCorrectAnswer = originalQuestion.options[originalQuestion.correctAnswerIndex];

        // Create a shallow copy and shuffle it
        const shuffledOptions = [...originalQuestion.options].sort(() => Math.random() - 0.5);
        const newCorrectIndex = shuffledOptions.indexOf(originalCorrectAnswer);

        return {
            ...originalQuestion,
            options: shuffledOptions,
            correctAnswerIndex: newCorrectIndex,
        };
    }, [questionIndex]);

    const handleAnswerSelect = (index: number) => {
        if (isAnswered) return;
        
        setIsAnswered(true);
        setSelectedAnswerIndex(index);
        
        if (index === currentQuestionData.correctAnswerIndex) {
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
        const baseStyle = {
            ...styles.optionButton,
            backgroundColor: PASTEL_COLORS[index % PASTEL_COLORS.length],
        };

        if (!isAnswered) {
            return baseStyle;
        }
        
        if (index === currentQuestionData.correctAnswerIndex) {
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
            <p style={styles.questionText}>{currentQuestionData.question}</p>
            <div style={styles.optionsContainer}>
                {currentQuestionData.options.map((option, index) => (
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
                    <p style={styles.explanationText}>{currentQuestionData.explanation}</p>
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
        backgroundColor: '#FFF3E0', // Light pastel orange
        borderRadius: '8px',
        border: `1px solid ${COLORS.warning}`, // Orange border
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
