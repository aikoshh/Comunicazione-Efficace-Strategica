import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'ces.pro.monthly',
    type: 'non-consumable',
    name: 'CES Coach PRO',
    price: '€9,90',
    description: 'Sblocca tutte le funzionalità PRO per 365 giorni.',
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
    // Il link di pagamento è stato aggiornato con quello fornito.
    paymentLink: 'https://buy.stripe.com/4gMfZacNF4SygnC9LG1wY03'
  },
];

export const COACHING_PRODUCT: Product = {
    id: 'ces.coaching.single',
    type: 'non-consumable',
    name: 'Sessione Live Coaching con Ivano Cincinnato',
    price: '€79',
    discountedFrom: '€149',
    description: 'Una sessione individuale di 30 minuti con il Prof. Ivano Cincinnato per un allenamento guidato e personalizzato.',
    benefits: [
        "Analisi live della tua sfida comunicativa",
        "Feedback diretto e personalizzato",
        "Strategie pratiche da applicare subito",
        "Registrazione della sessione (su richiesta)"
    ],
    category: 'Coaching',
    // IMPORTANTE: Sostituire con il link di pagamento Stripe reale per questo prodotto.
    paymentLink: 'https://buy.stripe.com/6oUdR2aFx98O7R68HC1wY02'
};