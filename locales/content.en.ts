import { Module, DifficultyLevel, ExerciseType, Exercise, StrategicQuestionCategory, ChecklistItem } from '../types';
import { 
    FeedbackIcon, ConflictIcon, QuestionIcon, CustomIcon, ListeningIcon,
    HealthcareIcon, EducationIcon, CustomerCareIcon, SalesIcon, LeadershipIcon, VoiceIcon
} from '../components/Icons';
import { cardImage1, cardImage2, cardImage3, cardImage4, cardImage5, cardImage6 } from '../assets';

export const VOICE_RUBRIC_CRITERIA_EN = [
    { id: "pacing_breath", label: "Pacing & Breathing" },
    { id: "speed", label: "Speed (words/minute)" },
    { id: "volume", label: "Volume" },
    { id: "tone_warmth", label: "Tone & Warmth" },
    { id: "intonation", label: "Intonation & Melody" },
    { id: "articulation", label: "Articulation & Diction" },
    { id: "emphasis", label: "Strategic Emphasis" },
    { id: "pauses", label: "Strategic Pauses" },
    { id: "disfluencies", label: "Disfluencies & Fillers" },
    { id: "strategy_alignment", label: "Alignment with SEC Goal" },
];

export const STRATEGIC_CHECKUP_EXERCISES_EN: Exercise[] = [
    {
      id: 'checkup-1',
      title: 'Check-up 1/3: Giving Feedback',
      scenario: 'You need to give feedback to a colleague, Alex, who submitted incomplete work with several errors. This is the first time it has happened, but the project is critical.',
      task: 'Write or record the feedback you would give to Alex to address the situation constructively.',
      difficulty: DifficultyLevel.INTERMEDIO,
      exerciseType: ExerciseType.WRITTEN,
    },
    {
      id: 'checkup-2',
      title: 'Check-up 2/3: Managing a Conflict',
      scenario: 'During a meeting, another team leader publicly questions your team\'s approach, using a tone you perceive as accusatory.',
      task: 'Write or record your immediate response to handle the situation professionally without escalating it.',
      difficulty: DifficultyLevel.INTERMEDIO,
      exerciseType: ExerciseType.WRITTEN,
    },
    {
      id: 'checkup-3',
      title: 'Check-up 3/3: Listening and Questioning',
      scenario: 'A client tells you: "I\'m not satisfied with the service. It\'s just not working as I expected."',
      task: 'Write or record the first question you would ask to deeply understand the client\'s problem, demonstrating active listening.',
      difficulty: DifficultyLevel.BASE,
      exerciseType: ExerciseType.WRITTEN,
    },
];

