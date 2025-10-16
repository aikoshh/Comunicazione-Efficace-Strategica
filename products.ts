import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'ces.pro.monthly',
    type: 'non-consumable',
    name: 'CES Coach PRO',
    price: '€9,90',
    description: 'Attivazione una tantum per sbloccare in modo permanente tutte le funzionalità PRO. Richiede un abbonamento attivo all\'app.',
    benefits: [
        'Valutazione dettagliata PRO con 5 rubriche di analisi (Chiarezza, Tono, Soluzione, Assertività, Struttura)',
        'Analisi paraverbale completa con AI per tono, ritmo, pause e velocità',
        "Funzione 'Ascolta Versione Ideale' per sentire la consegna ottimale di ogni tua risposta vocale",
        "Accesso alla Libreria Domande PRO con oltre 40 esempi strategici per ogni situazione",
        "Utilizzo della Checklist di Preparazione PRO per affrontare conversazioni difficili",
        "Metriche avanzate di Utilità e Chiarezza per le tue domande",
        "Esportazione di tutti i report di analisi in formato PDF",
    ],
    category: 'Bundle', // Using 'Bundle' as it represents the full package
  },
];
