import { Product } from './types';

export const PRODUCTS: Product[] = [
  // Add-ons
  {
    id: 'ces.addon.riformulazione.pro',
    type: 'non-consumable',
    name: 'Riformulazione Strategica PRO',
    price: '€7,99',
    description: 'Potenzia la tua capacità di riformulare qualsiasi messaggio in modo strategico.',
    benefits: ['Esempi avanzati di riformulazione', 'Accesso a tutte le 10 rubriche di valutazione', 'Esportazione degli esercizi in PDF'],
    category: 'Add-on',
  },
  {
    id: 'ces.addon.domande.pro',
    type: 'non-consumable',
    name: 'Domande Strategiche PRO',
    price: '€9,99',
    description: 'Padroneggia l\'arte di porre domande che guidano e trasformano le conversazioni.',
    benefits: ['Libreria con +40 esempi di domande', 'Metriche di utilità e chiarezza', 'Checklist per la preparazione'],
    category: 'Add-on',
  },
  {
    id: 'ces.addon.paraverbale.pro',
    type: 'non-consumable',
    name: 'Paraverbale PRO',
    price: '€7,99',
    description: 'Sblocca l\'analisi vocale avanzata per rendere il tuo paraverbale più incisivo.',
    benefits: ['Analisi completa della voce con AI', 'Feedback dettagliato su tono, ritmo e pause', 'Accesso alla funzione "Ascolta Versione Ideale"'],
    category: 'Add-on',
  },
  // Bundle
  {
    id: 'ces.bundle.pro',
    type: 'non-consumable',
    name: 'Pacchetto PRO Completo',
    price: '€19,99',
    description: 'Ottieni accesso illimitato a tutte le funzionalità PRO con un unico acquisto.',
    benefits: ['Include tutti e 3 gli Add-on PRO', 'Risparmio del 25% sul totale', 'Tutti gli aggiornamenti futuri inclusi'],
    category: 'Bundle',
  },
  // Team Subscriptions
  {
    id: 'ces.sub.team.basic.monthly',
    type: 'subscription',
    name: 'Team Basic',
    price: '€14,99/mese',
    description: 'Collabora e monitora i progressi del tuo team.',
    benefits: ['Licenza per 3 utenti', 'Dashboard di team condivisa', 'Report di base in formato CSV'],
    category: 'Team Plan',
  },
  {
    id: 'ces.sub.team.pro.monthly',
    type: 'subscription',
    name: 'Team Pro',
    price: '€24,99/mese',
    description: 'La soluzione completa per team che puntano all\'eccellenza.',
    benefits: ['Licenza fino a 10 utenti', 'Badge di progresso per il team', 'Integrazione SSO (Single Sign-On)', 'Esportazione avanzata dei report'],
    category: 'Team Plan',
  },
];