export const MODULES_EN: Module[] = [
  // Fundamentals
  {
    id: 'm4',
    title: 'Strategic Active Listening',
    description: 'Hone your ability to listen not just to hear, but to deeply understand by identifying the keywords that reveal true intentions.',
    icon: ListeningIcon,
    cardImage: cardImage5,
    category: 'Fondamentali',
    exercises: [
      {
        id: 'e10',
        title: 'Identifying Keywords in a Simple Request',
        scenario: 'A colleague tells you: "I\'m a bit worried about tomorrow\'s presentation. I\'m not sure the data section is clear enough, and I\'m afraid the client might ask tough questions."',
        task: 'Listen to or read the sentence and identify the 3-4 keywords or short phrases that express your colleague\'s emotion, main problem, and fear.',
        difficulty: DifficultyLevel.BASE,
      },
      {
        id: 'e11',
        title: 'Deciphering Vague Feedback',
        scenario: 'During a review, your manager comments: "Your last report was good, but I feel like something is missing. Maybe we could give it more... impact. Work on it a bit and show me."',
        task: 'Identify the keywords that, despite their vagueness, indicate the manager\'s area of dissatisfaction and the type of action required.',
        difficulty: DifficultyLevel.INTERMEDIO,
      },
      {
        id: 'e12',
        title: 'Catching Weak Signals in a Negotiation',
        scenario: 'You are negotiating a contract with a client who states: "Your offer is interesting, but honestly, our budget is quite tight. We need to be sure this investment leads to tangible and quick results, otherwise management won\'t approve."',
        task: 'Identify the keywords and phrases that reveal the client\'s true decision criteria beyond price. What are their priorities and internal pressures?',
        difficulty: DifficultyLevel.AVANZATO,
      },
    ],
  },
  {
    id: 'm1',
    title: 'Giving Effective Feedback',
    description: 'Learn to provide constructive feedback that motivates change without demotivating.',
    icon: FeedbackIcon,
    cardImage: cardImage1,
    category: 'Fondamentali',
    exercises: [
      {
        id: 'e1',
        title: 'Feedback to an Underperforming Collaborator',
        scenario: 'You need to give feedback to Mark, a team member, who has recently missed several deadlines and whose work quality has been below par. You want to address the issue constructively without demotivating him.',
        task: 'Prepare and deliver feedback to Mark, focusing on facts, the impact of his behavior, and future steps for improvement.',
        difficulty: DifficultyLevel.BASE,
      },
      {
        id: 'e2',
        title: 'Feedback to a Manager',
        scenario: 'Your manager, Luke, tends to micromanage your work, checking every small detail and causing delays. This is undermining your autonomy and confidence. You want to give him feedback to improve your collaboration.',
        task: 'Respectfully present the situation to Luke, explaining the impact of his behavior on your work and suggesting a different approach.',
        difficulty: DifficultyLevel.INTERMEDIO,
      },
      {
        id: 'e7',
        title: 'Feedback to a Senior Stakeholder',
        scenario: 'You need to communicate critical feedback to a director of another department about a delay on their part that is blocking a strategic project. The conversation is delicate due to hierarchy and potential political implications.',
        task: 'Communicate the feedback diplomatically but clearly, focusing on the objective impact on the project and proposing collaborative solutions to unblock the situation.',
        difficulty: DifficultyLevel.AVANZATO,
      }
    ],
  },
  {
    id: 'm3',
    title: 'Mastering the Art of Questions',
    description: 'Discover how to use questions to guide conversations, stimulate critical thinking, and uncover crucial information.',
    icon: QuestionIcon,
    cardImage: cardImage3,
    category: 'Fondamentali',
    exercises: [
       {
        id: 'e5',
        title: 'Understanding a Client\'s Needs',
        scenario: 'You are in an initial meeting with a potential client who is struggling to clearly express their needs. Their requests are vague and contradictory.',
        task: 'Use a series of open-ended and probing questions to help the client better define their goals and requirements.',
        difficulty: DifficultyLevel.BASE,
      },
      {
        id: 'e9',
        title: 'Exploring a Drop in Motivation',
        scenario: 'You\'ve noticed that a usually proactive team member has become quiet and unengaged. You want to understand what is happening without being intrusive.',
        task: 'Start a 1-to-1 conversation. Use open-ended questions and active listening to explore the possible causes of their change in attitude and offer support.',
        difficulty: DifficultyLevel.INTERMEDIO,
      },
      {
        id: 'e6',
        title: 'Coaching Session with a Team Member',
        scenario: 'You are mentoring a younger colleague, Sarah, who feels stuck in her professional growth. Instead of giving her direct solutions, you want to help her find her own answers.',
        task: 'Conduct a coaching conversation with Sarah using powerful questions to help her reflect on her situation, identify obstacles, and create an action plan.',
        difficulty: DifficultyLevel.AVANZATO,
      },
      {
        id: 'e16',
        title: 'Uncovering Unspoken Needs',
        scenario: 'You are talking to a potential client who seems interested in your solution but keeps saying, "Yes, interesting, but we need to think about it." You want to better understand their real concerns without being too direct.',
        task: 'Record a question you could ask to delve into their reservations, using an empathetic and curious tone.',
        difficulty: DifficultyLevel.AVANZATO,
        exerciseType: ExerciseType.VERBAL,
      },
    ],
  },
  {
    id: 'm2',
    title: 'Handling Difficult Conversations',
    description: 'Develop the skills to navigate complex and conflicting conversations with calm and professionalism.',
    icon: ConflictIcon,
    cardImage: cardImage2,
    category: 'Fondamentali',
    exercises: [
      {
        id: 'e8',
        title: 'Asking a Colleague to Lower Their Voice',
        scenario: 'A colleague in your open-plan office often speaks very loudly on the phone, disturbing your concentration. They don\'t seem to notice, and it\'s starting to annoy others as well.',
        task: 'Approach the colleague kindly and privately and ask if they can lower their voice, without making them feel attacked or embarrassed.',
        difficulty: DifficultyLevel.BASE,
      },
      {
        id: 'e3',
        title: 'Disagreement with a Colleague on a Project',
        scenario: 'You and your colleague, Giulia, have completely different views on how to proceed with an important project. Tension is rising, and you need to find a solution to avoid blocking the team\'s work.',
        task: 'Start a conversation with Giulia to discuss your differences. Try to understand her point of view and find a compromise or a shared solution.',
        difficulty: DifficultyLevel.INTERMEDIO,
      },
      {
        id: 'e13',
        title: 'Disagreement with Your Partner',
        scenario: 'Your partner is annoyed because you have been spending a lot of time at work recently. They say, "You\'re never here!" You want to address their frustration without starting an argument.',
        task: 'Start a conversation to acknowledge their feelings, explain your perspective, and find a way to balance things better together.',
        difficulty: DifficultyLevel.INTERMEDIO,
      },
      {
        id: 'e14',
        title: 'Addressing a Child\'s Behavior',
        scenario: 'Your teenage child has broken an important house rule (e.g., curfew). They are angry and defensive. You want to address the incident firmly while keeping a channel of communication open.',
        task: 'Talk to your child to discuss the broken rule, listen to their reasons, and establish consequences in a calm and constructive manner.',
        difficulty: DifficultyLevel.AVANZATO,
      },
      {
        id: 'e15',
        title: 'Comment from a Relative',
        scenario: 'During a family gathering, a relative makes a passive-aggressive comment about a life choice of yours (work, relationships, etc.). The comment hurts you and creates embarrassment.',
        task: 'Respond to the relative assertively but politely, setting a clear boundary without ruining the atmosphere of the gathering.',
        difficulty: DifficultyLevel.INTERMEDIO,
      },
      {
        id: 'e4',
        title: 'Communicating an Unpopular Decision to the Team',
        scenario: 'As a team leader, you must inform your team that due to a budget cut, a project they were very passionate about has been canceled. There is a risk of strong discontent.',
        task: 'Communicate the news to the team clearly, empathetically, and transparently, managing their reactions and answering their questions.',
        difficulty: DifficultyLevel.AVANZATO,
      },
    ],
  },
  {
    id: 'm5',
    title: 'Strategic Voice (Paraverbal)',
    description: 'Train your rhythm, tone, and pauses to make your message more impactful and persuasive.',
    icon: VoiceIcon,
    cardImage: cardImage6,
    category: 'Fondamentali',
    exercises: [
      {
        id: 'v1',
        title: 'Presenting a Proposal Calmly',
        scenario: 'You need to present an important proposal to a client known for being very demanding and often interrupting. The goal is to maintain a calm and authoritative tone, without being overwhelmed by the pressure.',
        task: 'Record a 30-45 second audio clip presenting the two key points of your proposal, as if you were in front of the client.',
        difficulty: DifficultyLevel.BASE,
        exerciseType: ExerciseType.VERBAL,
      },
      {
        id: 'v2',
        title: 'Handling an Interruption Firmly',
        scenario: 'During an important meeting, a colleague repeatedly interrupts you while you are presenting your data. You need to reclaim the floor and maintain control of the conversation without appearing aggressive, using a firm but collaborative tone of voice.',
        task: 'Record the sentence you would use to stop the interruption and bring the focus back to your point. Concentrate on a calm pace and a steady volume to project confidence.',
        difficulty: DifficultyLevel.INTERMEDIO,
        exerciseType: ExerciseType.VERBAL,
      },
      {
        id: 'v3',
        title: 'Communicating a Complex Vision',
        scenario: 'You are a team leader and need to present a new company strategy that will involve significant changes and possible uncertainties. Your goal is to inspire trust and motivate the team, despite the difficulties.',
        task: 'Record a 45-60 second speech introducing the new vision. Use variations in intonation, strategic pauses before key concepts, and emphasis on words that convey optimism and determination.',
        difficulty: DifficultyLevel.AVANZATO,
        exerciseType: ExerciseType.VERBAL,
      }
    ],
  },
  {
    id: 'custom',
    title: 'Personalized Training',
    description: 'Create your own custom training scenario to tackle the communication challenges that matter most to you.',
    icon: CustomIcon,
    cardImage: cardImage4,
    exercises: [],
    isCustom: true,
    category: 'Fondamentali',
  },
  // Sectoral Packs
  {
    id: 's1',
    title: 'Healthcare',
    description: 'Communicate with empathy and clarity with patients and colleagues in complex healthcare settings.',
    icon: HealthcareIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m4', 'm2'],
    exercises: [
        {
            id: 's1e1',
            title: 'Delivering a Difficult Diagnosis',
            scenario: 'You are a doctor and must deliver a diagnosis of a chronic illness to a patient and their family. The atmosphere is tense and filled with anxiety.',
            task: 'Communicate the diagnosis clearly, empathetically, and supportively, answering questions and managing the family\'s emotional reactions.',
            difficulty: DifficultyLevel.AVANZATO,
        }
    ],
  },
  {
    id: 's2',
    title: 'Education',
    description: 'Manage communication with students, parents, and colleagues for a more effective educational environment.',
    icon: EducationIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m1', 'm2'],
    exercises: [
        {
            id: 's2e1',
            title: 'Meeting with a Worried Parent',
            scenario: 'You are a teacher and need to meet with the parents of a student who is having behavioral issues in class. The parents are on the defensive.',
            task: 'Lead the conversation collaboratively, presenting facts objectively and working with the parents to create a support plan for the student.',
            difficulty: DifficultyLevel.INTERMEDIO,
        }
    ],
  },
  {
    id: 's3',
    title: 'Customer Care',
    description: 'Turn dissatisfied customers into brand advocates through masterful communication.',
    icon: CustomerCareIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m4', 'm2'],
    exercises: [
        {
            id: 's3e1',
            title: 'De-escalating an Angry Customer',
            scenario: 'A customer calls you, extremely angry because their product did not arrive in time for an important event. They threaten to leave a negative review everywhere.',
            task: 'Actively listen to their frustration, show empathy, de-escalate the situation, and propose a solution that makes them feel heard and valued.',
            difficulty: DifficultyLevel.INTERMEDIO,
        }
    ],
  },
  {
    id: 's7',
    title: 'Consultative Selling',
    description: 'Move from selling products to creating strategic partnerships through listening and questioning.',
    icon: SalesIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m4', 'm3'],
    exercises: [
        {
            id: 's7e1',
            title: 'Overcoming a Price Objection',
            scenario: 'A potential client is convinced of the value of your solution but says, "It\'s fantastic, but it costs twice as much as your main competitor."',
            task: 'Instead of justifying the price, use strategic questions to shift the conversation from cost to value and return on investment, differentiating yourself from the competition.',
            difficulty: DifficultyLevel.AVANZATO,
        }
    ],
  },
  {
    id: 's8',
    title: 'Leadership',
    description: 'Inspire your team, manage change, and communicate the vision with the impact of a true leader.',
    icon: LeadershipIcon,
    category: 'Pacchetti Settoriali',
    prerequisites: ['m1', 'm2', 'm5'],
    exercises: [
        {
            id: 's8e1',
            title: 'Motivating the Team After a Failure',
            scenario: 'Your team\'s key project has failed, missing a major company goal. Morale is at an all-time low, and there is fear of the consequences.',
            task: 'Hold a meeting with the team. Deliver a message that acknowledges the failure without assigning blame, inspires resilience, and refocuses the team on lessons learned and the next steps.',
            difficulty: DifficultyLevel.AVANZATO,
        }
    ],
  },
];


