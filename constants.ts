// constants.ts
import { Module, ExerciseType, VoiceAnalysisResult, Exercise } from './types';
import {
  FlameIcon,
  CheckCircleIcon,
  QuestionIcon,
  TargetIcon,
  WrittenIcon,
  VoiceIcon,
  HomeIcon,
  AdminIcon,
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
    title: 'Dare un Feedback Correttivo',
    scenario: 'Un tuo collaboratore, Marco, ha commesso per la terza volta un errore di distrazione in un report importante per un cliente. L\'errore è stato corretto in tempo, ma ha creato un piccolo ritardo.',
    task: 'Come daresti un feedback a Marco per affrontare la situazione in modo costruttivo e prevenire che accada di nuovo?',
    difficulty: 'Medio',
    competence: 'riformulazione',
  },
  {
    id: 'checkup-2',
    title: 'Gestire un Cliente Insoddisfatto',
    scenario: 'Un cliente ti chiama lamentandosi che il servizio ricevuto non è all\'altezza delle sue aspettative e minaccia di interrompere il rapporto di collaborazione.',
    task: 'Come rispondi al telefono per calmare il cliente e iniziare a gestire la situazione in modo strategico?',
    difficulty: 'Difficile',
    competence: 'gestione_conflitto',
  },
  {
    id: 'checkup-3',
    title: 'Chiarire le Aspettative',
    scenario: 'Il tuo capo ti ha assegnato un nuovo progetto con la direttiva "Voglio un risultato eccellente, sorprendimi". Le istruzioni sono molto vaghe.',
    task: 'Quali domande fai al tuo capo per chiarire le aspettative e assicurarti di partire con il piede giusto?',
    difficulty: 'Facile',
    competence: 'ascolto',
  },
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
      { id: 'e1', title: 'Feedback Correttivo a un Collaboratore', scenario: 'Un tuo collaboratore continua a consegnare il lavoro in ritardo, impattando le scadenze del team.', task: 'Prepara e scrivi il discorso che faresti per affrontare il problema in modo costruttivo.', difficulty: 'Facile', competence: 'riformulazione' },
      { id: 'e2', title: 'Feedback a un Manager', scenario: 'Il tuo manager tende a micro-gestire il tuo lavoro, limitando la tua autonomia e rallentandoti.', task: 'Come chiederesti un incontro e cosa diresti per dare un feedback assertivo ma rispettoso?', difficulty: 'Difficile', competence: 'assertivita' },
      { id: 'e7', title: 'Rinforzare un Comportamento Positivo', scenario: 'Un membro del tuo team ha gestito in modo eccellente una situazione difficile con un cliente.', task: 'Scrivi un feedback di rinforzo specifico ed efficace che vada oltre un semplice "bravo!".', difficulty: 'Facile', competence: 'riformulazione' },
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
      { id: 'e3', title: 'Rispondere a un\'Obiezione Forte', scenario: 'Durante una presentazione, un cliente afferma: "La vostra soluzione costa il doppio rispetto al vostro competitor principale".', task: 'Formula una risposta che riconosca il punto del cliente ma sposti il focus sul valore.', difficulty: 'Medio', competence: 'gestione_conflitto' },
      { id: 'e4', title: 'Comunicare una Decisione Impopolare', scenario: 'Devi comunicare al tuo team che il bonus annuale è stato ridotto a causa dei risultati aziendali.', task: 'Scrivi il messaggio chiave che useresti per comunicare la notizia con empatia e trasparenza.', difficulty: 'Difficile', competence: 'assertivita' },
      { id: 'e8', title: 'Dire di No a una Richiesta', scenario: 'Un collega ti chiede di farti carico di una parte significativa del suo lavoro perché è in difficoltà con le scadenze, ma tu sei già al limite.', task: 'Come rifiuti la richiesta in modo assertivo, preservando la relazione con il collega?', difficulty: 'Medio', competence: 'assertivita' },
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
      { id: 'e5', title: 'Da Lamentela a Richiesta', scenario: 'Un membro del team si lamenta: "C\'è troppa burocrazia, non riusciamo a lavorare velocemente".', task: 'Quale domanda faresti per trasformare la lamentela in una proposta costruttiva?', difficulty: 'Facile', competence: 'riformulazione' },
      { id: 'e6', title: 'Scoprire il "Perché" Nascosto', scenario: 'Un cliente insiste per avere una funzionalità che tecnicamente è molto complessa e poco utile per la maggior parte degli utenti.', task: 'Quali domande faresti per capire il bisogno reale che si nasconde dietro la sua richiesta specifica?', difficulty: 'Medio', competence: 'ascolto' },
      { id: 'e9', title: 'Domanda per Sbloccare un Impasse', scenario: 'Durante un brainstorming, il team è bloccato e non emergono nuove idee.', task: 'Formula una domanda "ipotetica" o "magica" per riattivare la creatività del gruppo.', difficulty: 'Medio', competence: 'ascolto' },
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
        { id: 'e10', title: 'Riformulazione a Specchio', scenario: 'Un collega ti dice, con tono preoccupato: "Sono sommerso di lavoro, non so da dove iniziare e temo di non farcela per la scadenza."', task: 'Riformula la sua frase per dimostrargli che hai capito sia il contenuto che l\'emozione.', difficulty: 'Facile', competence: 'ascolto' },
        { id: 'e11', title: 'Sintesi Strategica', scenario: 'Dopo 15 minuti di conversazione, un cliente ti ha spiegato una serie di problemi complessi e intrecciati tra loro.', task: 'Come sintetizzeresti i punti chiave per assicurarti di aver capito bene e definire il prossimo passo?', difficulty: 'Medio', competence: 'ascolto' },
        { id: 'e12', title: 'Ascoltare per l\'"Non Detto"', scenario: 'Un membro del tuo team dice "Sì, sì, ho capito tutto" ma il suo linguaggio del corpo (sguardo basso, braccia conserte) comunica insicurezza.', task: 'Cosa diresti per verificare la sua reale comprensione in modo non inquisitorio?', difficulty: 'Difficile', competence: 'ascolto' },
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
        { id: 'v1', title: 'Comunicare Urgenza e Calma', scenario: 'C\'è un problema critico sulla produzione. Devi comunicarlo al team tecnico.', task: 'Registra un messaggio vocale che comunichi l\'urgenza del problema ma infonda calma e fiducia nella capacità del team di risolverlo.', difficulty: 'Facile', competence: 'riformulazione', exerciseType: ExerciseType.VERBAL },
        { id: 'v2', title: 'Proiettare Sicurezza', scenario: 'Stai per presentare la tua idea a un gruppo di investitori.', task: 'Registra la frase di apertura della tua presentazione. Usa un tono di voce, un ritmo e un volume che comunichino sicurezza e competenza.', difficulty: 'Medio', competence: 'riformulazione', exerciseType: ExerciseType.VERBAL },
        { id: 'v3', title: 'Usare le Pause Efficaci', scenario: 'Devi comunicare un punto molto importante durante una riunione.', task: 'Registra la frase: "La nostra priorità assoluta per il prossimo trimestre è una sola: la soddisfazione del cliente." Usa le pause per dare massimo impatto alle parole chiave.', difficulty: 'Difficile', competence: 'riformulazione', exerciseType: ExerciseType.VERBAL },
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
    exercises: [] // Gli esercizi sono generati dinamicamente
  },
   {
    id: 'm7',
    isCustom: true,
    title: 'Chat Trainer Strategico',
    description: 'Allenati in tempo reale. Incolla un messaggio che hai ricevuto e ottieni suggerimenti strategici su come rispondere.',
    icon: QuestionIcon,
    color: '#4A148C',
    headerImage: chatTrainerHeaderVideo,
    exercises: []
  },
];
