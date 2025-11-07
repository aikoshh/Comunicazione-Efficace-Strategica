// constants.ts
// FIX: Imported UserProgress to resolve type errors.
import { Module, ExerciseType, VoiceAnalysisResult, Exercise, Achievement, Level, UserProgress, Path } from './types';
import {
  FlameIcon,
  CheckCircleIcon,
  QuestionIcon,
  TargetIcon,
  WrittenIcon,
  VoiceIcon,
  HomeIcon,
  AdminIcon,
  // FIX: Added missing icon imports.
  BadgeIcon,
  FirstStepsIcon,
  MarathonerIcon,
  StreakIcon,
} from './components/Icons';
import { 
    cardImage1,
    cardImage2,
    cardImage3,
    cardImage4,
    cardImage5,
    cardImage6,
    chatTrainerCardImage,
    dareFeedbackEfficaceHeaderVideo,
    gestireConversazioniDifficiliHeaderVideo,
    domandeStrategicheHeaderVideo,
    ascoltoStrategicoHeaderVideo,
    voceStrategicaHeaderVideo,
    allenamentoPersonalizzatoVideo,
    chatTrainerHeaderVideo
} from './assets';

export const COLORS = {
  primary: '#1C3E5E', // Deep Blue
  secondary: '#58A6A6', // Teal
  base: '#F8F7F4', // Off-white/light beige background
  card: '#FFFFFF',
  cardDark: '#F0F0F0', // Slightly darker for nested components
  divider: '#E0DCD7',
  textPrimary: '#1E1E1E',
  textSecondary: '#5A5A5A',
  textAccent: '#333333',
  success: '#2E7D32', // Green
  error: '#C62828',   // Red
  warning: '#FFC107', // Yellow/Gold
  accentBeige: '#D4C8B4',
  primaryGradient: 'linear-gradient(135deg, #1C3E5E 0%, #58A6A6 100%)',
};

export const EXERCISE_TYPE_ICONS = {
  [ExerciseType.WRITTEN]: WrittenIcon,
  [ExerciseType.VERBAL]: VoiceIcon,
};

export const VOICE_RUBRIC_CRITERIA: { id: VoiceAnalysisResult['scores'][0]['criterion_id'], label: string }[] = [
    { id: 'ritmo', label: 'Ritmo' },
    { id: 'tono', label: 'Tono' },
    { id: 'volume', label: 'Volume' },
    { id: 'pause', label: 'Pause' },
    { id: 'chiarezza', label: 'Chiarezza' },
];

export const STRATEGIC_CHECKUP_EXERCISES: Exercise[] = [
  {
    id: 'checkup-1',
    title: 'Chiarire le Aspettative con il Capo',
    scenario: 'Il tuo capo ti ha assegnato un nuovo progetto con la direttiva "Voglio un risultato eccellente, sorprendimi". Le istruzioni sono molto vaghe e temi di non soddisfare le sue aspettative non dette.',
    task: 'Quali domande fai al tuo capo per chiarire le aspettative e assicurarti di partire con il piede giusto, senza sembrare insicuro/a?',
    difficulty: 'Facile',
    competence: 'ascolto',
  },
  {
    id: 'checkup-2',
    title: 'Gestire un Cliente in Fase di Vendita',
    scenario: 'Durante una trattativa, un potenziale cliente afferma: "La vostra soluzione è interessante, ma un vostro competitor ci offre una cosa simile a un prezzo inferiore".',
    task: 'Come rispondi per valorizzare la tua offerta senza svalutare il competitor, spostando il focus dal prezzo al valore?',
    difficulty: 'Medio',
    competence: 'gestione_conflitto',
  },
  {
    id: 'checkup-3',
    title: 'Affrontare una Critica in Famiglia',
    scenario: 'Durante un pranzo di famiglia, un parente ti dice in tono critico: "Vedo che stai ancora facendo quel lavoro. Non pensi che sia ora di trovare qualcosa di più stabile?". La critica ti ferisce.',
    task: 'Come rispondi per difendere le tue scelte in modo assertivo ma non aggressivo, preservando l\'armonia familiare?',
    difficulty: 'Difficile',
    competence: 'assertivita',
  },
  {
    id: 'checkup-4',
    title: 'Un Problema con un Amico',
    scenario: 'Un tuo caro amico annulla un appuntamento con te per l\'ennesima volta all\'ultimo minuto. Ti senti frustrato/a e poco considerato/a.',
    task: 'Scrivi il messaggio che invieresti al tuo amico per esprimere il tuo disappunto in modo costruttivo, senza rovinare l\'amicizia.',
    difficulty: 'Medio',
    competence: 'riformulazione',
  },
  {
    id: 'checkup-5',
    title: 'Discussione di Coppia',
    scenario: 'Il tuo partner è infastidito perché ultimamente passi molto tempo al telefono per lavoro anche la sera. Ti dice con tono seccato: "Sei sempre con quel telefono in mano!".',
    task: 'Come rispondi per validare il suo sentimento e aprire un dialogo sulla questione, invece di metterti sulla difensiva?',
    difficulty: 'Difficile',
    competence: 'ascolto',
  }
];

