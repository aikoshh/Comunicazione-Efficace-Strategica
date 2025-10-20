// assets.ts

// Funzione helper per ottimizzare le immagini tramite un servizio CDN.
// Questo le converte in formato WebP e le comprime, migliorando la velocità di caricamento.
const optimize = (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=webp&q=80`;

// Immagini delle card, ora ottimizzate
export const cardImage1 = optimize('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=600&h=360&auto=format&fit=crop');
export const cardImage2 = optimize('https://wp-content.lamenteemeravigliosa.it/2018/02/coppia-che-litiga.jpg?auto=webp&quality=7500&width=1920&crop=16:9,smart,safe&format=webp&optimize=medium&dpr=2&fit=cover&fm=webp&q=75&w=1920&h=1080');
export const cardImage3 = optimize('https://www.giorgiofranzosipsicologo.com/uploads/6/2/8/5/62850069/published/domande.jpg?1526131194');
export const cardImage4 = optimize('https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=600&h=360&auto=format&fit=crop');
export const cardImage5 = optimize('https://www.centroclinicaformazionestrategica.it/wp-content/uploads/2014/09/comunicazione-efficace-strategica-roma-centro-cfs.jpg');
export const cardImage6 = optimize('https://www.marinaosnaghi.com/wp-content/uploads/2020/03/Parlare-in-pubblico-1170x600.jpg');

// Nuovi loghi e icone
export const mainLogoUrl = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/CES-COACH-LOGO.png');
export const siteIconUrl = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/CES-COACH-LOGO-PICCOLO.png');

// Altre immagini, ora ottimizzate
export const smilingPerson = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/ivano-cincinnato.png');
export const loginBackground = optimize('https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?q=80&w=1200&auto=format&fit=crop');
export const dailyChallengePerson = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/sfida-del-giorno.PNG');
export const checkupImage = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/dialogo%20strategico.png');

// Nuove immagini per moduli e sezioni PRO
export const replayStrategicoImg = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/replay-strategico.png');
export const feedbackParaverbaleImg = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/feedback-paraverbale.png');
export const allenamentoPersonalizzatoImg = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/allenamento-personalizzato.png');
export const ascoltoStrategicoHeaderImg = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/ascolto-strategico.png');
export const domandeStrategicheHeaderImg = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/domande-strategiche.PNG');
export const gestireConversazioniDifficiliHeaderImg = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/gestire-conversazioni-difficili.PNG');
export const librerieStrategicheImg = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/librerie-strategiche.PNG');
export const riepilogoVantaggiProImg = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/riepilogo-vantaggi-pro.PNG');
export const risultatiProImg = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/risultati-pro.png');
export const voceStrategicaHeaderImg = optimize('https://www.centroclinicaformazionestrategica.it/CES-APP/images/voce-strategica.PNG');