import React from 'react';
import { COLORS } from '../constants';

export const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path d="M40 23C40 32.389 32.389 40 23 40C21.432 40 19.936 39.738 18.554 39.262L10 42L12.738 34.446C8.262 30.936 6 26.432 6 23C6 13.611 13.611 6 23 6C32.389 6 40 13.611 40 23Z" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 29C25.2091 29 27 27.2091 27 25C27 22.7909 25.2091 21 23 21C20.7909 21 19 22.7909 19 25C19 27.2091 20.7909 29 23 29Z" stroke={COLORS.secondary} strokeWidth="2"/>
        <path d="M23 18V21" stroke={COLORS.secondary} strokeWidth="2"/>
        <path d="M23 29V32" stroke={COLORS.secondary} strokeWidth="2"/>
        <path d="M19.93 21.93L18.5 20.5" stroke={COLORS.secondary} strokeWidth="2"/>
        <path d="M27.5 30.5L26.07 29.07" stroke={COLORS.secondary} strokeWidth="2"/>
        <path d="M19.93 28.07L18.5 29.5" stroke={COLORS.secondary} strokeWidth="2"/>
        <path d="M27.5 19.5L26.07 20.93" stroke={COLORS.secondary} strokeWidth="2"/>
        <path d="M19 25H16" stroke={COLORS.secondary} strokeWidth="2"/>
        <path d="M30 25H27" stroke={COLORS.secondary} strokeWidth="2"/>
    </svg>
);
