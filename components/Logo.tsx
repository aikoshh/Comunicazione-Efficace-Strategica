import React from 'react';
import { siteIconUrl } from '../assets';

// Il componente Logo ora renderizza la nuova icona del sito.
// Accetta attributi standard di un'immagine per flessibilità (es. 'style').
export const Logo: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => (
    <img src={siteIconUrl} alt="CES Coach Icon" {...props} />
);