export const MODULES: Module[] = [
  {
    id: 'm1',
    title: 'Dare un Feedback Efficace',
    description: 'Impara a dare feedback, sia positivi che correttivi, in modo che vengano accolti e trasformati in azione.',
    icon: CheckCircleIcon,
    color: '#2E7D32',
    headerImage: dareFeedbackEfficaceHeaderVideo,
    exercises: [
      { id: 'e1', title: 'Feedback Correttivo (Lavoro)', scenario: 'Un tuo collaboratore continua a consegnare il lavoro in ritardo, impattando le scadenze del team.', task: 'Prepara e scrivi il discorso che faresti per affrontare il problema in modo costruttivo, focalizzandoti sul comportamento e non sulla persona.', difficulty: 'Medio', competence: 'riformulazione' },
      { id: 'e2', title: 'Feedback su un\'Abitudine (Partner)', scenario: 'Il tuo partner ha un\'abitudine (es. lasciare disordine) che a te crea stress. Vuoi affrontare la questione senza che sembri un attacco personale.', task: 'Formula la frase di apertura che useresti per dare un feedback costruttivo, basato sui fatti e sul tuo stato d\'animo (es. "Quando vedo X, mi sento Y...").', difficulty: 'Medio', competence: 'assertivita' },
      { id: 'e7', title: 'Richiesta di Feedback (Vendita)', scenario: 'Hai perso un\'importante trattativa. Vuoi chiamare il potenziale cliente per avere un feedback onesto, con l\'obiettivo di imparare e mantenere una buona relazione.', task: 'Scrivi l\'email che invieresti per chiedere questo feedback in modo professionale e non insistente.', difficulty: 'Difficile', competence: 'ascolto' },
    ]
  },
  {
    id: 'm2',
    title: 'Gestire Conversazioni Difficili',
    description: 'Trasforma i conflitti e le obiezioni in opportunità di dialogo e crescita attraverso tecniche strategiche.',
    icon: FlameIcon,
    color: '#C62828',
    headerImage: cardImage2,
    exercises: [
      { 
        id: 'e4', 
        title: 'Comunicare una Decisione Impopolare (Lavoro)',
        scenario: 'Devi comunicare al tuo team che il bonus annuale è stato ridotto a causa dei risultati aziendali.', 
        task: 'Scrivi il messaggio chiave che useresti per comunicare la notizia con empatia e trasparenza.', 
        difficulty: 'Difficile', 
        competence: 'gestione_conflitto' 
      },
      { 
        id: 'e8', 
        title: 'Gestire un Malinteso di Coppia (Partner)',
        scenario: 'Il tuo partner è deluso perché hai dimenticato una data importante. Ti dice con tono freddo: "Evidentemente per te non era così importante."', 
        task: 'Come rispondi per riconoscere il suo sentimento e aprire un dialogo per recuperare la situazione, senza cadere in giustificazioni?', 
        difficulty: 'Medio', 
        competence: 'gestione_conflitto'
      },
      { 
        id: 'e3', 
        title: 'Rispondere a un\'Obiezione (Vendita)',
        scenario: 'Durante una trattativa, un potenziale cliente afferma: "La vostra soluzione costa il doppio rispetto al vostro competitor principale".', 
        task: 'Formula una risposta che riconosca il punto del cliente ma sposti il focus dal prezzo al valore.', 
        difficulty: 'Medio', 
        competence: 'gestione_conflitto' 
      },
    ],
    isPro: true,
  },
  {
    id: 'm3',
    title: 'Padroneggiare le Domande Strategiche',
    description: 'Scopri come usare le domande per guidare le conversazioni, scoprire bisogni nascosti e stimolare la riflessione.',
    icon: QuestionIcon,
    color: '#FFC107',
    headerImage: cardImage3,
    exercises: [
      { id: 'e5', title: 'Da Lamentela a Proposta (Lavoro)', scenario: 'Un membro del team si lamenta: "C\'è troppa burocrazia, non riusciamo a lavorare velocemente".', task: 'Quale domanda faresti per trasformare la lamentela in una proposta costruttiva, responsabilizzandolo?', difficulty: 'Facile', competence: 'riformulazione' },
      { id: 'e6', title: 'Scoprire il Bisogno Reale (Vendita)', scenario: 'Un cliente insiste per avere una funzionalità X. Sospetti che il suo vero problema sia Y, che la funzionalità X non risolverebbe.', task: 'Quale domanda strategica faresti per spostare il focus dalla soluzione (X) al problema reale (Y), senza sminuire la sua richiesta?', difficulty: 'Difficile', competence: 'ascolto' },
      { id: 'e9', title: 'Aprire un Dialogo (Partner)', scenario: 'Senti che c\'è una certa tensione con il tuo partner riguardo a un argomento delicato (es. finanze). Vuoi aprire un dialogo senza mettere pressione.', task: 'Quale domanda strategica useresti per "testare il terreno" e invitare a una conversazione aperta e sicura?', difficulty: 'Medio', competence: 'ascolto' },
    ],
  },
  {
    id: 'm4',
    title: 'Ascolto Attivo e Riformulazione',
    description: 'Vai oltre il semplice "sentire". Impara ad ascoltare per comprendere e a riformulare per confermare e costruire fiducia.',
    icon: TargetIcon, // Placeholder
    color: '#1C3E5E',
    headerImage: cardImage5,
    exercises: [
        { id: 'e10', title: 'Riformulazione Empatica (Lavoro)', scenario: 'Un collega ti dice, preoccupato: "Sono sommerso di lavoro, non so da dove iniziare e temo di non farcela per la scadenza".', task: 'Riformula la sua frase per dimostrargli che hai capito sia il contenuto (il carico) sia l\'emozione (l\'ansia), e per aprire la strada a una soluzione.', difficulty: 'Facile', competence: 'ascolto' },
        { id: 'e11', title: 'Ascoltare il "Non Detto" (Partner)', scenario: 'Il tuo partner torna a casa teso e silenzioso. Alla tua domanda "Tutto bene?", risponde "Sì", ma il suo corpo comunica il contrario.', task: 'Come riformuli la tua osservazione per aprire un canale di comunicazione, dimostrando di aver "ascoltato" il suo non-verbale?', difficulty: 'Medio', competence: 'ascolto' },
        { id: 'e12', title: 'Parafrasi Validante (Vendita)', scenario: 'Un potenziale cliente dice: "Bello, ma non credo che il mio team lo userebbe mai, sono troppo abituati ai vecchi sistemi".', task: 'Riformula la sua preoccupazione (la resistenza al cambiamento) per validarla e allo stesso tempo esplorare più a fondo la sua obiezione.', difficulty: 'Medio', competence: 'ascolto' },
    ]
  },
  {
    id: 'm5',
    title: 'Voce Strategica (Paraverbale)',
    description: 'Allena il tuo strumento più potente: la voce. Impara a gestire tono, ritmo e volume per aumentare il tuo impatto.',
    icon: VoiceIcon,
    color: '#58A6A6',
    headerImage: voceStrategicaHeaderVideo,
    isPro: true,
    exercises: [
        { id: 'v4', title: 'Tono Motivazionale (Lavoro)', scenario: 'Il tuo team è demotivato dopo un periodo intenso. Devi comunicare l\'inizio di una nuova fase del progetto.', task: 'Registra un messaggio vocale che usi un tono energico e positivo per ricaricare il team e infondere fiducia per la prossima sfida.', difficulty: 'Medio', competence: 'riformulazione', exerciseType: ExerciseType.VERBAL },
        { id: 'v5', title: 'Esprimere Vicinanza (Partner)', scenario: 'Il tuo partner ha avuto una giornata molto difficile. Vuoi lasciargli un messaggio vocale per mostrare il tuo supporto.', task: 'Registra un messaggio che usi un tono di voce caldo, calmo e rassicurante per comunicare empatia e vicinanza.', difficulty: 'Facile', competence: 'riformulazione', exerciseType: ExerciseType.VERBAL },
        { id: 'v6', title: 'Presentare il Prezzo (Vendita)', scenario: 'Sei al telefono con un cliente e, dopo aver presentato il valore del tuo prodotto, è arrivato il momento di comunicare il prezzo.', task: 'Registra la frase con cui comunichi il prezzo. Usa un tono di voce fermo, sicuro e senza esitazioni per proiettare il valore dell\'investimento.', difficulty: 'Difficile', competence: 'riformulazione', exerciseType: ExerciseType.VERBAL },
    ]
  },
  {
    id: 'm6',
    isCustom: true,
    title: 'Allenamento Personalizzato',
    description: 'Crea un esercizio su misura per te. L\'AI genererà uno scenario basato sulle tue sfide professionali specifiche.',
    icon: AdminIcon,
    color: '#6D4C41',
    headerImage: allenamentoPersonalizzatoVideo,
    exercises: [],
    isPro: true,
  },
   {
    id: 'm7',
    isCustom: true,
    title: 'Chat Trainer Strategico',
    description: 'Allenati in tempo reale con un simulatore di conversazioni. Incolla un messaggio e impara a rispondere in modo strategico.',
    icon: QuestionIcon,
    color: '#4A148C',
    headerImage: chatTrainerHeaderVideo,
    exercises: [],
    isPro: true,
  },
];