export const QUESTION_LIBRARY_EN: StrategicQuestionCategory[] = [
  {
    category: 'Exploratory Open-Ended Questions',
    description: 'Use these to open up the conversation, gather broad information, and encourage the other person to talk.',
    questions: [
      { question: 'What leads you to say that?', description: 'Invites elaboration on a statement without challenging it.' },
      { question: 'What is your perspective on this situation?', description: 'Shows respect for the other person\'s viewpoint and opens dialogue.' },
      { question: 'Can you tell me more about how you reached that conclusion?', description: 'Encourages sharing the thought process, useful for understanding deep motivations.' },
      { question: 'How do you envision the ideal solution?', description: 'Shifts the focus from the problem to the solution, fostering a constructive view.' },
      { question: 'What were the most important factors in your decision?', description: 'Helps identify the interlocutor\'s priorities and values.' },
    ],
  },
  {
    category: 'Drill-Down Questions',
    description: 'Ideal for digging deeper into a specific point, clarifying ambiguities, and getting crucial details.',
    questions: [
      { question: 'When you say "it\'s not working," what do you mean exactly?', description: 'Turns a vague statement into a specific, tangible problem.' },
      { question: 'What is the specific impact of this problem on your work?', description: 'Quantifies the consequences and helps understand the urgency.' },
      { question: 'Can you give me a concrete example?', description: 'Asks for practical evidence to avoid misunderstandings and generalizations.' },
      { question: 'What have you already tried to do to solve this?', description: 'Avoids suggesting solutions already attempted and shows respect for their efforts.' },
      { question: 'Of all these points, which one worries you the most right now?', description: 'Helps prioritize and address the most pressing issue.' },
    ],
  },
  {
    category: 'Hypothetical and Future-Oriented Questions',
    description: 'Perfect for breaking impasses, exploring possibilities, and shifting the focus towards the future.',
    questions: [
      { question: 'If budget were not an issue, what would be your first step?', description: 'Removes mental constraints to reveal the true priority.' },
      { question: 'Let\'s imagine it\'s six months from now and we\'ve solved this problem. What do you see?', description: 'Encourages a positive vision and helps define the final goal.' },
      { question: 'What would need to happen for you to feel more confident about this decision?', description: 'Reveals the necessary conditions to get buy-in.' },
      { question: 'If you could change just one thing about this project, what would it be?', description: 'Focuses attention on the highest-impact element.' },
      { question: 'What is the worst risk if we do nothing?', description: 'Highlights the cost of inaction and creates a sense of urgency.' },
    ],
  },
  {
    category: 'Reflective and Coaching Questions',
    description: 'Stimulate self-awareness and help the other person find their own solutions, rather than imposing them.',
    questions: [
      { question: 'What have you learned from this experience?', description: 'Promotes learning and personal growth.' },
      { question: 'Which of your skills could help you overcome this obstacle?', description: 'Focuses on internal resources and increases confidence.' },
      { question: 'What is within your control in this situation?', description: 'Brings the focus back to action and reduces feelings of helplessness.' },
      { question: 'What support would you need to succeed?', description: 'Opens the door to collaboration and targeted support.' },
      { question: 'What is the first, small step you can take today?', description: 'Turns a large problem into a manageable and immediate action.' },
    ],
  },
];


export const PREPARATION_CHECKLIST_EN: ChecklistItem[] = [
    { id: 'c1', text: 'What is the SINGLE most important objective of this conversation?' },
    { id: 'c2', text: 'What is my counterpart\'s likely state of mind? How can I tune into it?' },
    { id: 'c3', text: 'What are the 3 key points I absolutely want to communicate?' },
    { id: 'c4', text: 'What might be the main objection or resistance? How can I anticipate it?' },
    { id: 'c5', text: 'How do I want the other person to feel AT THE END of the conversation?' },
    { id: 'c6', text: 'What is the first sentence I will say to set a constructive tone?' },
    { id: 'c7', text: 'Have I prepared at least one open-ended question to demonstrate I am listening?' },
    { id: 'c8', text: 'What is my "plan B" if the conversation doesn\'t go as expected?' },
    { id: 'c9', text: 'Have I clearly defined what the next steps will be after the conversation?' },
    { id: 'c10', text: 'Have I checked my own emotional state? Am I calm, centered, and ready?' },
];