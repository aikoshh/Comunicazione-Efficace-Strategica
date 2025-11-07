import { StrategicQuestionCategory, ChecklistItem } from './types';

export const QUESTION_LIBRARY: StrategicQuestionCategory[] = [
  {
    category: 'Domande Aperte Esplorative',
    description: 'Usale per aprire la conversazione, raccogliere informazioni ampie e incoraggiare l\'altro a parlare.',
    questions: [
      {
        question: 'Un collega afferma: "Questo nuovo software è completamente inutile". Qual è la domanda migliore per esplorare la sua affermazione senza essere conflittuali?',
        options: [
            'Perché pensi che sia inutile?',
            'Cosa ti porta a dire questo?',
            'Non credi di esagerare un po\'?'
        ],
        correctAnswerIndex: 1,
        explanation: 'La domanda "Cosa ti porta a dire questo?" è la più strategica. È neutra, non giudicante e invita l\'altro a condividere il suo processo di pensiero, aprendo un dialogo costruttivo.'
      },
      {
        question: 'Un cliente sembra insoddisfatto. Qual è la domanda migliore per capire la sua prospettiva?',
        options: [
            'Qual è il problema?',
            'Qual è la tua prospettiva su questa situazione?',
            'Cosa possiamo fare per rimediare?'
        ],
        correctAnswerIndex: 1,
        explanation: 'Chiedere la "prospettiva" è una mossa strategica che mostra rispetto per il punto di vista del cliente e lo invita a un dialogo più ampio, andando oltre la semplice descrizione del problema.'
      },
      {
        question: 'Vuoi capire le motivazioni dietro una decisione di un membro del tuo team. Qual è la domanda più efficace?',
        options: [
          'Perché hai deciso così?',
          'Spiegami la tua decisione.',
          'Puoi raccontarmi di più su come sei arrivato a questa conclusione?'
        ],
        correctAnswerIndex: 2,
        explanation: 'Chiedere di "raccontare il processo" è meno diretto di un "perché", che può suonare inquisitorio. Incoraggia una narrazione che rivela le motivazioni profonde in modo più naturale.'
      }
    ],
  },
  {
    category: 'Domande di Approfondimento (Drill-down)',
    description: 'Ideali per andare in profondità su un punto specifico, chiarire ambiguità e ottenere dettagli cruciali.',
    questions: [
      {
        question: 'Un collaboratore dice: "Il progetto è bloccato, non funziona niente". Qual è la domanda migliore per ottenere dettagli specifici?',
        options: [
          'Quando dici "non funziona", cosa intendi esattamente?',
          'Chi è il responsabile di questo blocco?',
          'Cosa proponi di fare?'
        ],
        correctAnswerIndex: 0,
        explanation: 'Questa domanda trasforma un\'affermazione vaga e generale in un problema specifico e tangibile. È il primo passo fondamentale per poter affrontare e risolvere la situazione.'
      },
      {
        question: 'Un cliente si lamenta di un problema. Per capirne l\'urgenza, quale domanda è più incisiva?',
        options: [
          'Da quanto tempo si verifica questo problema?',
          'Qual è l\'impatto specifico di questo problema sul tuo lavoro?',
          'Hai già segnalato questo problema ad altri?'
        ],
        correctAnswerIndex: 1,
        explanation: 'Quantificare l\'"impatto" permette di capire la reale gravità e urgenza del problema dal punto di vista del cliente, aiutando a prioritizzare l\'intervento in modo corretto.'
      }
    ],
  },
  {
    category: 'Domande Ipotetiche e Future-oriented',
    description: 'Perfette per sbloccare impasse, esplorare possibilità e spostare il focus verso il futuro.',
    questions: [
      {
        question: 'Il team è bloccato su una decisione a causa di limiti di budget. Qual è la domanda migliore per sbloccare la creatività?',
        options: [
          'Come possiamo trovare più budget?',
          'Se il budget non fosse un problema, quale sarebbe il tuo primo passo?',
          'Dobbiamo essere realistici, quali sono le opzioni a basso costo?'
        ],
        correctAnswerIndex: 1,
        explanation: 'Rimuovere temporaneamente i vincoli mentali (come il budget) permette di far emergere la soluzione o la priorità ideale, che può poi essere adattata alla realtà in un secondo momento.'
      },
       {
        question: 'Per ottenere l\'approvazione di uno stakeholder esitante, quale domanda è più strategica?',
        options: [
          'Di quali altre informazioni hai bisogno?',
          'Cosa ti frena dall\'approvare?',
          'Cosa dovrebbe accadere per farti sentire più sicuro riguardo a questa decisione?'
        ],
        correctAnswerIndex: 2,
        explanation: 'Questa domanda sposta il focus dalle obiezioni alle condizioni per il successo. Rivela le necessità concrete dello stakeholder e trasforma un "no" potenziale in una lista di azioni da compiere.'
      }
    ],
  },
  {
    category: 'Domande Riflessive e di Coaching',
    description: 'Stimolano l\'autoconsapevolezza e aiutano l\'altro a trovare le proprie soluzioni, invece di imporle.',
    questions: [
      {
        question: 'Un membro del team è demotivato dopo un fallimento. Qual è la domanda migliore per promuovere la crescita?',
        options: [
          'Cosa hai imparato da questa esperienza?',
          'Come eviterai che succeda di nuovo?',
          'Non preoccuparti, la prossima volta andrà meglio.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Focalizzarsi sull\'apprendimento ("Cosa hai imparato?") trasforma un errore in un\'opportunità di crescita, promuovendo una mentalità resiliente e proattiva.'
      },
      {
        question: 'Un collega si sente sopraffatto da un compito. Quale domanda lo aiuta a ritrovare un senso di controllo?',
        options: [
          'Vuoi che ti aiuti io?',
          'Qual è la parte più difficile?',
          'Cosa è sotto il tuo controllo in questa situazione?'
        ],
        correctAnswerIndex: 2,
        explanation: 'Questa domanda riporta l\'attenzione su ciò che la persona può effettivamente fare, riducendo il senso di impotenza e incoraggiando l\'azione su piccoli passi concreti.'
      }
    ],
  },
  {
    category: 'Domande Strategiche Dicotomiche',
    description: 'Usale per guidare la conversazione, chiudere un loop di pensiero e portare l\'interlocutore a una scelta chiara tra due alternative.',
    questions: [
      {
        question: 'Dopo una lunga discussione, devi portare un cliente a una decisione operativa. Qual è la formulazione più efficace?',
        options: [
          'Quindi, cosa ne pensi?',
          'Cosa vorresti fare ora?',
          'Da quello che capisco, la priorità è la tempistica. Preferisci che partiamo subito con la soluzione standard o che prendiamo un giorno in più per personalizzarla?'
        ],
        correctAnswerIndex: 2,
        explanation: 'La terza opzione è un esempio perfetto di domanda dicotomica. Riformula la priorità ("la tempistica") e offre due alternative concrete (illusione di alternativa), guidando l\'interlocutore verso una scelta chiara e chiudendo il cerchio.'
      },
      {
        question: 'Un progetto è in ritardo e il team discute senza arrivare a una conclusione. Come puoi focalizzare la discussione?',
        options: [
            'Dobbiamo trovare una soluzione, idee?',
            'Quindi, il problema è più una questione di tempo o di risorse?',
            'Chi si prende la responsabilità di questa fase?'
        ],
        correctAnswerIndex: 1,
        explanation: 'Questa domanda costringe il team a definire la natura del vincolo principale. Invece di discutere di tutto, li guida a scegliere tra due categorie di problemi, rendendo la conversazione successiva molto più mirata.'
      }
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