import { CompetenceKey, CompetenceScores } from '../types';

/** Stato percentuali: ogni competenza 0–33, "nessuna" 0–100 (compensa). */
export interface ProgressSlices extends CompetenceScores {
  nessuna: number; // calcolata
}

export interface ProgressPieOptions {
  /** Arrotondamento visivo (default: 1 decimale). */
  roundTo?: number;
  /** Callback quando i valori cambiano (per UI reactive). */
  onChange?: (slices: ProgressSlices) => void;
}

export class ProgressPieManager {
  private static readonly MAX_COMP = 33;
  private opts: ProgressPieOptions;
  private slices: ProgressSlices;

  constructor(initial?: Partial<CompetenceScores>, opts?: ProgressPieOptions) {
    this.opts = { roundTo: 1, ...opts };
    const base: ProgressSlices = {
      ascolto: 0,
      riformulazione: 0,
      assertivita: 0,
      gestione_conflitto: 0,
      nessuna: 100
    };
    this.slices = { ...base, ...initial };
    this.recompute();
  }

  /** Restituisce una copia dei valori correnti (già arrotondati). */
  getData(): ProgressSlices {
    return { ...this.slices };
  }

  /** Aggiorna una competenza con il risultato dell’ultimo esercizio (0–100). */
  updateWithExercise(key: CompetenceKey, newExercisePercent: number): ProgressSlices {
    const safeIncoming = this.clamp(newExercisePercent, 0, 100);

    // 1) Media tra attuale e nuovo punteggio, poi cap a 33
    const current = this.slices[key];
    const averaged = (current + safeIncoming) / 2;
    const capped = this.clamp(averaged, 0, ProgressPieManager.MAX_COMP);
    this.slices[key] = capped;

    // 2) Ricalcolo "nessuna" + normalizzazione
    this.recompute();

    // 3) Notifica
    this.opts.onChange?.(this.getData());
    return this.getData();
  }

  /** Imposta direttamente il valore di una competenza (0–33), utile per import/stato. */
  setCompetence(key: CompetenceKey, percent: number): ProgressSlices {
    this.slices[key] = this.clamp(percent, 0, ProgressPieManager.MAX_COMP);
    this.recompute();
    this.opts.onChange?.(this.getData());
    return this.getData();
  }

  /** Azzeramento totale. */
  reset(): ProgressSlices {
    this.slices.ascolto = 0;
    this.slices.riformulazione = 0;
    this.slices.assertivita = 0;
    this.slices.gestione_conflitto = 0;
    this.recompute();
    this.opts.onChange?.(this.getData());
    return this.getData();
  }

  private recompute(): void {
    const sum4 = this.sumFour();
    if (sum4 <= 100) {
      this.slices.nessuna = this.round(100 - sum4);
    } else {
      const factor = 100 / sum4;
      (["ascolto", "riformulazione", "assertivita", "gestione_conflitto"] as CompetenceKey[])
        .forEach(k => {
          this.slices[k] = this.round(this.slices[k] * factor);
        });
      this.slices.nessuna = 0;
    }
    this.fixRoundingTo100();
  }

  private sumFour(): number {
    return (
      this.slices.ascolto +
      this.slices.riformulazione +
      this.slices.assertivita +
      this.slices.gestione_conflitto
    );
  }

  private clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
  }

  private round(n: number): number {
    const dec = this.opts.roundTo ?? 1;
    const p = Math.pow(10, dec);
    return Math.round(n * p) / p;
  }

  private fixRoundingTo100(): void {
    const total =
      this.slices.ascolto +
      this.slices.riformulazione +
      this.slices.assertivita +
      this.slices.gestione_conflitto +
      this.slices.nessuna;

    const diff = this.round(100 - total);
    if (Math.abs(diff) < 0.05) {
      this.slices.nessuna = this.round(this.slices.nessuna + diff);
    } else if (diff !== 0) {
      const entries: [CompetenceKey | 'nessuna', number][] = Object.entries(this.slices) as any;
      entries.sort((a, b) => b[1] - a[1]);
      const topKey = entries[0][0];
      if (topKey === "nessuna") {
        this.slices.nessuna = this.clamp(this.slices.nessuna + diff, 0, 100);
      } else {
        const newVal = this.clamp(this.slices[topKey] + diff, 0, ProgressPieManager.MAX_COMP);
        const absorbed = newVal - this.slices[topKey];
        this.slices[topKey] = this.round(newVal);
        const residual = this.round(diff - absorbed);
        if (residual !== 0) {
          this.slices.nessuna = this.clamp(this.slices.nessuna + residual, 0, 100);
        }
      }
    }
  }
}