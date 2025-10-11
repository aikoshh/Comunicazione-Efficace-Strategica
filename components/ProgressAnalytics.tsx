import React from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { UserProgress, Module } from '../types';
import { COLORS, MODULES } from '../constants';
import { TrendingUpIcon, BarChartIcon, CheckCircleIcon } from './Icons';

interface ProgressAnalyticsProps {
  userProgress: UserProgress;
}

const getScoreData = (progress: UserProgress) => {
    return progress.scores.map((score, index) => ({
        name: `Ex ${index + 1}`,
        punteggio: score,
    }));
};

const getImprovementData = (progress: UserProgress) => {
    if (!progress.analysisHistory || progress.analysisHistory.length === 0) {
        return [];
    }

    const suggestionCounts = new Map<string, number>();

    progress.analysisHistory.forEach(record => {
        record.areasForImprovement.forEach(area => {
            const suggestion = area.suggestion.trim();
            suggestionCounts.set(suggestion, (suggestionCounts.get(suggestion) || 0) + 1);
        });
    });

    const sortedSuggestions = Array.from(suggestionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3); // Get top 3

    return sortedSuggestions.map(([suggestion, count]) => ({
        name: suggestion,
        conteggio: count,
    })).reverse(); // Reverse for horizontal bar chart
};

const getCompletedModules = (progress: UserProgress): Module[] => {
    const completedIds = new Set(progress.completedModuleIds || []);
    return MODULES.filter(m => !m.isCustom && completedIds.has(m.id));
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    if (payload[0].dataKey === 'punteggio') {
        return (
            <div style={styles.tooltip}>
                <p style={styles.tooltipLabel}>{`${label}: ${payload[0].value}%`}</p>
            </div>
        );
    }
    if (payload[0].dataKey === 'conteggio') {
        return (
            <div style={styles.tooltip}>
                <p style={styles.tooltipLabel}>{`Conteggio: ${payload[0].value}`}</p>
                <p style={styles.tooltipContent}>{payload[0].payload.name}</p>
            </div>
        )
    }
  }
  return null;
};

const formatYAxisTick = (tick: string) => {
    if (tick.length > 40) {
        return tick.substring(0, 40) + '...';
    }
    return tick;
};


export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({ userProgress }) => {
    const scoreData = getScoreData(userProgress);
    const improvementData = getImprovementData(userProgress);
    const completedModules = getCompletedModules(userProgress);
    
    return (
        <section style={styles.container}>
            <h2 style={styles.sectionTitle}>Statistiche di Progresso</h2>
            <div style={styles.grid}>
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}><TrendingUpIcon/> Andamento Punteggi</h3>
                    {scoreData.length > 1 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={scoreData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.divider} />
                                <XAxis dataKey="name" stroke={COLORS.textSecondary}/>
                                <YAxis stroke={COLORS.textSecondary} domain={[0, 100]}/>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="punteggio" stroke={COLORS.secondary} strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p style={styles.placeholder}>Completa almeno due esercizi per vedere il tuo andamento.</p>
                    )}
                </div>

                <div style={styles.card}>
                     <h3 style={styles.cardTitle}><BarChartIcon/> Aree di Miglioramento Frequenti</h3>
                     {improvementData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                             <BarChart data={improvementData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.divider} />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={150} tick={{fontSize: 12}} tickFormatter={formatYAxisTick} stroke={COLORS.textSecondary}/>
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}}/>
                                <Bar dataKey="conteggio" fill={COLORS.warning} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                     ) : (
                         <p style={styles.placeholder}>I tuoi suggerimenti più comuni appariranno qui.</p>
                     )}
                </div>
                
                <div style={{...styles.card, gridColumn: '1 / -1'}}>
                    <h3 style={styles.cardTitle}><CheckCircleIcon/> Moduli Completati</h3>
                    {completedModules.length > 0 ? (
                        <div style={styles.moduleList}>
                            {completedModules.map(module => {
                                const Icon = module.icon;
                                return (
                                <div key={module.id} style={styles.moduleItem}>
                                    <Icon style={{color: COLORS.secondary}}/>
                                    <span>{module.title}</span>
                                </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p style={styles.placeholder}>Nessun modulo completato. Continua ad allenarti!</p>
                    )}
                </div>
            </div>
        </section>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        marginBottom: '48px',
        animation: 'fadeInUp 0.5s 0.2s ease-out both'
    },
    sectionTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: '24px',
        borderBottom: `3px solid ${COLORS.secondary}`,
        paddingBottom: '8px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
    },
    card: {
        backgroundColor: COLORS.card,
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        border: `1px solid ${COLORS.divider}`,
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: 600,
        color: COLORS.textPrimary,
        margin: '0 0 24px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    placeholder: {
        minHeight: '250px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontSize: '15px',
    },
    tooltip: {
        backgroundColor: 'rgba(28, 28, 30, 0.9)',
        color: 'white',
        border: 'none',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    },
    tooltipLabel: {
        margin: 0,
        fontWeight: 'bold',
        fontSize: '14px',
    },
    tooltipContent: {
        margin: '4px 0 0',
        fontSize: '13px',
        maxWidth: '250px',
        whiteSpace: 'normal',
    },
    moduleList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
    },
    moduleItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: COLORS.cardDark,
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: 500,
        color: COLORS.textPrimary
    }
};