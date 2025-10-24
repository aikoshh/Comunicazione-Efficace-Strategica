// constants.ts

// Moved COLORS to the top before any imports to resolve circular dependency issues.
export const COLORS = {
  primary: '#1C3E5E', // Blu profondo
  secondary: '#58A6A6', // Verde acqua
  base: '#F8F7F4', // Sfondo beige chiaro
  card: '#FFFFFF',
  cardDark: '#F0F0F0', // Per sezioni interne
  textPrimary: '#1C2025',
  textSecondary: '#667085',
  textAccent: '#333333',
  divider: '#EAECEE',
  success: '#28A745',
  error: '#DC3545',
  warning: '#FFC107',
  accentBeige: '#D4C8B6',
  primaryGradient: 'linear-gradient(135deg, #1C3E5E 0%, #3a7a7a 100%)',
};

import {
  DifficultyLevel,
  Exercise,
  ExerciseType,
  Module,
  VoiceRubricCriterion,
} from './types';
import {
  BarChartIcon,
  CheckCircleIcon,
  HomeIcon,
  LightbulbIcon,
  MicIcon,
  QuestionIcon,
  SendIcon,
  TargetIcon,
  VoiceIcon,
  WrittenIcon,
  BackIcon,
  SpeakerIcon,
  SpeakerOffIcon,
  RetryIcon,
  NextIcon,
  WarningIcon,
  XCircleIcon,
  InfoIcon,
  CloseIcon,
  CrownIcon,
  DownloadIcon,
  UploadIcon,
  DocumentTextIcon,
} from './components/Icons';
import * as assets from './assets';


export const EXERCISE_TYPE_ICONS: { [key in ExerciseType]: any } = {
  [ExerciseType.WRITTEN]: WrittenIcon,
  [ExerciseType.VERBAL]: VoiceIcon,
};

export const VOICE_RUBRIC_CRITERIA: VoiceRubricCriterion[] = [
  { id: 'ritmo', label: 'Ritmo', description: 'La velocità del parlato. Troppo veloce può risultare ansiogeno, troppo lento noioso.' },
  { id: 'tono', label: 'Tono', description: 'La variazione melodica della voce. Un tono monotono è poco coinvolgente.' },
  { id: 'volume', label: 'Volume', description: 'L\'intensità della voce. Deve essere adeguata al contesto e all\'interlocutore.' },
  { id: 'pause', label: 'Pause', description: 'L\'uso strategico del silenzio per dare enfasi, creare attesa o permettere la riflessione.' },
  { id: 'chiarezza', label: 'Chiarezza', description: 'L\'articolazione delle parole. Una dizione chiara è fondamentale per essere compresi.' },
];

const checkupExercises: Exercise[] = [
    {
      id: 'checkup-1',
      title: 'Check-up: La Riformulazione Sintetica',
      scenario: 'Un tuo collega, chiaramente frustrato, ti dice: "Sono stufo! Il progetto Rossi è un disastro completo. Il cliente cambia idea ogni due giorni, il budget è quasi esaurito e il team è demotivato. Non so più dove sbattere la testa."',
      task: 'Riformula sinteticamente la sua preoccupazione per dimostrare che hai capito e per aprire un dialogo costruttivo.',
      difficulty: DifficultyLevel.BASE,
      competence: 'riformulazione',
      exerciseType: ExerciseType.WRITTEN,
    },
    {
      id: 'checkup-2',
      title: 'Check-up: Gestire una Critica',
      scenario: 'Il tuo manager ti dice durante una revisione: "Ho notato che ultimamente le tue presentazioni mancano un po\' di mordente. Sono corrette, ma non riescono a coinvolgere veramente il pubblico. Dobbiamo lavorarci su."',
      task: 'Rispondi alla critica in modo assertivo e aperto al feedback, senza metterti sulla difensiva.',
      difficulty: DifficultyLevel.INTERMEDIO,
      competence: 'gestione_conflitto',
      exerciseType: ExerciseType.WRITTEN,
    },
    {
      id: 'checkup-3',
      title: 'Check-up: Porre una Domanda Potente',
      scenario: 'Durante una riunione di team, un membro dice: "Questa nuova procedura è troppo complicata e ci farà solo perdere tempo". L\'atmosfera si fa tesa.',
      task: 'Poni una sola domanda strategica per sbloccare la situazione, spostando il focus dalla lamentela alla soluzione.',
      difficulty: DifficultyLevel.AVANZATO,
      competence: 'ascolto',
      exerciseType: ExerciseType.WRITTEN,
    },
];
export const STRATEGIC_CHECKUP_EXERCISES: Exercise[] = checkupExercises;

