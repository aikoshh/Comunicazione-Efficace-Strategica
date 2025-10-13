import React, { useState, useEffect } from 'react';
import { ProgressOverviewData, ScoreExplanation, User, UserProgress } from '../types';
import { getProgressOverview, getScoreExplanation } from '../services/progressionService';
import { COLORS } from '../constants';
import { InfoIcon } from './Icons';
import { ExplainScoreModal } from './ExplainScoreModal';

const levelThresholds = [
  { id: "poco_efficace", min: 0, label: "Comunicatore poco efficace" },
  { id: "quasi_efficace", min: 40, label: "Comunicatore quasi efficace" },
  { id: "efficace", min: 70, label: "Comunicatore efficace" },
  { id: "efficace_strategico", min: 90, label: "Comunicatore efficace e strategico" },
];

interface ProgressOverviewProps {
  user: User;
  progress: UserProgress | undefined;
}

const ProgressOverviewSkeleton: React.FC = () => (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse-bg {
          0% { background-color: ${COLORS.divider}; }
          50% { background-color: #E0DCD7; }
          100% { background-color: ${COLORS.divider}; }
        }
      `}</style>
      <div style={styles.header}>
        <div style={{...styles.skeletonText, width: '200px', height: '27px', animation: 'pulse-bg 1.5s infinite ease-in-out'}} />
        <div style={{...styles.skeletonPill, width: '150px', height: '26px', animation: 'pulse-bg 1.5s infinite ease-in-out'}} />
      </div>
      <div style={{ ...styles.progressBar, animation: 'pulse-bg 1.5s infinite ease-in-out' }} />
      <div style={{ ...styles.footer, justifyContent: 'space-between' }}>
        <div style={{...styles.skeletonText, width: '120px', height: '22px', animation: 'pulse-bg 1.5s infinite ease-in-out'}} />
        <div style={{...styles.skeletonText, width: '150px', height: '22px', animation: 'pulse-bg 1.5s infinite ease-in-out'}} />
      </div>
    </div>
);


export const ProgressOverview: React.FC<ProgressOverviewProps> = ({ user, progress }) => {
  const [overviewData, setOverviewData] = useState<ProgressOverviewData | null>(null);
  const [explanationData, setExplanationData] = useState<ScoreExplanation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getProgressOverview(user, progress);
        setOverviewData(data);
        // Set a timeout to allow the component to render before starting the animation
        setTimeout(() => setProgressWidth(data.progress_bar.value), 100);
      } catch (error) {
        console.error("Failed to fetch progress overview:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, progress]);

  const handleOpenModal = async () => {
    if (!explanationData) {
      const data = await getScoreExplanation();
      setExplanationData(data);
    }
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <ProgressOverviewSkeleton />;
  }

  if (!overviewData) {
    return null; // Don't render anything if data fetch fails
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.welcomeText}>{overviewData.header.welcome}</span>
        <span style={styles.levelPill}>{overviewData.header.level}</span>
      </div>
      <div style={styles.progressBarContainer}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressBarFill, width: `${progressWidth}%` }} />
        </div>
        {levelThresholds.map(threshold => threshold.min > 0 && (
            <div key={threshold.id} style={{ ...styles.milestone, left: `${threshold.min}%` }} title={`${threshold.label} (${threshold.min})`}></div>
        ))}
      </div>
      <div style={styles.footer}>
        <span style={styles.scoreLabel}>Punteggio: <strong>{overviewData.progress_bar.label}</strong></span>
        <button onClick={handleOpenModal} style={styles.explainLink}>
          <InfoIcon width={16} height={16} />
          <span>Vedi come è calcolato</span>
        </button>
      </div>

      <ExplainScoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scoreData={explanationData}
      />
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
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  welcomeText: {
    fontSize: '18px',
    fontWeight: 500,
    color: COLORS.textPrimary,
  },
  levelPill: {
    padding: '4px 12px',
    borderRadius: '999px',
    background: COLORS.secondary,
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  progressBarContainer: {
      position: 'relative',
      width: '100%',
      padding: '4px 0',
  },
  progressBar: {
    height: '12px',
    width: '100%',
    backgroundColor: COLORS.divider,
    borderRadius: '12px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    transition: 'width 1s cubic-bezier(0.25, 1, 0.5, 1)',
    borderRadius: '12px',
  },
  milestone: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '4px',
    height: '20px',
    backgroundColor: COLORS.card,
    border: `1px solid ${COLORS.divider}`,
    borderRadius: '2px',
    zIndex: 1,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
  },
  scoreLabel: {
    fontSize: '15px',
    color: COLORS.textSecondary,
  },
  explainLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: COLORS.secondary,
    textDecoration: 'none',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontWeight: 500,
    padding: '4px'
  },
  skeletonText: {
    backgroundColor: COLORS.divider,
    borderRadius: '4px',
  },
  skeletonPill: {
    backgroundColor: COLORS.divider,
    borderRadius: '999px',
  }
};