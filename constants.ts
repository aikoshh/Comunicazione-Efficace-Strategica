import type { Module } from './types';
import { DifficultyLevel } from './types';
import { MessageIcon, UnsolicitedAdviceIcon, SplitIcon } from './components/Icons';

export const COLORS = {
  nero: '#0B0B0C',
  verdePastello: '#B8EFC6',
  azzurroPastello: '#A8D8FF',
  accentoVerde: '#31C48D',
  fondo: '#FAFAFA',
};

export const MODULES: Module[] = [
  {
    id: 'unsolicited-advice',
    title: 'Consiglio non richiesto',
    description: 'Impara a gestire le richieste di aiuto senza dare consigli non richiesti (smutandamento).',
    icon: UnsolicitedAdviceIcon,
    exercises: [
      {
        id: 'ua-base-1',
        title: 'Riconoscere i confini',
        scenario: 'Un tuo collega, visibilmente frustrato, si lamenta del suo capo per come ha gestito l\'ultimo progetto, dicendo: "Non ne posso più, il mio capo non capisce niente! Ha rovinato tutto il lavoro."',
        task: 'Rispondi al collega senza offrire soluzioni o consigli diretti. Il tuo obiettivo è solo ascoltare e validare.',
        difficulty: DifficultyLevel.BASE
      },
      {
        id: 'ua-base-2',
        title: 'Ascolto Attivo',
        scenario: 'Un tuo collega, visibilmente frustrato, si lamenta del suo capo per come ha gestito l\'ultimo progetto, dicendo: "Non ne posso più, il mio capo non capisce niente! Ha rovinato tutto il lavoro."',
        task: 'Ascolta lo scenario, poi registra una risposta formulando una domanda di consenso e un ricalco emotivo.',
        difficulty: DifficultyLevel.BASE
      },
      {
        id: 'ua-inter-1',
        title: 'Proporre opzioni',
        scenario: 'Il tuo collega continua: "Davvero, non so come fare. Vorrei dirgliene quattro ma ho paura di perdere il posto."',
        task: 'Rispondi proponendo due possibili opzioni (senza usare imperativi come "devi fare") e chiudi lasciandogli la piena libertà di scelta.',
        difficulty: DifficultyLevel.INTERMEDIO
      },
       {
        id: 'ua-avanzato-1',
        title: 'Gestire il rifiuto',
        scenario: 'Dopo che hai offerto un paio di opzioni, il tuo collega risponde: "Sì, belle idee, ma nessuna di queste funzionerà mai con lui. È un caso perso."',
        task: 'Lui rifiuta il tuo tentativo di aiuto. Riformula la situazione per mantenere una relazione positiva, senza metterti sulla difensiva.',
        difficulty: DifficultyLevel.AVANZATO
      },
    ],
  },
  {
    id: 'dichotomous-questions',
    title: 'Domande Dicotomiche',
    description: 'Guida la conversazione e chiarisci il pensiero altrui con domande a scelta binaria.',
    icon: SplitIcon,
    exercises: [
      {
        id: 'dq-base-1',
        title: 'Da Aperta a Chiusa',
        scenario: 'Un amico ti dice: "Sono così stressato per il lavoro, non so da dove cominciare."',
        task: 'Trasforma la sua affermazione in una domanda dicotomica che lo aiuti a fare chiarezza. Invece di chiedere "Cosa ti stressa?", offri una scelta.',
        difficulty: DifficultyLevel.BASE,
      },
      {
        id: 'dq-inter-1',
        title: 'Guidare la Riflessione',
        scenario: 'Un membro del tuo team dice: "Questo progetto è un disastro, non rispetteremo mai la scadenza."',
        task: 'Usa una domanda dicotomica per spostare il focus dal problema alla soluzione, cercando di capire se si sente più bloccato dalla quantità di lavoro o dalla difficoltà dei compiti.',
        difficulty: DifficultyLevel.INTERMEDIO,
      },
      {
        id: 'dq-avanzato-1',
        title: 'Sequenza Strategica',
        scenario: 'Un cliente si lamenta: "Non sono soddisfatto del servizio. Non è quello che mi aspettavo."',
        task: 'Scrivi una serie di due domande dicotomiche per scomporre il suo feedback generico. La prima deve distinguere tra un problema di prodotto e uno di comunicazione; la seconda deve approfondire la direzione scelta.',
        difficulty: DifficultyLevel.AVANZATO,
      },
    ],
  },
  {
    id: 'conflict-management',
    title: 'Gestione del conflitto',
    description: 'Trasforma i conflitti in opportunità di crescita e collaborazione.',
    icon: MessageIcon,
    exercises: [
      {
        id: 'cm-base-1',
        title: 'Riconoscere i trigger',
        scenario: 'Durante una riunione, un collega ti interrompe dicendo: "Questo approccio è completamente sbagliato, come sempre non hai considerato le implicazioni a lungo termine!"',
        task: 'Riscrivi la sua frase eliminando le parole trigger (giudizi, accuse, generalizzazioni) e trasformandola in un\'osservazione neutra basata sui fatti.',
        difficulty: DifficultyLevel.BASE
      },
      {
        id: 'cm-inter-1',
        title: 'Direzionamento strategico',
        scenario: 'Un collega ti accusa: "Il tuo team è di nuovo in ritardo e sta bloccando il mio lavoro. Siete sempre inaffidabili!"',
        task: 'Ascolta lo scenario e registra una risposta che utilizzi una domanda strategica per spostare la conversazione da un\'accusa a una ricerca di soluzione.',
        difficulty: DifficultyLevel.INTERMEDIO
      },
       {
        id: 'cm-avanzato-1',
        title: 'Chiusura elegante',
        scenario: 'Dopo una discussione accesa, la tensione è ancora alta. Avete trovato un accordo di massima, ma c\'è del risentimento nell\'aria.',
        task: 'Scrivi una frase di chiusura che non solo confermi l\'accordo, ma che fissi anche i prossimi passi in modo realistico e ripari la relazione.',
        difficulty: DifficultyLevel.AVANZATO
      },
    ],
  },
];