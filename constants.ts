import { Module, DifficultyLevel, ExerciseType, Exercise, IconComponent } from './types';
import { 
    FeedbackIcon, ConflictIcon, QuestionIcon, CustomIcon, ListeningIcon,
    HealthcareIcon, EducationIcon, CustomerCareIcon, RetailIcon, BankingIcon,
    HRIcon, SalesIcon, LeadershipIcon, VoiceIcon, WrittenIcon, VerbalIcon, ChatIcon
} from './components/Icons';
import { 
    cardImage2, cardImage3, cardImage4, cardImage5, cardImage6,
    gestireConversazioniDifficiliHeaderVideo, domandeStrategicheHeaderVideo,
    ascoltoStrategicoHeaderVideo, allenamentoPersonalizzatoVideo,
    dareFeedbackEfficaceHeaderVideo, voceStrategicaHeaderVideo, chatTrainerCardImage,
    chatTrainerHeaderVideo
} from './assets';

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

// A vibrant yet professional palette for module cards.
export const MODULE_PALETTE = [
  '#E67E22', // Carrot Orange
  '#3498DB', // Peter River Blue
  '#8E44AD', // Wisteria Purple
  '#1ABC9C', // Turquoise
  '#F1C40F', // Sunflower Yellow
  '#2ECC71', // Emerald Green
  '#E74C3C', // Alizarin Crimson
];