// NEW: Added guided learning paths
export const PATHS: Path[] = [
    {
        id: 'path1',
        title: 'Padroneggiare il Feedback',
        description: 'Un percorso essenziale per imparare a dare e ricevere feedback in modo costruttivo e professionale.',
        exerciseIds: ['e7', 'e1', 'e2'],
    },
    {
        id: 'path2',
        title: 'Il Negoziatore Efficace',
        description: 'Sviluppa le tue abilità di negoziazione, impara a gestire le obiezioni e a guidare la conversazione verso un accordo.',
        exerciseIds: ['e10', 'e3', 'e6', 'e8'],
        isPro: true,
    },
    {
        id: 'path3',
        title: 'Leader Comunicativo',
        description: 'Impara a comunicare decisioni difficili, a motivare il team e a gestire i conflitti interni con sicurezza e assertività.',
        exerciseIds: ['e12', 'e4', 'v1'],
        isPro: true,
    }
];



// --- GAMIFICATION CONSTANTS ---

export const XP_PER_COMPLETION = 25;
export const XP_PER_STREAK_DAY = 15;
export const XP_PER_DAILY_CHALLENGE = 50;

export const LEVELS: Level[] = [
    { level: 1, minXp: 0, label: "Novizio della Comunicazione" },
    { level: 2, minXp: 100, label: "Apprendista Oratore" },
    { level: 3, minXp: 250, label: "Praticante Abile" },
    { level: 4, minXp: 500, label: "Comunicatore Consapevole" },
    { level: 5, minXp: 800, label: "Dialogatore Efficace" },
    { level: 6, minXp: 1200, label: "Persuasore Competente" },
    { level: 7, minXp: 1700, label: "Tessitore di Relazioni" },
    { level: 8, minXp: 2300, label: "Facilitatore Esperto" },
    { level: 9, minXp: 3000, label: "Leader Ispiratore" },
    { level: 10, minXp: 4000, label: "Maestro della Strategia" },
];


