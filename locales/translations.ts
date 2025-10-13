export const translations = {
  it: {
    // General UI
    home: "Home",
    exercise: "Esercizio",
    report: "Report",
    review: "Revisione",
    strategicCheckup: "Check-up Strategico",
    communicatorProfile: "Profilo Comunicatore",
    unlockPro: "Sblocca PRO",
    logout: "Logout",
    completed: "Completato",
    difficultyBase: "Base",
    difficultyIntermediate: "Intermedio",
    difficultyAdvanced: "Avanzato",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Termini di Servizio",
    
    // Login Screen
    welcomeTo: "Benvenuto in",
    loginSlogan: "e inizia subito il tuo percorso di allenamento.",
    emailLabel: "Email",
    passwordLabel: "Password",
    loginButton: "Accedi",
    noAccount: "Non hai un account? Registrati adesso",
    guestAccess: "Accedi senza essere registrato",
    createAccountTitle: "Crea il tuo Account",
    firstNameLabel: "Nome",
    lastNameLabel: "Cognome",
    confirmPasswordLabel: "Conferma Password",
    captchaLabel: "Verifica: quanto fa {{num1}} + {{num2}}?",
    agreeToTerms: "Accetto la",
    registerButton: "Registrati",
    alreadyHaveAccount: "Hai già un account? Accedi",
    invalidCredentials: "Email o password non validi.",
    userExistsError: "Un utente con questa email è già registrato.",
    registrationSuccess: "Registrazione completata! Ora puoi accedere.",
    
    // Home Screen
    homeTitle: "Inizia ora il tuo Allenamento con la Comunicazione Efficace Strategica®",
    homeSubtitle: "Seleziona la tua prossima sessione dalla Mappa delle Competenze o affronta la Sfida del Giorno.",
    checkupPromptTitle: "Valuta il tuo Livello Iniziale",
    checkupPromptText: "Completa il test di analisi per scoprire il tuo profilo di comunicatore e ricevere un percorso di allenamento personalizzato.",
    startTestButton: "Inizia il Test",
    dailyChallenge: "Sfida del Giorno",
    competenceMap: "Mappa delle Competenze",
    fundamentals: "Fondamentali",
    sectoralPacks: "Pacchetti Settoriali Professionali",
    lockedModuleTooltip: "Completa i moduli propedeutici per sbloccare",
    
    // Module Screen
    proQuestionLibrary: "Libreria Domande PRO",
    proPreparationChecklist: "Checklist Preparazione PRO",
    
    // Exercise Screen
    backToModule: "Torna al Modulo",
    readScenario: "Leggi scenario",
    stopReading: "Ferma lettura",
    checkupStep: "Passo {{current}} di {{total}}",
    scenarioLabel: "Scenario",
    taskLabel: "Compito",
    yourObjectiveLabel: "Tuo Obiettivo",
    responseTitle: "Risposta",
    responsePlaceholder: "Scrivi qui la tua risposta migliore...",
    submitResponse: "Invia Risposta",
    skipExercise: "Salta Esercizio",
    speechNotSupported: "Il riconoscimento vocale non è supportato da questo browser.",
    listening: "Sto ascoltando...",
    transcriptPlaceholder: "La tua trascrizione apparirà qui.",
    recordingInProgress: "Registrazione in Corso...",
    clickToDictate: "Clicca per Dettare",
    submitForAnalysis: "Invia per Analisi",
    stopDictation: "Ferma Dettatura",
    replyWithVoice: "Rispondi a Voce",
    responseEmptyError: "La risposta non può essere vuota.",
    unknownError: "Si è verificato un errore sconosciuto.",
    
    // Report Screens
    analysisReportTitle: "Report dell'Analisi",
    voiceReportTitle: "Report Voce & Paraverbale",
    exportToPdf: "Esporta in PDF",
    strengths: "Punti di Forza",
    areasForImprovement: "Aree di Miglioramento",
    wasThisHelpful: "È stato utile?",
    suggestedResponse: "Risposta Suggerita",
    shortVersion: "Versione Breve",
    longVersion: "Versione Lunga",
    retryExercise: "Riprova Esercizio",
    nextExercise: "Prossimo Esercizio",
    proDetailedEvaluation: "Valutazione Dettagliata PRO",
    proQuestionMetrics: "Metriche Avanzate Domanda PRO",
    utility: "Utilità della Domanda",
    clarity: "Chiarezza della Domanda",
    practicalActions: "Azioni Pratiche",
    microDrill: "Micro-Drill (60s)",
    listenToIdealVersion: "Ascolta Versione Ideale",
    stopListening: "Ferma Ascolto",
    
    // Review Screen
    reviewTitle: "Revisione Esercizio",
    completedOn: "Completato il: {{date}}",
    yourPreviousResponse: "La tua risposta precedente",
    
    // Paywall
    productUnlockedSuccess: "{{productName}} sbloccato con successo!",
    purchaseError: "Errore durante l'acquisto.",
    restoreSuccess: "Acquisti ripristinati con successo.",
    restoreError: "Errore durante il ripristino.",
    
    // Gemini Prompts
    gemini: {
        scoreDescription: "Un punteggio da 0 a 100 che rappresenta l'efficacia complessiva della risposta dell'utente, basato sui criteri di valutazione forniti.",
        strengthsDescription: "Un elenco di 2-3 punti che evidenziano ciò che l'utente ha fatto bene, in relazione ai criteri di valutazione.",
        areasForImprovementDescription: "Un elenco di 2-3 punti su cosa l'utente potrebbe migliorare, ognuno con un suggerimento e un esempio pratico virgolettato.",
        improvementSuggestionDescription: "Il consiglio specifico su cosa l'utente potrebbe migliorare, collegato a uno dei criteri di valutazione.",
        improvementExampleDescription: "Una frase di esempio virgolettata che mostra come applicare il suggerimento. Es: \"Invece di dire 'hai sbagliato', potresti dire 'ho notato che questo approccio ha portato a...'\"",
        suggestedResponseShortDescription: "Una versione concisa e riscritta della risposta dell'utente (1-2 frasi). Le parole chiave importanti sono evidenziate con **doppi asterischi**.",
        suggestedResponseLongDescription: "Una versione più dettagliata e completa della risposta dell'utente, che incarna i principi della comunicazione efficace. Le parole chiave importanti sono evidenziate con **doppi asterischi**.",
        detailedRubricDescription: "Valutazione dettagliata PRO. Compila questo campo SOLO se richiesto nelle istruzioni del prompt.",
        utilityScoreDescription: "Punteggio da 1 a 10 sull'utilità della domanda posta. Compila questo campo SOLO se richiesto.",
        clarityScoreDescription: "Punteggio da 1 a 10 sulla chiarezza della domanda posta. Compila questo campo SOLO se richiesto.",
        proActiveInstructions: {
            detailedEvaluation: "**Funzionalità PRO ATTIVA: Valutazione Dettagliata.** DEVI fornire una valutazione dettagliata per ciascuno dei 5 criteri chiave (Chiarezza, Tono ed Empatia, Orientamento alla Soluzione, Assertività, Struttura). Per ogni criterio, fornisci un punteggio da 1 a 10 e una breve motivazione. Popola il campo 'detailedRubric' nel JSON.",
            questionMetrics: "**Funzionalità PRO ATTIVA: Metriche Domande.** L'utente sta formulando una domanda. Valutala secondo due metriche specifiche: 'utilityScore' (quanto la domanda è utile per raggiungere l'obiettivo) e 'clarityScore' (quanto la domanda è chiara e non ambigua), entrambe con un punteggio da 1 a 10. Popola i campi 'utilityScore' and 'clarityScore' nel JSON."
        },
        verbalContext: {
            isVerbal: "La risposta dell'utente è stata fornita verbalmente. Considera fattori come la concisione e la chiarezza adatti alla comunicazione parlata. Ignora eventuali errori di trascrizione o di battitura.",
            isWritten: "La risposta dell'utente è stata scritta. Analizzala per chiarezza, tono e struttura come faresti con un testo scritto."
        },
        systemInstructionWritten: `Sei un coach di Comunicazione Efficace Strategica (CES) di livello mondiale. Il tuo ruolo è analizzare le risposte degli utenti a scenari di comunicazione complessi e fornire un feedback dettagliato, costruttivo e personalizzato. Rispondi SEMPRE e solo in italiano.\n\nValuta ogni risposta in base ai seguenti criteri chiave:\n1.  **Chiarezza e Concisinza**: La risposta è diretta, facile da capire e priva di ambiguità?\n2.  **Tono ed Empatia**: Il tono è appropriato per lo scenario? Dimostra comprensione e rispetto per l'altra persona?\n3.  **Orientamento alla Soluzione**: La risposta si concentra sulla risoluzione del problema o sul raggiungimento di un obiettivo costruttivo, invece che sulla colpa?\n4.  **Assertività**: L'utente esprime i propri bisogni o punti di vista in modo chiaro e rispettoso, senza essere passivo o aggressivo?\n5.  **Struttura**: La comunicazione segue una logica chiara (es. descrivere i fatti, esprimere l'impatto, proporre una soluzione)?\n\nBasa il tuo punteggio (score) su una valutazione olistica di questi criteri in relazione allo specifico scenario e compito. Il punteggio deve riflettere fedelmente la qualità della risposta dell'utente. Una risposta molto buona dovrebbe avere un punteggio alto, una mediocre un punteggio medio, e una cattiva un punteggio basso. Non dare sempre lo stesso punteggio.\n\nLe tue analisi devono essere incoraggianti e mirate ad aiutare l'utente a migliorare concretamente. Fornisci la tua analisi esclusivamente nel formato JSON richiesto.`,
        userObjectivePrompt: (objective: string) => `\n**Obiettivo Personale dell'Utente:** Oltre al compito principale, l'utente voleva specificamente raggiungere questo obiettivo: "${objective}". Valuta la sua risposta anche in base a questo, includendo un commento su questo punto nei tuoi feedback (punti di forza o aree di miglioramento).`,
        promptLabels: {
            scenario: "Scenario",
            task: "Compito dell'utente",
            userResponse: "Risposta dell'utente",
            analysisContext: "Contesto di analisi"
        },
        finalInstruction: "Analizza la risposta dell'utente secondo le direttive fornite nella tua istruzione di sistema e genera il feedback strutturato in formato JSON.",
        paraverbalSchema: {
            scores: "Un elenco di punteggi (da 1 a 10) per ciascuno dei 10 criteri paraverbali, con una breve motivazione per ogni punteggio.",
            strengths: "Un elenco di esattamente 3 punti di forza paraverbali emersi dalla risposta.",
            improvements: "Un elenco di esattamente 3 aree di miglioramento paraverbali.",
            actions: "Un elenco di esattamente 3 azioni pratiche e concrete che l'utente può intraprendere per migliorare.",
            micro_drill_60s: "Un micro-esercizio specifico e immediato, della durata massima di 60 secondi, per lavorare su uno dei punti deboli.",
            annotated_text: "Il testo della risposta dell'utente, arricchito con simboli per indicare pause (☐) ed enfasi (△).",
            ideal_script: "La versione ideale della risposta dell'utente, riscritta per essere pronunciata in modo ottimale. Questo testo verrà usato per la sintesi vocale."
        },
        systemInstructionVerbal: `Sei **CES Coach Engine** esteso con il modulo **Voce Strategica (Paraverbale)**. Valuta e allena il paraverbale per rendere più efficace il messaggio secondo i principi della Comunicazione Efficace Strategica®. Rispondi SEMPRE e solo in italiano.\n\nConsidera i seguenti **fattori chiave paraverbali**:\n- **Respirazione & ritmo (pacing)**: regolarità, pause significative, assenza di affanno.\n- **Velocità (parole/minuto)**: ritmo naturale; evitare eccesso/deficit di velocità.\n- **Volume**: udibile e stabile; variazioni intenzionali per enfasi.\n- **Tono/Timbro & Calore**: fermo, empatico, professionale; evitare piattezza/metallicità.\n- **Intonazione & Melodia**: variazione per mantenere attenzione; evitare monotonia/cantilena.\n- **Articolazione & Dizione**: nitidezza di consonanti, sillabe non elise.\n- **Enfasi strategica**: parole-chiave evidenziate con pause/intonazione.\n- **Pause strategiche**: prima/dopo concetti chiave; evitare silenzi imbarazzanti.\n- **Disfluenze & filler**: gestione di “ehm”, autocorrezioni, sovrapposizioni.\n- **Allineamento con intento strategico**: coerenza vocale con obiettivo (empatia, fermezza, negoziazione, de-escalation).\n\nStile del feedback: **fermo, empatico, strategico**. Linguaggio operativo, non giudicante.\nOutput preferito: **JSON strutturato**. Sii rigoroso nella valutazione. Se un criterio è sotto 6, deve essere considerato un'area di miglioramento. Punta ad avere la maggioranza dei criteri fra 7 e 9.\n\nFornisci la tua analisi esclusivamente nel formato JSON richiesto.`,
        paraverbalPrompt: (scenario: string, task: string, transcript: string) => `Valuta la seguente traccia vocale (trascritta) e genera un feedback operativo.\n\n**Scenario:** ${scenario}\n**Compito dell'utente:** ${task}\n**Trascrizione della risposta dell'utente:** "${transcript}"\n\nIstruzioni:\n1. Valuta ogni criterio della rubrica da 1 a 10 con una motivazione breve (1-2 frasi). Per il campo 'criterion_id' nel tuo output JSON, DEVI usare ESATTAMENTE uno dei seguenti valori: "pacing_breath", "speed", "volume", "tone_warmth", "intonation", "articulation", "emphasis", "pauses", "disfluencies", "strategy_alignment".\n2. Evidenzia **3 punti di forza** e **3 aree da migliorare**.\n3. Suggerisci **3 azioni pratiche** e **1 micro-drill (≤60s)** immediato.\n4. Fornisci una **"consegna annotata"** del testo originale con simboli: ☐ (pausa), △ (enfasi). Ad esempio: "Capisco ☐ la tua preoccupazione. △ Possiamo lavorare insieme su un primo passo."\n5. Scrivi un **"ideal_script"**: la versione ottimale della risposta dell'utente, scritta in modo naturale e pronta per essere letta da un motore di sintesi vocale.\n\nGenera l'output in formato JSON.`,
        profileSchema: {
            profileTitle: "Un titolo accattivante e descrittivo per il profilo del comunicatore, ad esempio 'Il Diplomatico Pragmatico' o 'L'Analista Empatico'. Deve essere breve e d'impatto.",
            profileDescription: "Una breve descrizione (2-3 frasi) dello stile di comunicazione prevalente dell'utente, basata sulle sue risposte.",
            strengths: "Un elenco di esattamente 2 punti di forza principali emersi dalle analisi.",
            areasToImprove: "Un elenco di esattamente 2 aree di miglioramento prioritarie su cui l'utente dovrebbe concentrarsi."
        },
        profileSystemInstruction: `Sei un esperto di profilazione della comunicazione basato sulla metodologia CES. Il tuo compito è analizzare una serie di analisi di esercizi di check-up e sintetizzarle in un profilo di comunicazione conciso, incoraggiante e strategico. Identifica i pattern ricorrenti, sia positivi che negativi, attraverso le diverse risposte per delineare uno stile di comunicazione complessivo. Fornisci la tua analisi esclusivamente nel formato JSON richiesto, in italiano.`,
        profilePrompt: (results: string) => `Ho completato un check-up di comunicazione. Ecco un riassunto delle analisi delle mie risposte:\n\n${results}\n\nBasandoti su questi dati, genera il mio "Profilo del Comunicatore" in formato JSON.`
    }
  },
  en: {
    // General UI
    home: "Home",
    exercise: "Exercise",
    report: "Report",
    review: "Review",
    strategicCheckup: "Strategic Check-up",
    communicatorProfile: "Communicator Profile",
    unlockPro: "Unlock PRO",
    logout: "Logout",
    completed: "Completed",
    difficultyBase: "Base",
    difficultyIntermediate: "Intermediate",
    difficultyAdvanced: "Advanced",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    
    // Login Screen
    welcomeTo: "Welcome to",
    loginSlogan: "and start your training journey now.",
    emailLabel: "Email",
    passwordLabel: "Password",
    loginButton: "Login",
    noAccount: "Don't have an account? Sign up now",
    guestAccess: "Access as a guest",
    createAccountTitle: "Create Your Account",
    firstNameLabel: "First Name",
    lastNameLabel: "Last Name",
    confirmPasswordLabel: "Confirm Password",
    captchaLabel: "Verification: what is {{num1}} + {{num2}}?",
    agreeToTerms: "I agree to the",
    registerButton: "Sign Up",
    alreadyHaveAccount: "Already have an account? Login",
    invalidCredentials: "Invalid email or password.",
    userExistsError: "A user with this email is already registered.",
    registrationSuccess: "Registration complete! You can now log in.",

    // Home Screen
    homeTitle: "Start Your Training Now with Strategic Effective Communication®",
    homeSubtitle: "Select your next session from the Competence Map or take on the Daily Challenge.",
    checkupPromptTitle: "Assess Your Starting Level",
    checkupPromptText: "Complete the analysis test to discover your communicator profile and receive a personalized training path.",
    startTestButton: "Start Test",
    dailyChallenge: "Daily Challenge",
    competenceMap: "Competence Map",
    fundamentals: "Fundamentals",
    sectoralPacks: "Professional Sector Packs",
    lockedModuleTooltip: "Complete the prerequisite modules to unlock",

    // Module Screen
    proQuestionLibrary: "PRO Question Library",
    proPreparationChecklist: "PRO Preparation Checklist",
    
    // Exercise Screen
    backToModule: "Back to Module",
    readScenario: "Read scenario",
    stopReading: "Stop reading",
    checkupStep: "Step {{current}} of {{total}}",
    scenarioLabel: "Scenario",
    taskLabel: "Task",
    yourObjectiveLabel: "Your Objective",
    responseTitle: "Response",
    responsePlaceholder: "Write your best response here...",
    submitResponse: "Submit Response",
    skipExercise: "Skip Exercise",
    speechNotSupported: "Speech recognition is not supported by this browser.",
    listening: "Listening...",
    transcriptPlaceholder: "Your transcript will appear here.",
    recordingInProgress: "Recording in Progress...",
    clickToDictate: "Click to Dictate",
    submitForAnalysis: "Submit for Analysis",
    stopDictation: "Stop Dictation",
    replyWithVoice: "Reply with Voice",
    responseEmptyError: "Response cannot be empty.",
    unknownError: "An unknown error occurred.",

    // Report Screens
    analysisReportTitle: "Analysis Report",
    voiceReportTitle: "Voice & Paraverbal Report",
    exportToPdf: "Export to PDF",
    strengths: "Strengths",
    areasForImprovement: "Areas for Improvement",
    wasThisHelpful: "Was this helpful?",
    suggestedResponse: "Suggested Response",
    shortVersion: "Short Version",
    longVersion: "Long Version",
    retryExercise: "Retry Exercise",
    nextExercise: "Next Exercise",
    proDetailedEvaluation: "PRO Detailed Evaluation",
    proQuestionMetrics: "PRO Advanced Question Metrics",
    utility: "Question Utility",
    clarity: "Question Clarity",
    practicalActions: "Practical Actions",
    microDrill: "Micro-Drill (60s)",
    listenToIdealVersion: "Listen to Ideal Version",
    stopListening: "Stop Listening",

    // Review Screen
    reviewTitle: "Exercise Review",
    completedOn: "Completed on: {{date}}",
    yourPreviousResponse: "Your Previous Response",

    // Paywall
    productUnlockedSuccess: "{{productName}} unlocked successfully!",
    purchaseError: "Error during purchase.",
    restoreSuccess: "Purchases restored successfully.",
    restoreError: "Error during restoration.",
    
    // Gemini Prompts
    gemini: {
        scoreDescription: "A score from 0 to 100 representing the overall effectiveness of the user's response, based on the provided evaluation criteria.",
        strengthsDescription: "A list of 2-3 points highlighting what the user did well, in relation to the evaluation criteria.",
        areasForImprovementDescription: "A list of 2-3 points on what the user could improve, each with a suggestion and a practical quoted example.",
        improvementSuggestionDescription: "The specific advice on what the user could improve, linked to one of the evaluation criteria.",
        improvementExampleDescription: "A quoted example sentence showing how to apply the suggestion. E.g., \"Instead of saying 'you're wrong,' you could say 'I noticed this approach led to...'\"",
        suggestedResponseShortDescription: "A concise, rewritten version of the user's response (1-2 sentences). Important keywords are highlighted with **double asterisks**.",
        suggestedResponseLongDescription: "A more detailed and complete version of the user's response, embodying the principles of effective communication. Important keywords are highlighted with **double asterisks**.",
        detailedRubricDescription: "PRO detailed evaluation. Fill this field ONLY if required in the prompt instructions.",
        utilityScoreDescription: "A score from 1 to 10 on the utility of the question asked. Fill this field ONLY if required.",
        clarityScoreDescription: "A score from 1 to 10 on the clarity of the question asked. Fill this field ONLY if required.",
        proActiveInstructions: {
            detailedEvaluation: "**PRO Feature ACTIVE: Detailed Evaluation.** You MUST provide a detailed evaluation for each of the 5 key criteria (Clarity, Tone and Empathy, Solution-Orientation, Assertiveness, Structure). For each criterion, provide a score from 1 to 10 and a brief justification. Populate the 'detailedRubric' field in the JSON.",
            questionMetrics: "**PRO Feature ACTIVE: Question Metrics.** The user is asking a question. Evaluate it according to two specific metrics: 'utilityScore' (how useful the question is to achieve the goal) and 'clarityScore' (how clear and unambiguous the question is), both with a score from 1 to 10. Populate the 'utilityScore' and 'clarityScore' fields in the JSON."
        },
        verbalContext: {
            isVerbal: "The user's response was provided verbally. Consider factors such as conciseness and clarity suitable for spoken communication. Ignore any transcription or typing errors.",
            isWritten: "The user's response was written. Analyze it for clarity, tone, and structure as you would a written text."
        },
        systemInstructionWritten: `You are a world-class Strategic Effective Communication (CES) coach. Your role is to analyze user responses to complex communication scenarios and provide detailed, constructive, and personalized feedback. ALWAYS respond in English.\n\nEvaluate each response based on the following key criteria:\n1.  **Clarity and Conciseness**: Is the response direct, easy to understand, and unambiguous?\n2.  **Tone and Empathy**: Is the tone appropriate for the scenario? Does it show understanding and respect for the other person?\n3.  **Solution-Orientation**: Does the response focus on solving the problem or achieving a constructive goal, rather than on blame?\n4.  **Assertiveness**: Does the user express their needs or views clearly and respectfully, without being passive or aggressive?\n5.  **Structure**: Does the communication follow a clear logic (e.g., describing facts, expressing impact, proposing a solution)?\n\nBase your score on a holistic evaluation of these criteria in relation to the specific scenario and task. The score must faithfully reflect the quality of the user's response. A very good response should have a high score, a mediocre one a medium score, and a bad one a low score. Do not always give the same score.\n\nYour analyses must be encouraging and aimed at helping the user to improve concretely. Provide your analysis exclusively in the required JSON format.`,
        userObjectivePrompt: (objective: string) => `\n**User's Personal Objective:** In addition to the main task, the user specifically wanted to achieve this goal: "${objective}". Also evaluate their response based on this, including a comment on this point in your feedback (strengths or areas for improvement).`,
        promptLabels: {
            scenario: "Scenario",
            task: "User's task",
            userResponse: "User's response",
            analysisContext: "Analysis context"
        },
        finalInstruction: "Analyze the user's response according to the directives provided in your system instruction and generate the structured feedback in JSON format.",
        paraverbalSchema: {
            scores: "A list of scores (from 1 to 10) for each of the 10 paraverbal criteria, with a brief justification for each score.",
            strengths: "A list of exactly 3 paraverbal strengths that emerged from the response.",
            improvements: "A list of exactly 3 paraverbal areas for improvement.",
            actions: "A list of exactly 3 practical and concrete actions the user can take to improve.",
            micro_drill_60s: "A specific and immediate micro-exercise, lasting a maximum of 60 seconds, to work on one of the weak points.",
            annotated_text: "The text of the user's response, enriched with symbols to indicate pauses (☐) and emphasis (△).",
            ideal_script: "The ideal version of the user's response, rewritten to be spoken optimally. This text will be used for text-to-speech."
        },
        systemInstructionVerbal: `You are **CES Coach Engine** extended with the **Strategic Voice (Paraverbal)** module. Evaluate and train paraverbal communication to make the message more effective according to the principles of Strategic Effective Communication®. ALWAYS respond in English.\n\nConsider the following **key paraverbal factors for an English speaker**:\n- **Pacing & Breath**: Regularity, meaningful pauses, lack of breathlessness. Appropriate speed for clarity.\n- **Speed (words/minute)**: Natural rhythm; avoid being too fast or too slow. A typical conversational speed in English is 140-160 wpm.\n- **Volume**: Audible and stable; intentional variations for emphasis.\n- **Tone/Timbre & Warmth**: Firm, empathetic, professional; avoid flatness/monotony. Consider cultural norms for politeness.\n- **Intonation & Melody**: Pitch variation to maintain attention, especially downward inflection for statements and upward for questions.\n- **Articulation & Diction**: Clarity of consonants, especially at the end of words. Avoid mumbling.\n- **Strategic Emphasis**: Stressing key words to convey meaning and importance.\n- **Strategic Pauses**: Before/after key concepts to let them sink in; avoid awkward silences.\n- **Disfluencies & Fillers**: Management of "um," "uh," "like," self-corrections. A few are natural, too many are distracting.\n- **Alignment with strategic intent**: Vocal coherence with the goal (empathy, firmness, negotiation, de-escalation).\n\nFeedback style: **firm, empathetic, strategic**. Use operational, non-judgmental language.\nPreferred output: **Structured JSON**. Be rigorous in your assessment. If a criterion is below 6, it must be considered an area for improvement. Aim for the majority of criteria to be between 7 and 9.\n\nProvide your analysis exclusively in the required JSON format.`,
        paraverbalPrompt: (scenario: string, task: string, transcript: string) => `Evaluate the following voice track (transcribed) and generate operational feedback.\n\n**Scenario:** ${scenario}\n**User's Task:** ${task}\n**Transcript of user's response:** "${transcript}"\n\nInstructions:\n1. Evaluate each criterion of the rubric from 1 to 10 with a brief justification (1-2 sentences). For the 'criterion_id' field in your JSON output, you MUST use EXACTLY one of the following values: "pacing_breath", "speed", "volume", "tone_warmth", "intonation", "articulation", "emphasis", "pauses", "disfluencies", "strategy_alignment".\n2. Highlight **3 strengths** and **3 areas to improve**.\n3. Suggest **3 practical actions** and **1 immediate micro-drill (≤60s)**.\n4. Provide an **"annotated delivery"** of the original text with symbols: ☐ (pause), △ (emphasis). For example: "I understand ☐ your concern. △ We can work together on a first step."\n5. Write an **"ideal_script"**: the optimal version of the user's response, written naturally and ready to be read by a text-to-speech engine.\n\nGenerate the output in JSON format.`,
        profileSchema: {
            profileTitle: "A catchy and descriptive title for the communicator's profile, e.g., 'The Pragmatic Diplomat' or 'The Empathetic Analyst'. It should be short and impactful.",
            profileDescription: "A brief description (2-3 sentences) of the user's prevalent communication style, based on their responses.",
            strengths: "A list of exactly 2 main strengths that emerged from the analyses.",
            areasToImprove: "A list of exactly 2 priority areas for improvement for the user to focus on."
        },
        profileSystemInstruction: `You are an expert in communication profiling based on the CES methodology. Your task is to analyze a series of check-up exercise analyses and synthesize them into a concise, encouraging, and strategic communication profile. Identify recurring patterns, both positive and negative, across the different responses to outline an overall communication style. Provide your analysis exclusively in the required JSON format, in English.`,
        profilePrompt: (results: string) => `I have completed a communication check-up. Here is a summary of the analyses of my responses:\n\n${results}\n\nBased on this data, generate my "Communicator Profile" in JSON format.`
    }
  }
};