export const EXERCISE_TYPE_ICONS: { [key in ExerciseType]: IconComponent } = {
  [ExerciseType.WRITTEN]: WrittenIcon,
  [ExerciseType.VERBAL]: VerbalIcon,
};

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
    headerImage: ascoltoStrategicoHeaderVideo,
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
    cardImage: dareFeedbackEfficaceHeaderVideo,
    headerImage: dareFeedbackEfficaceHeaderVideo,
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
    headerImage: domandeStrategicheHeaderVideo,
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
      {
        id: 'e16',
        title: 'Cogliere i Bisogni Non Detti',
        scenario: 'Stai parlando con un potenziale cliente che sembra interessato alla tua soluzione ma continua a dire \'Sì, interessante, ma dobbiamo pensarci\'. Vuoi capire meglio le sue reali preoccupazioni senza essere troppo diretto.',
        task: 'Registra una domanda che potresti fare per approfondire le sue reserve, usando un tono empatico e curioso.',
        difficulty: DifficultyLevel.AVANZATO,
        exerciseType: ExerciseType.VERBAL,
      },
    ],
  },
  {
    id: 'm2',
    title: 'Gestire Conversazioni Difficili',
    description: 'Sviluppa le competenze per navigare conversazioni complesse e conflittuali con calma e professionalità.',
    icon: ConflictIcon,
    cardImage: cardImage2,
    headerImage: gestireConversazioniDifficiliHeaderVideo,
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
    headerImage: voceStrategicaHeaderVideo,
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
        task: 'Registra la frase che useresti per riprendere la parola in modo assertivo. Es: "Un attimo, vorrei finire questo punto, poi ascolterò volentieri la tua osservazione."',
        difficulty: DifficultyLevel.INTERMEDIO,
        exerciseType: ExerciseType.VERBAL,
      },
      {
        id: 'v3',
        title: 'Comunicare Urgenza senza Ansia',
        scenario: 'Devi comunicare al tuo team che una scadenza critica è stata anticipata e che è necessario un grande sforzo per rispettarla. L\'obiettivo è trasmettere urgenza e motivazione, senza generare panico o ansia.',
        task: 'Registra un breve messaggio audio (30-45 secondi) per il tuo team, usando un tono energico e rassicurante per comunicare la nuova sfida.',
        difficulty: DifficultyLevel.AVANZATO,
        exerciseType: ExerciseType.VERBAL,
      },
    ],
  },
  {
    id: 'm6',
    title: 'Allenamento Personalizzato',
    description: 'Crea uno scenario di allenamento basato sulle tue sfide reali e ricevi un esercizio su misura dall\'AI.',
    icon: CustomIcon,
    cardImage: cardImage4,
    headerImage: allenamentoPersonalizzatoVideo,
    isCustom: true,
    category: 'Fondamentali',
    exercises: [], // Gli esercizi sono generati dinamicamente
  },

  // Pacchetti Speciali
  {
    id: 's-chat',
    title: 'Crea la tua risposta strategica per le conversazioni in chat e sui social',
    description: 'Allenati a rispondere a messaggi difficili ricevuti su WhatsApp, email, ecc. con il supporto dell\'AI per creare risposte potenti.',
    icon: ChatIcon,
    cardImage: chatTrainerCardImage,
    headerImage: chatTrainerHeaderVideo,
    category: 'Pacchetti Speciali',
    specialModuleType: 'chat_trainer',
    exercises: [],
  },

  // Pacchetti Settoriali Professionali
  {
    id: 's1',
    title: 'CES per il Settore Sanitario',
    description: 'Comunicare con pazienti, familiari e colleghi in contesti ad alta pressione emotiva.',
    icon: HealthcareIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m4', 'm2'], // Richiede Ascolto e Gestione Conversazioni Difficili
    exercises: [
        {
          id: 's1e1',
          title: 'Comunicare una Diagnosi Complessa',
          scenario: 'Sei un medico e devi comunicare a un paziente e alla sua famiglia una diagnosi difficile, che richiede un lungo percorso di cura. Devi essere chiaro, empatico e rassicurante.',
          task: 'Prepara e registra la prima parte della tua comunicazione (circa 60 secondi), focalizzandoti su come introdurre la notizia e stabilire un rapporto di fiducia.',
          difficulty: DifficultyLevel.AVANZATO,
          exerciseType: ExerciseType.VERBAL,
        }
    ]
  },
  {
    id: 's2',
    title: 'CES per l\'Insegnamento',
    description: 'Gestire la classe, comunicare con i genitori e motivare gli studenti con efficacia.',
    icon: EducationIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m1', 'm3'], // Richiede Feedback e Domande
    exercises: [
        {
            id: 's2e1',
            title: 'Conversazione con un Genitore Preoccupato',
            scenario: 'Un genitore ti ha chiesto un colloquio ed è molto preoccupato per i recenti risultati scolastici del figlio. Tende a essere iperprotettivo e a dare la colpa al metodo di insegnamento.',
            task: 'Avvia la conversazione con il genitore. Utilizza l\'ascolto attivo e le domande per capire le sue preoccupazioni, creare un\'alleanza e spostare il focus sulla collaborazione per aiutare lo studente.',
            difficulty: DifficultyLevel.INTERMEDIO,
        }
    ]
  },
   {
    id: 's3',
    title: 'CES per il Customer Care',
    description: 'Trasformare clienti insoddisfatti in sostenitori del brand attraverso una comunicazione empatica e risolutiva.',
    icon: CustomerCareIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m4', 'm2'],
    exercises: [
        {
            id: 's3e1',
            title: 'Gestire un Cliente Molto Arrabbiato',
            scenario: 'Un cliente chiama il servizio clienti ed è estremamente arrabbiato per un disservizio. Sta urlando, minacciando di scrivere recensioni negative e non ti lascia parlare.',
            task: 'Registra le prime frasi che diresti per calmare il cliente, dimostrare che lo stai ascoltando e prendere il controllo della conversazione in modo professionale.',
            difficulty: DifficultyLevel.AVANZATO,
            exerciseType: ExerciseType.VERBAL,
        }
    ]
  },
  {
    id: 's7',
    title: 'CES per le Vendite',
    description: 'Capire i bisogni profondi del cliente, gestire le obiezioni e chiudere trattative complesse.',
    icon: SalesIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m3', 'm4'],
    exercises: [
        {
            id: 's7e1',
            title: 'Rispondere all\'Obiezione "È troppo caro"',
            scenario: 'Hai appena presentato la tua offerta a un cliente che sembrava molto interessato. Alla fine, ti dice: "Tutto molto bello, ma il prezzo è troppo alto rispetto alla concorrenza".',
            task: 'Formula la prima domanda che faresti per esplorare questa obiezione, invece di giustificare subito il prezzo. Il tuo obiettivo è capire cosa c\'è dietro la sua affermazione.',
            difficulty: DifficultyLevel.INTERMEDIO,
        }
    ]
  },
  {
    id: 's8',
    title: 'CES per la Leadership',
    description: 'Delegare con efficacia, motivare il team e comunicare visioni strategiche in modo ispiratore.',
    icon: LeadershipIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m1', 'm2', 'm3'],
    exercises: [
        {
            id: 's8e1',
            title: 'Delegare un Compito Critico',
            scenario: 'Devi delegare un compito molto importante e delicato a un membro del tuo team. Vuoi assicurarti che comprenda pienamente la responsabilità, si senta motivato e abbia tutti gli strumenti per avere successo, senza percepire il compito come un peso.',
            task: 'Prepara e registra la conversazione di delega (circa 60-90 secondi), focalizzandoti su come presenti il compito, chiarisci le aspettative e offri supporto.',
            difficulty: DifficultyLevel.AVANZATO,
            exerciseType: ExerciseType.VERBAL,
        }
    ]
  }
];