export const BADGES: Achievement[] = [
  {
    id: 'first_step',
    title: 'Primi Passi',
    description: 'Hai completato il tuo primo esercizio! Continua così.',
    icon: FirstStepsIcon,
    isUnlocked: (progress) => progress.completedExerciseIds.length >= 1,
  },
  {
    id: 'checkup_complete',
    title: 'Consapevolezza Strategica',
    description: 'Hai completato il check-up e scoperto il tuo profilo.',
    icon: BadgeIcon,
    isUnlocked: (progress) => !!progress.checkupProfile,
  },
  {
    id: 'five_completed',
    title: 'Allievo Costante',
    description: 'Hai completato 5 esercizi diversi. La pratica rende perfetti.',
    icon: MarathonerIcon,
    isUnlocked: (progress) => new Set(progress.completedExerciseIds).size >= 5,
  },
  {
    id: 'streak_3_days',
    title: 'Abitudine Creata',
    description: 'Ti sei allenato per 3 giorni di fila!',
    icon: StreakIcon,
    isUnlocked: (progress) => progress.streak >= 3,
  },
  {
    id: 'pro_user',
    title: 'Investitore in Crescita',
    description: 'Hai sbloccato la versione PRO! Accedi al tuo pieno potenziale.',
    icon: BadgeIcon, // Placeholder, can be a specific PRO icon
    isUnlocked: (progress, entitlements) => entitlements?.productIDs.has('ces.pro.monthly'),
  },
  // Add more badges here
];

