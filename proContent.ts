import { StrategicQuestionCategory, ChecklistItem } from './types';

export const QUESTION_LIBRARY: StrategicQuestionCategory[] = [
  {
    category: 'Domande Aperte Esplorative',
    description: 'Usale per aprire la conversazione, raccogliere informazioni ampie e incoraggiare l\'altro a parlare.',
    questions: [
      { question: 'Cosa ti porta a dire questo?', description: 'Invita a elaborare un\'affermazione senza metterla in discussione.' },
      { question: 'Qual è la tua prospettiva su questa situazione?', description: 'Mostra rispetto per il punto di vista altrui e apre al dialogo.' },
      { question: 'Puoi raccontarmi di più su come sei arrivato a questa conclusione?', description: 'Incoraggia a condividere il processo di pensiero, utile per capire le motivazioni profonde.' },
      { question: 'Come immagini la soluzione ideale?', description: 'Sposta il focus dal problema alla soluzione, stimolando una visione costruttiva.' },
      { question: 'Quali sono stati i fattori più importanti nella tua decisione?', description: 'Aiuta a identificare le priorità e i valori dell\'interlocutore.' },
    ],
  },
  {
    category: 'Domande di Approfondimento (Drill-down)',
    description: 'Ideali per andare in profondità su un punto specifico, chiarire ambiguità e ottenere dettagli cruciali.',
    questions: [
      { question: 'Quando dici "non funziona", cosa intendi esattamente?', description: 'Trasforma un\'affermazione vaga in un problema specifico e tangibile.' },
      { question: 'Qual è l\'impatto specifico di questo problema sul tuo lavoro?', description: 'Quantifica le conseguenze e aiuta a capire l\'urgenza.' },
      { question: 'Puoi farmi un esempio concreto?', description: 'Chiede prove pratiche per evitare fraintendimenti e generalizzazioni.' },
      { question: 'Cosa hai già provato a fare per risolvere?', description: 'Evita di suggerire soluzioni già tentate e mostra rispetto per gli sforzi altrui.' },
      { question: 'Tra tutti questi punti, quale ti preoccupa di più in questo momento?', description: 'Aiuta a prioritizzare e ad affrontare il problema più sentito.' },
    ],
  },
  {
    category: 'Domande Ipotetiche e Future-oriented',
    description: 'Perfette per sbloccare impasse, esplorare possibilità e spostare il focus verso il futuro.',
    questions: [
      { question: 'Se il budget non fosse un problema, quale sarebbe il tuo primo passo?', description: 'Rimuove i vincoli mentali per far emergere la vera priorità.' },
      { question: 'Immaginiamo di essere tra sei mesi e di aver risolto questo problema. Cosa vedi?', description: 'Incoraggia una visione positiva e aiuta a definire l\'obiettivo finale.' },
      { question: 'Cosa dovrebbe accadere per farti sentire più sicuro riguardo a questa decisione?', description: 'Rivela le condizioni necessarie per ottenere il buy-in.' },
      { question: 'Se potessi cambiare una sola cosa di questo progetto, quale sarebbe?', description: 'Focalizza l\'attenzione sull\'elemento a più alto impatto.' },
      { question: 'Qual è il rischio peggiore se non facciamo nulla?', description: 'Evidenzia il costo dell\'inazione e crea un senso di urgenza.' },
    ],
  },
  {
    category: 'Domande Riflessive e di Coaching',
    description: 'Stimolano l\'autoconsapevolezza e aiutano l\'altro a trovare le proprie soluzioni, invece di imporle.',
    questions: [
      { question: 'Cosa hai imparato da questa esperienza?', description: 'Promuove l\'apprendimento e la crescita personale.' },
      { question: 'Quale delle tue capacità potrebbe aiutarti a superare questo ostacolo?', description: 'Focalizza sulle risorse interne e aumenta la fiducia.' },
      { question: 'Cosa è sotto il tuo controllo in questa situazione?', description: 'Riporta il focus sull\'azione e riduce il senso di impotenza.' },
      { question: 'Di quale supporto avresti bisogno per avere successo?', description: 'Apre la porta alla collaborazione e al sostegno mirato.' },
      { question: 'Qual è il primo, piccolo passo che puoi fare oggi?', description: 'Trasforma un grande problema in un\'azione gestibile e immediata.' },
    ],
  },
  {
    category: 'Domande Strategiche Dicotomiche',
    description: 'Usale per guidare la conversazione, chiudere un loop di pensiero e portare l\'interlocutore a una scelta chiara tra due alternative.',
    questions: [
      { question: 'Da quello che capisco, la priorità è X. Preferisci che ci concentriamo prima su A o su B?', description: 'Restringe il campo e spinge a una decisione operativa.' },
      { question: 'Quindi, il problema è più una questione di tempo o di budget?', description: 'Costringe a definire la natura del vincolo principale.' },
      { question: 'Per procedere, abbiamo bisogno della tua approvazione. Possiamo considerarla confermata o hai bisogno di ulteriori dettagli?', description: 'Crea un bivio chiaro tra azione e ulteriore discussione, evitando lo stallo.' },
      { question: 'Mi sembra che ci siano due strade: rinegoziare la scadenza o ridurre l\'ambito del progetto. Quale preferisci esplorare?', description: 'Presenta opzioni realistiche e sposta la responsabilità della scelta.' },
      { question: 'Per questa fase, è più importante per te la velocità di esecuzione o la precisione assoluta?', description: 'Chiarisce le priorità e le aspettative su un compito specifico.' },
    ],
  },
];


export const PREPARATION_CHECKLIST: ChecklistItem[] = [
    { id: 'c1', text: 'Qual è l\'UNICO obiettivo più importante di questa conversazione?' },
    { id: 'c2', text: 'Qual è lo stato d\'animo probabile del mio interlocutore? Come posso sintonizzarmi?' },
    { id: 'c3', text: 'Quali sono i 3 punti chiave che voglio assolutamente comunicare?' },
    { id: 'c4', text: 'Quale potrebbe essere la principale obiezione o resistenza? Come posso anticiparla?' },
    { id: 'c5', text: 'Come voglio che si senta l\'altra persona ALLA FINE della conversazione?' },
    { id: 'c6', text: 'Qual è la prima frase che dirò per impostare un tono costruttivo?' },
    { id: 'c7', text: 'Ho preparato almeno una domanda aperta per dimostrare ascolto?' },
    { id: 'c8', text: 'Qual è il mio "piano B" se la conversazione non va come previsto?' },
    { id: 'c9', text: 'Ho definito chiaramente quali saranno i prossimi passi dopo la conversazione?' },
    { id: 'c10', text: 'Ho verificato il mio stato emotivo? Sono calmo, centrato e pronto?' },
];