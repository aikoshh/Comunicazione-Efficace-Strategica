import { Module, DifficultyLevel, ExerciseType, Exercise, IconComponent } from './types';
import { 
    FeedbackIcon, ConflictIcon, QuestionIcon, CustomIcon, ListeningIcon,
    HealthcareIcon, EducationIcon, CustomerCareIcon, RetailIcon, BankingIcon,
    HRIcon, SalesIcon, LeadershipIcon, VoiceIcon, WrittenIcon, VerbalIcon
} from './components/Icons';
import { cardImage1, cardImage2, cardImage3, cardImage4, cardImage5, cardImage6 } from './assets';

export const COLORS = {
  // Base
  base: '#F5F2EF', // Light Beige background
  card: '#FFFFFF',
  cardDark: '#F5F2EF', // Slightly darker warm off-white
  textPrimary: '#1C1C1E', // Almost black
  textSecondary: '#6D6D72', // Dark gray
  divider: '#EAE6E2', // Warm gray for borders
  accentBeige: '#D8C3A5', // Deep pastel beige for accents
  textAccent: '#796A53', // Dark beige for text on light backgrounds
  
  // Accents
  primary: '#0E3A5D', // strategic blue
  secondary: '#58A6A6', // sage green
  
  // States
  success: '#28a745', // A more vibrant green
  warning: '#ffc107', // Amber
  error: '#dc3545', // A more vibrant red

  // Gradients
  primaryGradient: 'linear-gradient(135deg, #0E3A5D 0%, #58A6A6 100%)',
};

// A dynamic palette of sage green shades, from lighter to darker, ensuring accessibility.
export const SAGE_PALETTE = [
  '#387676', // Contrast: 4.54:1
  '#346d6d',
  '#306565',
  '#2c5c5c',
  '#285353', // Contrast: 7.75:1
  '#244b4b',
  '#204242',
  '#1c3939',
  '#183131',
  '#142828', // Contrast: 12.8:1
];

export const VOICE_RUBRIC_CRITERIA = [
    { id: "pacing_breath", label: "Ritmo & Respirazione" },
    { id: "speed", label: "Velocità (parole/minuto)" },
    { id: "volume", label: "Volume" },
    { id: "tone_warmth", label: "Tono & Calore" },
    { id: "intonation", label: "Intonazione & Melodia" },
    { id: "articulation", label: "Articolazione & Dizione" },
    { id: "emphasis", label: "Enfasi Strategica" },
    { id: "pauses", label: "Pause Strategiche" },
    { id: "disfluencies", label: "Disfluenze & Filler" },
    { id: "strategy_alignment", label: "Allineamento all'Obiettivo CES" },
];

export const STRATEGIC_CHECKUP_EXERCISES: Exercise[] = [
    {
      id: 'checkup-1',
      title: 'Check-up 1/3: Dare un Feedback',
      scenario: 'Devi dare un feedback a un collega, Alex, che ha presentato un lavoro incompleto e con diversi errori. È la prima volta che succede, ma il progetto è critico.',
      task: 'Scrivi o registra il feedback che daresti ad Alex per affrontare la situazione in modo costruttivo.',
      difficulty: DifficultyLevel.INTERMEDIO,
      exerciseType: ExerciseType.WRITTEN,
    },
    {
      id: 'checkup-2',
      title: 'Check-up 2/3: Gestire un Conflitto',
      scenario: 'Durante una riunione, un altro team leader mette in discussione pubblicamente l\'approccio del tuo team, usando un tono che percepisci come accusatorio.',
      task: 'Scrivi o registra la tua risposta immediata per gestire la situazione professionalmente, senza innescare un\'escalation.',
      difficulty: DifficultyLevel.INTERMEDIO,
      exerciseType: ExerciseType.WRITTEN,
    },
    {
      id: 'checkup-3',
      title: 'Check-up 3/3: Ascolto e Domande',
      scenario: 'Un cliente ti dice: "Non sono soddisfatto del servizio. Semplicemente non sta funzionando come mi aspettavo".',
      task: 'Scrivi o registra la prima domanda che faresti per capire a fondo il problema del cliente, dimostrando ascolto attivo.',
      difficulty: DifficultyLevel.BASE,
      exerciseType: ExerciseType.WRITTEN,
    },
];