// --- HYPER-PERSONALIZATION CONSTANTS ---

export const MAIN_OBJECTIVES = [
  "Gestire il mio team in modo più efficace",
  "Negoziare con clienti difficili",
  "Migliorare le mie relazioni interpersonali",
  "Parlare in pubblico con più sicurezza"
];

export const OBJECTIVE_CATEGORY_MAP: { [key: string]: Exercise['category'] } = {
  [MAIN_OBJECTIVES[0]]: 'team_management',
  [MAIN_OBJECTIVES[1]]: 'negotiation',
  [MAIN_OBJECTIVES[2]]: 'relationships',
  [MAIN_OBJECTIVES[3]]: 'public_speaking',
};

export const OBJECTIVE_MODULE_MAP: { [key: string]: string[] } = {
  [MAIN_OBJECTIVES[0]]: ['m1', 'm2'], // Feedback, Conversazioni Difficili
  [MAIN_OBJECTIVES[1]]: ['m2', 'm3'], // Conversazioni Difficili, Domande
  [MAIN_OBJECTIVES[2]]: ['m4', 'm2'], // Ascolto, Conversazioni Difficili
  [MAIN_OBJECTIVES[3]]: ['m5'],       // Voce Strategica
};


export const DAILY_CHALLENGES: Exercise[] = [
    {
      id: 'daily-1', title: 'Negoziare una Scadenza',
      scenario: 'Un cliente importante ti chiede di anticipare la consegna di un progetto di una settimana, ma sai che questo metterebbe a rischio la qualità e stresserebbe il team.',
      task: 'Scrivi un\'email al cliente per negoziare una scadenza realistica, mantenendo un rapporto positivo e mostrando comprensione per la sua richiesta.',
      difficulty: 'Medio', competence: 'assertivita', category: 'negotiation',
    },
    {
      id: 'daily-2', title: 'Gestire un Feedback Inaspettato',
      scenario: 'Durante una riunione, il tuo manager critica pubblicamente un aspetto del tuo lavoro su cui eri convinto di aver fatto bene. Ti senti sorpreso e un po\' demotivato.',
      task: 'Come rispondi sul momento per gestire la situazione professionalmente e chiedere un chiarimento in privato?',
      difficulty: 'Difficile', competence: 'gestione_conflitto', category: 'team_management',
    },
     {
      id: 'daily-3', title: 'Presentare un\'Idea Innovativa',
      scenario: 'Hai un\'idea per un nuovo processo che potrebbe far risparmiare tempo e denaro all\'azienda, ma sai che alcuni colleghi sono scettici verso i cambiamenti.',
      task: 'Scrivi le prime frasi che useresti per introdurre la tua idea in una riunione di team, cercando di catturare l\'interesse e prevenire le obiezioni.',
      difficulty: 'Medio', competence: 'riformulazione', category: 'team_management',
    },
    {
      id: 'daily-4', title: 'Chiarire un Malinteso con un Amico',
      scenario: 'Un amico sembra arrabbiato con te dopo una conversazione, ma non capisci il perché. Ti sta rispondendo a monosillabi.',
      task: 'Scrivi un messaggio per aprire un dialogo, senza essere accusatorio, per capire cosa è successo.',
      difficulty: 'Facile', competence: 'ascolto', category: 'relationships',
    },
    {
      id: 'daily-5', title: 'Aprire un Discorso in Pubblico',
      scenario: 'Devi tenere un breve discorso di 5 minuti di fronte a 30 persone. Sei un po\' nervoso.',
      task: 'Scrivi una frase di apertura che catturi l\'attenzione del pubblico e ti aiuti a rompere il ghiaccio.',
      difficulty: 'Facile', competence: 'assertivita', category: 'public_speaking',
    }
];