export const MODULES: Module[] = [
  {
    id: 'm4',
    title: 'Ascolto Attivo Strategico',
    description: 'Vai oltre il "sentire". Impara ad ascoltare per capire veramente, creare sintonia e cogliere le opportunità nascoste.',
    icon: CheckCircleIcon,
    headerImage: assets.ascoltoStrategicoHeaderVideo,
    isPro: false,
    prerequisites: [], // Modulo base, nessun prerequisito
    exercises: [
        { id: 'e10', title: 'Riformulazione Empatica', scenario: 'Un amico ti confida: "Mi sento sopraffatto, ho troppe cose da fare e non riesco a stare dietro a nulla. Credo di non essere all\'altezza."', task: 'Rispondi con una riformulazione che validi la sua emozione e gli faccia capire che lo stai ascoltando veramente.', difficulty: DifficultyLevel.BASE, competence: 'ascolto' },
        { id: 'e11', title: 'Ascoltare per Identificare il "Non Detto"', scenario: 'Durante una trattativa, il fornitore dice: "Possiamo discutere uno sconto, ma la nostra priorità è una partnership a lungo termine".', task: 'Formula una risposta che dimostri di aver colto il suo bisogno nascosto (la stabilità) oltre alla richiesta esplicita (lo sconto).', difficulty: DifficultyLevel.INTERMEDIO, competence: 'ascolto' },
        { id: 'e12', title: 'Usare il Silenzio Strategicamente', scenario: 'Hai appena presentato una proposta complessa. L\'interlocutore rimane in silenzio, pensieroso.', task: 'Descrivi come gestiresti questo silenzio e quale breve frase (o domanda) useresti per riprendere il dialogo senza mettere pressione.', difficulty: DifficultyLevel.AVANZATO, competence: 'ascolto' },
    ],
  },
  {
    id: 'm1',
    title: 'Dare un Feedback Efficace',
    description: 'Impara a dare feedback costruttivi che motivano al cambiamento invece di generare conflitto.',
    icon: LightbulbIcon,
    headerImage: assets.dareFeedbackEfficaceHeaderVideo,
    isPro: false,
    prerequisites: ['m4'], // Si sblocca dopo "Ascolto Attivo"
    exercises: [
      { id: 'e1', title: 'Feedback Correttivo a un Collaboratore', scenario: 'Un tuo collaboratore, Marco, ha consegnato un report importante con diversi errori di battitura e dati imprecisi. È la seconda volta che succede.', task: 'Dai un feedback a Marco in modo costruttivo, focalizzandoti sul comportamento e sulla soluzione.', difficulty: DifficultyLevel.BASE, competence: 'riformulazione', headerImage: assets.riformulazioneSinteticaHeaderImg },
      { id: 'e2', title: 'Feedback Assertivo al Tuo Manager', scenario: 'Il tuo manager continua ad assegnarti compiti dell\'ultimo minuto che ti costringono a fare straordinari non pianificati, impattando sulla qualità del tuo lavoro principale.', task: 'Comunica al tuo manager l\'impatto di queste richieste e proponi una soluzione alternativa.', difficulty: DifficultyLevel.AVANZATO, competence: 'assertivita' },
      { id: 'e7', title: 'Rinforzare un Comportamento Positivo', scenario: 'Hai notato che una collega, Giulia, ha gestito in modo eccellente un cliente difficile, mantenendo la calma e trovando una soluzione brillante.', task: 'Dai un feedback di rinforzo a Giulia che sia specifico e che la incoraggi a mantenere questo approccio.', difficulty: DifficultyLevel.INTERMEDIO, competence: 'riformulazione' },
    ],
  },
  {
    id: 'm2',
    title: 'Gestire Conversazioni Difficili',
    description: 'Trasforma discussioni tese in dialoghi produttivi, gestendo obiezioni e disaccordi con sicurezza.',
    icon: BarChartIcon,
    headerImage: assets.gestireConversazioniDifficiliHeaderVideo,
    isPro: false,
    prerequisites: ['m1'], // Si sblocca dopo "Dare Feedback"
    exercises: [
      { id: 'e3', title: 'Rispondere a una Critica Ingiusta', scenario: 'Un cliente ti accusa via email di "scarsa professionalità" perché non hai risposto a una sua richiesta inviata alle 22:00 della sera precedente.', task: 'Scrivi una risposta che sia professionale, assertiva e che ridefinisca i confini della collaborazione senza creare una rottura.', difficulty: DifficultyLevel.INTERMEDIO, competence: 'gestione_conflitto' },
      { id: 'e4', title: 'Comunicare una Decisione Impopolare', scenario: 'Devi comunicare al tuo team che, a causa di tagli al budget, il bonus annuale verrà ridotto del 50%.', task: 'Prepara un breve discorso per comunicare la notizia in modo trasparente, empatico ma fermo, gestendo il probabile malcontento.', difficulty: DifficultyLevel.AVANZATO, competence: 'assertivita' },
      { id: 'e8', title: 'Dire di "No" a una Richiesta', scenario: 'Un collega ti chiede di farti carico di una parte significativa del suo lavoro perché lui è "troppo impegnato", ma anche tu sei al limite delle tue capacità.', task: 'Rifiuta la sua richiesta in modo gentile ma inequivocabile, proteggendo il tuo tempo senza rovinare il rapporto.', difficulty: DifficultyLevel.BASE, competence: 'assertivita' },
    ],
  },
  {
    id: 'm3',
    title: 'Padroneggiare l\'Arte delle Domande',
    description: 'Scopri come usare le domande per guidare le conversazioni, scoprire bisogni nascosti e stimolare la riflessione.',
    icon: QuestionIcon,
    headerImage: assets.domandeStrategicheHeaderVideo,
    isPro: true,
    prerequisites: ['m2'], // Modulo PRO
    exercises: [
        { id: 'e5', title: 'Domanda per Chiarire un\'Aspettativa', scenario: 'Il tuo capo ti dice: "Voglio che questo report sia perfetto e che abbia un forte impatto".', task: 'Fai una domanda per trasformare questa richiesta vaga in un\'istruzione concreta e misurabile.', difficulty: DifficultyLevel.BASE, competence: 'riformulazione' },
        { id: 'e6', title: 'Domanda per Sbloccare un "Sì"', scenario: 'Un potenziale cliente dice: "La vostra proposta è interessante, ma il prezzo è troppo alto".', task: 'Poni una domanda che sposti il focus dal prezzo al valore, per riaprire la negoziazione.', difficulty: DifficultyLevel.INTERMEDIO, competence: 'riformulazione' },
        { id: 'e9', title: 'Domanda per Gestire una Lamentela', scenario: 'Un membro del team si lamenta dicendo: "Le riunioni sono una perdita di tempo, non ne posso più".', task: 'Fai una domanda che lo responsabilizzi e lo inviti a proporre una soluzione.', difficulty: DifficultyLevel.AVANZATO, competence: 'ascolto' },
    ],
  },
  {
    id: 'm5',
    title: 'Voce Strategica (Paraverbale)',
    description: 'Allena il "come" dici le cose. Modula tono, ritmo e volume per rendere il tuo messaggio più persuasivo e sicuro.',
    icon: VoiceIcon,
    headerImage: assets.voceStrategicaHeaderVideo,
    isPro: true,
    prerequisites: ['m3'], // Modulo PRO avanzato
    exercises: [
        { id: 'v1', title: 'Comunicare Calma e Controllo', scenario: 'Devi annunciare al team un problema tecnico imprevisto che causerà un ritardo. L\'ansia è palpabile.', task: 'Registra un messaggio audio (massimo 30 secondi) per comunicare la situazione, usando un tono pacato e un ritmo controllato per trasmettere sicurezza.', difficulty: DifficultyLevel.BASE, exerciseType: ExerciseType.VERBAL, competence: 'riformulazione' },
        { id: 'v2', title: 'Creare Entusiasmo e Motivazione', scenario: 'È l\'inizio di un nuovo progetto e devi presentare gli obiettivi al team.', task: 'Registra un breve discorso (massimo 45 secondi) usando un tono energico, variazioni di ritmo e pause strategiche per creare coinvolgimento.', difficulty: DifficultyLevel.INTERMEDIO, exerciseType: ExerciseType.VERBAL, competence: 'riformulazione' },
        { id: 'v3', title: 'Essere Assertivo e Fermo', scenario: 'Devi interrompere un collega che sta divagando durante una riunione importante, per riportare la discussione sul punto principale.', task: 'Registra la frase che useresti, concentrandoti su un volume deciso, un tono fermo (ma non aggressivo) e una dizione chiara.', difficulty: DifficultyLevel.AVANZATO, exerciseType: ExerciseType.VERBAL, competence: 'riformulazione' },
    ],
  },
  {
    id: 'm6',
    title: 'Allenamento Personalizzato',
    description: 'Crea un esercizio su misura per te. L\'AI genererà uno scenario basato sulla tua professione e le tue sfide specifiche.',
    icon: TargetIcon,
    headerImage: assets.allenamentoPersonalizzatoVideo,
    isPro: true,
    isCustom: true,
    prerequisites: [], // Sempre accessibile
    exercises: [], // Gli esercizi sono generati dinamicamente
  },
  {
    id: 'm7',
    title: 'Chat Strategica (AI Trainer)',
    description: 'Hai un messaggio difficile da scrivere? Usa questo trainer per generare risposte strategiche a email, chat e messaggi.',
    icon: SendIcon,
    headerImage: assets.chatTrainerHeaderVideo,
    isPro: true,
    isCustom: true, // Questo modulo ha una schermata speciale
    prerequisites: [], // Sempre accessibile (se PRO)
    exercises: [],
  },
];