// assets.ts

// Funzione helper per ottimizzare le immagini tramite un servizio CDN.
// Questo le converte in formato WebP e le comprime, migliorando la velocità di caricamento.
const optimize = (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=webp&q=80`;

// === IMMAGINI CARD MODULI ===
export const cardImage1 = optimize('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=600&h=360&auto=format&fit=crop');
export const cardImage2 = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/gestire-conversazioni-difficili_2.MP4';
export const cardImage3 = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/domande-strategiche_2.MP4';
export const cardImage4 = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/allenamento-personalizzato_2.MP4';
export const cardImage5 = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/ascolto-strategico_2.MP4';
export const cardImage6 = optimize('https://www.marinaosnaghi.com/wp-content/uploads/2020/03/Parlare-in-pubblico-1170x600.jpg');
export const chatTrainerCardImage = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/chat-strategica.png');


// === LOGHI E ICONE ===
export const mainLogoUrl = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/CES-COACH-LOGO-trasparente.PNG');
export const siteIconUrl = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/CES-COACH-LOGO-PICCOLO.png');

// === IMMAGINI GENERICHE E MEDIA ===
export const homeScreenHeaderVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/presentazione-iniziale.MP4';
export const ivanoCincinnatoImage = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/ivano-cincinnato.png');
export const loginBackground = optimize('https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?q=80&w=1200&auto=format&fit=crop');
export const dailyChallengeMedia = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/sfida-del-giorno.MP4';
export const dailyChallengeHeaderImage = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/sfida-del-giorno.png');
export const checkupMedia = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/valuta-livello-iniziale.MP4';
export const checkupHeaderImage = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/dialogo%20strategico.png');
export const riformulazioneSinteticaHeaderImg = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/Riformulazione%20sintetica.png');
export const customExerciseHeaderImage = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/allenamento-personalizzato.png');

// === VIDEO INTESTAZIONI MODULI ===
export const gestireConversazioniDifficiliHeaderVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/gestire-conversazioni-difficili.MP4';
export const dareFeedbackEfficaceHeaderVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/dare-feedback-efficace.mp4';
export const domandeStrategicheHeaderVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/domande-strategiche.MP4';
export const ascoltoStrategicoHeaderVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/ascolto-strategico.MP4';
export const allenamentoPersonalizzatoVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/allenamento-personalizzato_2.MP4';
export const voceStrategicaHeaderVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/voce-strategica.MP4';
export const chatTrainerHeaderVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/chat-strategica.MP4';

// === RISORSE PRO (IMMAGINI E VIDEO) ===
export const risultatiProVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/risultati-pro.MP4';
export const vantaggioRisultatiProVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/vantaggio-risultati-pro.MP4';
export const feedbackParaverbaleVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/feedback%20paraverbale.MP4';
export const librerieStrategicheVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/librerie-strategiche.MP4';


// === ARRAY PER PRE-CARICAMENTO ===
export const ALL_RESOURCES_TO_PRELOAD = [
  // Immagini
  cardImage1, cardImage6, chatTrainerCardImage,
  mainLogoUrl, siteIconUrl, loginBackground, 
  riformulazioneSinteticaHeaderImg,
  dailyChallengeHeaderImage,
  checkupHeaderImage,
  ivanoCincinnatoImage,
  customExerciseHeaderImage,
  // Video
  cardImage2, cardImage3, cardImage4, cardImage5,
  homeScreenHeaderVideo,
  dailyChallengeMedia,
  checkupMedia,
  gestireConversazioniDifficiliHeaderVideo, dareFeedbackEfficaceHeaderVideo, domandeStrategicheHeaderVideo,
  ascoltoStrategicoHeaderVideo, allenamentoPersonalizzatoVideo, risultatiProVideo, vantaggioRisultatiProVideo,
  voceStrategicaHeaderVideo, librerieStrategicheVideo, feedbackParaverbaleVideo, chatTrainerHeaderVideo
];