export const MODULES: Module[] = [
  // Fondamentali
  {
    id: 'm4',
    title: 'Ascolto Attivo Strategico',
    description: 'Affina la capacità di ascoltare non solo per sentire, ma per comprendere a fondo, individuando le parole chiave che svelano le reali intenzioni.',
    icon: ListeningIcon,
    cardImage: cardImage5,
    category: 'Fondamentali',
    exercises: [
      {
        id: 'e10',
        title: 'Individuare le Parole Chiave in una Richiesta Semplice',
        scenario: 'Un tuo collega ti dice: "Sono un po\' preoccupato per la presentazione di domani, non sono sicuro che la sezione sui dati sia abbastanza chiara e temo che il cliente possa fare domande difficili."',
        task: 'Ascolta o leggi la frase e identifica le 3-4 parole o brevi frasi chiave che esprimono l\'emozione, il problema principale e la paura del tuo collega.',
        difficulty: DifficultyLevel.BASE,
      },
      {
        id: 'e11',
        title: 'Decifrare un Feedback Vago',
        scenario: 'Durante una revisione, il tuo manager commenta: "Il tuo ultimo report era buono, ma sento che manca qualcosa. Forse potremmo dargli più... impatto. Lavoraci un po\' su e fammi vedere."',
        task: 'Individua le parole chiave che, nonostante la loro vaghezza, indicano l\'area di insoddisfazione del manager e il tipo di azione richiesta.',
        difficulty: DifficultyLevel.INTERMEDIO,
      },
      {
        id: 'e12',
        title: 'Cogliere i Segnali Deboli in una Negoziazione',
        scenario: 'Stai negoziando un contratto con un cliente che afferma: "La vostra offerta è interessante, ma onestamente, il budget che abbiamo è piuttosto rigido. Dobbiamo essere certi che questo investimento porti a risultati tangibili e rapidi, altrimenti la direzione non approverà."',
        task: 'Identifica le parole chiave e le frasi che rivelano i veri criteri di decisione del cliente, al di là del prezzo. Quali sono le sue priorità e le sue pressioni interne?',
        difficulty: DifficultyLevel.AVANZATO,
      },
    ],
  },
  {
    id: 'm1',
    title: 'Dare un Feedback Efficace',
    description: 'Impara a fornire feedback costruttivi che motivano il cambiamento senza demotivare.',
    icon: FeedbackIcon,
    cardImage: cardImage1,
    category: 'Fondamentali',
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
    id: 'm3',
    title: 'Padroneggiare l\'Arte delle Domande',
    description: 'Scopri come usare le domande per guidare le conversazioni, stimolare il pensiero critico e scoprire informazioni cruciali.',
    icon: QuestionIcon,
    cardImage: cardImage3,
    category: 'Fondamentali',
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
    id: 'm2',
    title: 'Gestire Conversazioni Difficili',
    description: 'Sviluppa le competenze per navigare conversazioni complesse e conflittuali con calma e professionalità.',
    icon: ConflictIcon,
    cardImage: cardImage2,
    category: 'Fondamentali',
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
        id: 'e13',
        title: 'Disaccordo con il Partner',
        scenario: 'Il tuo partner è infastidito perché hai passato molto tempo al lavoro di recente. Ti dice: "Non ci sei mai!". Vuoi affrontare la sua frustrazione senza iniziare una discussione.',
        task: 'Inizia una conversazione per riconoscere i suoi sentimenti, spiegare la tua prospettiva e trovare insieme un modo per bilanciare meglio le cose.',
        difficulty: DifficultyLevel.INTERMEDIO,
      },
      {
        id: 'e14',
        title: 'Affrontare un Comportamento di un Figlio',
        scenario: 'Tuo figlio adolescente ha violato una regola importante della casa (es. orario di rientro). È arrabbiato e sulla difensiva. Vuoi affrontare l\'accaduto in modo fermo ma mantenendo un canale di comunicazione aperto.',
        task: 'Parla con tuo figlio per discutere della regola infranta, ascoltare le sue ragioni e stabilire le conseguenze in modo calmo e costruttivo.',
        difficulty: DifficultyLevel.AVANZATO,
      },
      {
        id: 'e15',
        title: 'Commento da un Parente',
        scenario: 'Durante una riunione di famiglia, un parente fa un commento passivo-aggressivo su una tua scelta di vita (lavoro, relazioni, ecc.). Il commento ti ferisce e crea imbarazzo.',
        task: 'Rispondi al parente in modo assertivo ma educato, stabilendo un confine chiaro senza rovinare l\'atmosfera della riunione.',
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
    id: 'm5',
    title: 'Voce Strategica (Paraverbale)',
    description: 'Allena il ritmo, il tono e le pause per rendere il tuo messaggio più d\'impatto e persuasivo.',
    icon: VoiceIcon,
    cardImage: cardImage6,
    category: 'Fondamentali',
    exercises: [
      {
        id: 'v1',
        title: 'Presentare una Proposta con Calma',
        scenario: 'Devi presentare una proposta importante a un cliente che è noto per essere molto esigente e spesso interrotto. L\'obiettivo è mantenere un tono calmo e autorevole, senza farsi sopraffare dalla pressione.',
        task: 'Registra un audio di 30-45 secondi in cui presenti i due punti chiave della tua proposta, come se fossi di fronte al cliente.',
        difficulty: DifficultyLevel.BASE,
        exerciseType: ExerciseType.VERBAL,
      },
      {
        id: 'v2',
        title: 'Gestire un\'Interruzione con Fermezza',
        scenario: 'Durante una riunione importante, un collega ti interrompe ripetutamente mentre stai presentando i tuoi dati. Devi riprendere la parola e mantenere il controllo della conversazione senza apparire aggressivo, usando un tono di voce fermo ma collaborativo.',
        task: 'Registra la frase che useresti per fermare l\'interruzione e riportare l\'attenzione sul tuo punto. Concentrati su un ritmo pacato e un volume costante per proiettare sicurezza.',
        difficulty: DifficultyLevel.INTERMEDIO,
        exerciseType: ExerciseType.VERBAL,
      },
      {
        id: 'v3',
        title: 'Comunicare una Visione Complessa',
        scenario: 'Sei il leader di un team e devi presentare una nuova strategia aziendale che comporterà cambiamenti significativi e possibili incertezze. Il tuo obiettivo è ispirare fiducia e motivare il team, nonostante le difficoltà.',
        task: 'Registra un discorso di 45-60 secondi in cui introduci la nuova visione. Usa variazioni di intonazione, pause strategiche prima dei concetti chiave ed enfasi sulle parole che trasmettono ottimismo e determinazione.',
        difficulty: DifficultyLevel.AVANZATO,
        exerciseType: ExerciseType.VERBAL,
      }
    ],
  },
  {
    id: 'custom',
    title: 'Allenamento Personalizzato',
    description: 'Crea il tuo scenario di allenamento su misura per affrontare le sfide di comunicazione che ti stanno più a cuore.',
    icon: CustomIcon,
    cardImage: cardImage4,
    exercises: [],
    isCustom: true,
    category: 'Fondamentali',
  },
  // Pacchetti Settoriali
  {
    id: 's1',
    title: 'Sanità',
    description: 'Comunica con empatia e chiarezza con pazienti e colleghi in contesti sanitari complessi.',
    icon: HealthcareIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m4', 'm2'], // Requires Listening and Conflict Management
    exercises: [
        {
            id: 's1e1',
            title: 'Comunicare una Diagnosi Difficile',
            scenario: 'Sei un medico e devi comunicare a un paziente e alla sua famiglia una diagnosi di una malattia cronica. L\'atmosfera è tesa e carica di ansia.',
            task: 'Comunica la diagnosi in modo chiaro, empatico e supportivo, rispondendo alle domande e gestendo le reazioni emotive della famiglia.',
            difficulty: DifficultyLevel.AVANZATO,
        }
    ],
  },
  {
    id: 's2',
    title: 'Scuola',
    description: 'Gestisci la comunicazione con studenti, genitori e colleghi per un ambiente educativo più efficace.',
    icon: EducationIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m1', 'm2'], // Requires Feedback and Conflict Management
    exercises: [
        {
            id: 's2e1',
            title: 'Colloquio con un Genitore Preoccupato',
            scenario: 'Sei un insegnante e devi incontrare i genitori di uno studente che sta avendo difficoltà comportamentali in classe. I genitori sono sulla difensiva.',
            task: 'Conduci la conversazione in modo collaborativo, presentando i fatti in modo oggettivo e lavorando con i genitori per creare un piano di supporto per lo studente.',
            difficulty: DifficultyLevel.INTERMEDIO,
        }
    ],
  },
  {
    id: 's3',
    title: 'Customer Care',
    description: 'Trasforma clienti insoddisfatti in sostenitori del brand attraverso una comunicazione magistrale.',
    icon: CustomerCareIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m4', 'm2'], // Requires Listening and Conflict Management
    exercises: [
        {
            id: 's3e1',
            title: 'De-escalare un Cliente Arrabbiato',
            scenario: 'Un cliente ti chiama, estremamente arrabbiato perché il suo prodotto non è arrivato in tempo per un evento importante. Minaccia di lasciare una recensione negativa ovunque.',
            task: 'Ascolta attivamente la sua frustrazione, mostra empatia, de-escala la situazione e proponi una soluzione che lo faccia sentire ascoltato e valorizzato.',
            difficulty: DifficultyLevel.INTERMEDIO,
        }
    ],
  },
  {
    id: 's7',
    title: 'Vendita Consulenziale',
    description: 'Passa dalla vendita di prodotti alla creazione di partnership strategiche attraverso l\'ascolto e le domande.',
    icon: SalesIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m4', 'm3'], // Requires Listening and Questioning
    exercises: [
        {
            id: 's7e1',
            title: 'Superare un\'Obiezione sul Prezzo',
            scenario: 'Un potenziale cliente è convinto del valore della tua soluzione, ma dice: "È fantastico, ma costa il doppio del vostro concorrente principale".',
            task: 'Invece di giustificare il prezzo, usa domande strategiche per spostare la conversazione dal costo al valore e al ritorno sull\'investimento, differenziandoti dalla concorrenza.',
            difficulty: DifficultyLevel.AVANZATO,
        }
    ],
  },
  {
    id: 's8',
    title: 'Leadership',
    description: 'Ispira il tuo team, gestisci il cambiamento e comunica la visione con l\'impatto di un vero leader.',
    icon: LeadershipIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m1', 'm2', 'm5'], // Requires Feedback, Conflict and Voice
    exercises: [
        {
            id: 's8e1',
            title: 'Motivare il Team Dopo un Fallimento',
            scenario: 'Il progetto chiave del tuo team è fallito, mancando un obiettivo importante per l\'azienda. Il morale è a terra e c\'è paura per le conseguenze.',
            task: 'Tieni una riunione con il team. Comunica un messaggio che riconosca il fallimento senza cercare colpevoli, che ispiri resilienza e che rimetta a fuoco il team sugli apprendimenti e sui prossimi passi.',
            difficulty: DifficultyLevel.AVANZATO,
        }
    ],
  },
];

export const EXERCISE_TYPE_ICONS: Record<ExerciseType, IconComponent> = {
  [ExerciseType.WRITTEN]: WrittenIcon,
  [ExerciseType.VERBAL]: VerbalIcon,
};