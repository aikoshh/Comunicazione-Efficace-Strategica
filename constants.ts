import { Module, DifficultyLevel } from './types';
import { FeedbackIcon, ConflictIcon, QuestionIcon, CustomIcon } from './components/Icons';
import { cardImage1, cardImage2, cardImage3, cardImage4 } from './assets';

export const COLORS = {
  nero: '#111827', // A dark, near-black color for text
  fondo: '#f8f9fa', // A very light grey for backgrounds
  accentoVerde: '#31C48D', // A vibrant green for primary actions
  salviaVerde: '#B2C8AD', // A sage green for navigation buttons
};

export const MODULES: Module[] = [
  {
    id: 'm1',
    title: 'Dare Feedback Efficace',
    description: 'Impara a fornire feedback costruttivi che motivano il cambiamento senza demotivare.',
    icon: FeedbackIcon,
    cardImage: cardImage1,
    exercises: [
      {
        id: 'e1',
        title: 'Feedback a un Collaboratore con Prestazioni Scadenti',
        scenario: 'Devi dare un feedback a Marco, un membro del tuo team, che recentemente ha mancato diverse scadenze e il cui lavoro è stato di qualità inferiore al solito. Vuoi affrontare il problema in modo costruttivo senza demotivarlo.',
        task: 'Prepara e fornisci un feedback a Marco, concentrandoti sui fatti, sull\'impatto del suo comportamento e sui passi futuri per migliorare.',
        difficulty: DifficultyLevel.BASE,
      },
      {
        id: 'e2',
        title: 'Feedback a un Manager',
        scenario: 'Il tuo manager, Luca, tende a micro-gestire il tuo lavoro, controllando ogni piccolo dettaglio e causando ritardi. Questo sta minando la tua autonomia e la tua fiducia. Vuoi dargli un feedback per migliorare la vostra collaborazione.',
        task: 'Esponi la situazione a Luca in modo rispettoso, spiegando l\'impatto del suo comportamento sul tuo lavoro e suggerendo un approccio diverso.',
        difficulty: DifficultyLevel.INTERMEDIO,
      },
      {
        id: 'e7',
        title: 'Feedback a uno Stakeholder Senior',
        scenario: 'Devi comunicare un feedback critico a un direttore di un altro dipartimento riguardo a un ritardo da parte sua che sta bloccando un progetto strategico. La conversazione è delicata a causa della gerarchia e delle possibili implicazioni politiche.',
        task: 'Comunica il feedback in modo diplomatico ma chiaro, focalizzandoti sull\'impatto oggettivo sul progetto e proponendo soluzioni collaborative per sbloccare la situazione.',
        difficulty: DifficultyLevel.AVANZATO,
      }
    ],
  },
  {
    id: 'm2',
    title: 'Gestire Conversazioni Difficili',
    description: 'Sviluppa le competenze per navigare conversazioni complesse e conflittuali con calma e professionalità.',
    icon: ConflictIcon,
    cardImage: cardImage2,
    exercises: [
      {
        id: 'e8',
        title: 'Chiedere a un Collega di Abbassare il Tono',
        scenario: 'Un collega nel tuo ufficio open space parla spesso a voce molto alta al telefono, disturbando la tua concentrazione. Non sembra accorgersene e la cosa inizia a irritare anche altri.',
        task: 'Avvicinati al collega in modo gentile e privato e chiedigli se può abbassare il tono di voce, senza farlo sentire attaccato o in imbarazzo.',
        difficulty: DifficultyLevel.BASE,
      },
      {
        id: 'e3',
        title: 'Disaccordo con un Collega su un Progetto',
        scenario: 'Tu e il tuo collega, Giulia, avete visioni completamente diverse su come procedere con un progetto importante. La tensione sta crescendo e dovete trovare una soluzione per non bloccare il lavoro del team.',
        task: 'Avvia una conversazione con Giulia per discutere delle vostre divergenze. Cerca di capire il suo punto di vista e di trovare un compromesso o una soluzione condivisa.',
        difficulty: DifficultyLevel.INTERMEDIO,
      },
      {
        id: 'e4',
        title: 'Comunicare una Decisione Impopolare al Team',
        scenario: 'Come team leader, devi comunicare alla tua squadra che, a causa di un taglio di budget, il progetto a cui tenevano molto è stato cancellato. C\'è il rischio di un forte malcontento.',
        task: 'Comunica la notizia al team in modo chiaro, empatico e trasparente, gestendo le loro reazioni e rispondendo alle loro domande.',
        difficulty: DifficultyLevel.AVANZATO,
      },
    ],
  },
  {
    id: 'm3',
    title: 'Padroneggiare l\'Arte delle Domande',
    description: 'Scopri come usare le domande per guidare le conversazioni, stimolare il pensiero critico e scoprire informazioni cruciali.',
    icon: QuestionIcon,
    cardImage: cardImage3,
    exercises: [
       {
        id: 'e5',
        title: 'Capire le Esigenze di un Cliente',
        scenario: 'Sei in una riunione iniziale con un potenziale cliente che ha difficoltà a esprimere chiaramente ciò di cui ha bisogno. Le sue richieste sono vaghe e contraddittorie.',
        task: 'Utilizza una serie di domande aperte e di approfondimento per aiutare il cliente a definire meglio i suoi obiettivi e le sue necessità.',
        difficulty: DifficultyLevel.BASE,
      },
      {
        id: 'e9',
        title: 'Esplorare un Calo di Motivazione',
        scenario: 'Hai notato che un membro del tuo team, solitamente proattivo, è diventato silenzioso e poco partecipe. Vuoi capire cosa sta succedendo senza essere invadente.',
        task: 'Avvia una conversazione 1-to-1. Usa domande aperte e di ascolto attivo per esplorare le possibili cause del suo cambiamento di atteggiamento e offrire supporto.',
        difficulty: DifficultyLevel.INTERMEDIO,
      },
      {
        id: 'e6',
        title: 'Sessione di Coaching con un Membro del Team',
        scenario: 'Stai facendo da mentore a un collega più giovane, Sara, che si sente bloccata nella sua crescita professionale. Invece di darle soluzioni dirette, vuoi aiutarla a trovare le sue risposte.',
        task: 'Conduci una conversazione di coaching con Sara usando domande potenti per aiutarla a riflettere sulla sua situazione, identificare gli ostacoli e creare un piano d\'azione.',
        difficulty: DifficultyLevel.AVANZATO,
      },
    ],
  },
  {
    id: 'custom',
    title: 'Allenamento Personalizzato',
    description: 'Crea il tuo scenario di allenamento su misura per affrontare le sfide di comunicazione che ti stanno più a cuore.',
    icon: CustomIcon,
    cardImage: cardImage4,
    exercises: [], // No pre-defined exercises for custom module
    isCustom: true,
  }
];