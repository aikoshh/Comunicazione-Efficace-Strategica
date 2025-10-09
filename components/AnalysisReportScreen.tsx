import React, { useState, useEffect } from "react";
import { AnalysisResult, Exercise } from "../types";
import { COLORS } from "../constants";
import { CheckCircleIcon, RetryIcon, HomeIcon, LightbulbIcon } from "./Icons";
import { soundService } from "../services/soundService";

interface AnalysisReportScreenProps {
  result?: AnalysisResult;
  exercise?: Exercise;
  onRetry: () => void;
  onNext: () => void;
}

export const AnalysisReportScreen: React.FC<AnalysisReportScreenProps> = ({
  result,
  exercise,
  onRetry,
  onNext,
}) => {
  // ✅ se non arriva nulla, mostriamo un messaggio invece di crashare
  if (!result) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: COLORS.base,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          color: COLORS.textPrimary,
          fontSize: "20px",
          textAlign: "center",
        }}
      >
        <h2>⚠️ Nessun risultato disponibile</h2>
        <p>
          Non è stato possibile caricare il report dell’analisi. Torna al menu
          principale o ripeti l’esercizio.
        </p>
        <button
          onClick={onNext}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            backgroundColor: COLORS.secondary,
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Torna al Menu
        </button>
      </div>
    );
  }

  // ✅ normalizzazione sicura
  const safe = {
    score: result.score ?? 0,
    strengths: result.strengths ?? [],
    areasForImprovement: result.areasForImprovement ?? [],
    suggestedResponse: result.suggestedResponse ?? { short: "", long: "" },
  };

  const [activeTab, setActiveTab] = useState<"short" | "long">("short");

  useEffect(() => {
    soundService.playScoreSound(safe.score);
    window.scrollTo(0, 0);
  }, [safe.score]);

  return (
    <div
      style={{
        backgroundColor: COLORS.base,
        minHeight: "100vh",
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.card,
          borderRadius: "12px",
          border: `1px solid ${COLORS.divider}`,
          padding: "32px",
          maxWidth: "800px",
          width: "100%",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ textAlign: "center", color: COLORS.textPrimary }}>
          Report dell'Analisi
        </h1>

        <h2 style={{ color: COLORS.success }}>Punti di Forza</h2>
        <ul>
          {safe.strengths.length > 0 ? (
            safe.strengths.map((s, i) => <li key={i}>{s}</li>)
          ) : (
            <li>Nessun punto di forza disponibile</li>
          )}
        </ul>

        <h2 style={{ color: COLORS.warning }}>Aree di Miglioramento</h2>
        <ul>
          {safe.areasForImprovement.length > 0 ? (
            safe.areasForImprovement.map((a, i) => (
              <li key={i}>{a?.suggestion || a}</li>
            ))
          ) : (
            <li>Nessuna area di miglioramento</li>
          )}
        </ul>

        <h2>Risposta Suggerita</h2>
        <p>
          {activeTab === "short"
            ? safe.suggestedResponse.short
            : safe.suggestedResponse.long}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginTop: "24px",
          }}
        >
          <button
            onClick={onRetry}
            style={{
              padding: "10px 20px",
              border: `1px solid ${COLORS.secondary}`,
              color: COLORS.secondary,
              background: "transparent",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <RetryIcon /> Riprova
          </button>
          <button
            onClick={onNext}
            style={{
              padding: "10px 20px",
              backgroundColor: COLORS.secondary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <HomeIcon /> Menu
          </button>
        </div>
      </div>
    </div>
  );
};