export const WARMUP_QUESTIONS = [
  {
    question: 'Quale di queste 3 frasi è più efficace per calmare un collega arrabbiato?',
    options: [
      'Non hai motivo di essere arrabbiato, non è così grave.',
      'Capisco che tu sia frustrato, cerchiamo di capire insieme.',
      'Cerca di calmarti, non è successo nulla di irreparabile.'
    ],
    correctAnswerIndex: 1,
    explanation: 'La seconda opzione valida l\'emozione dell\'altro ("Capisco che tu sia frustrato") e propone una soluzione collaborativa, che è la strategia più efficace per de-escalare.'
  },
  {
    question: 'Come riformuleresti la lamentela "Questo processo è troppo lento e complicato!" in una richiesta costruttiva?',
    options: [
      'Questo processo è da semplificare, non credete anche voi?',
      'Il processo attuale ci rallenta; possiamo vedere come renderlo più agile?',
      'Non è possibile continuare con questo processo, è troppo complicato.'
    ],
    correctAnswerIndex: 1,
    explanation: 'La seconda opzione contestualizza il problema ("ci rallenta") e propone un\'azione positiva e collaborativa ("Possiamo esplorare modi..."), trasformando la critica in un\'opportunità.'
  },
  {
    question: 'Qual è il modo migliore per dire "no" a una richiesta senza rovinare la relazione?',
    options: [
      'Mi dispiace, ma la mia risposta in questo momento deve essere no.',
      'Ora non riesco perché ho una priorità, ma possiamo parlarne più tardi?',
      'Non sono sicuro di poterti aiutare, ti faccio sapere appena posso.'
    ],
    correctAnswerIndex: 1,
    explanation: 'La seconda opzione usa la tecnica "No, perché, alternativa". Spiega la ragione del rifiuto in modo oggettivo e offre una soluzione alternativa, dimostrando collaborazione.'
  }
];