import React from 'react';

// assets.ts

// Funzione helper per ottimizzare le immagini tramite un servizio CDN.
// Questo le converte in formato WebP e le comprime, migliorando la velocità di caricamento.
const optimize = (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=webp&q=80`;

// === IMMAGINI CARD MODULI ===
export const cardImage1 = optimize('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=600&h=360&auto=format&fit=crop');
export const cardImage2 = optimize('https://wp-content.lamenteemeravigliosa.it/2018/02/coppia-che-litiga.jpg?auto=webp&quality=7500&width=1920&crop=16:9,smart,safe&format=webp&optimize=medium&dpr=2&fit=cover&fm=webp&q=75&w=1920&h=1080');
export const cardImage3 = optimize('https://www.giorgiofranzosipsicologo.com/uploads/6/2/8/5/62850069/published/domande.jpg?1526131194');
export const cardImage4 = optimize('https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=600&h=360&auto=format&fit=crop');
export const cardImage5 = optimize('https://www.centroclinicaformazionestrategica.it/wp-content/uploads/2014/09/comunicazione-efficace-strategica-roma-centro-cfs.jpg');
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

// === VIDEO INTESTAZIONI MODULI ===
export const gestireConversazioniDifficiliHeaderVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/gestire-conversazioni-difficili.MP4';
export const dareFeedbackEfficaceHeaderVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/dare-feedback-efficace.mp4';
export const domandeStrategicheHeaderVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/domande-strategiche.MP4';
export const ascoltoStrategicoHeaderVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/ascolto-strategico.MP4';
export const allenamentoPersonalizzatoVideo = 'https://www.centroclinicaformazionestrategica.it/CES-APP/images/allenamento-personalizzato.MP4';
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
  cardImage1, cardImage2, cardImage3, cardImage4, cardImage5, cardImage6, chatTrainerCardImage,
  mainLogoUrl, siteIconUrl, loginBackground, 
  riformulazioneSinteticaHeaderImg,
  dailyChallengeHeaderImage,
  checkupHeaderImage,
  ivanoCincinnatoImage,
  // Video
  homeScreenHeaderVideo,
  dailyChallengeMedia,
  checkupMedia,
  gestireConversazioniDifficiliHeaderVideo, dareFeedbackEfficaceHeaderVideo, domandeStrategicheHeaderVideo,
  ascoltoStrategicoHeaderVideo, allenamentoPersonalizzatoVideo, risultatiProVideo, vantaggioRisultatiProVideo,
  voceStrategicaHeaderVideo, librerieStrategicheVideo, feedbackParaverbaleVideo, chatTrainerHeaderVideo
];