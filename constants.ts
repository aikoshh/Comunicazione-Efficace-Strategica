import { ExerciseType, IconComponent } from './types';
import { 
    WrittenIcon, VerbalIcon
} from './components/Icons';

export const COLORS = {
  // Base
  base: '#F5F2EF', // Light Beige background
  card: '#FFFFFF',
  cardDark: '#F5F2EF', // Slightly darker warm off-white
  textPrimary: '#1C1C1E', // Almost black
  textSecondary: '#6D6D72', // Dark gray
  divider: '#EAE6E2', // Warm gray for borders
  accentBeige: '#D8C3A5', // Deep pastel beige for accents
  textAccent: '#796A53', // Dark beige for text on light backgrounds
  
  // Accents
  primary: '#0E3A5D', // strategic blue
  secondary: '#58A6A6', // sage green
  
  // States
  success: '#28a745', // A more vibrant green
  warning: '#ffc107', // Amber
  error: '#dc3545', // A more vibrant red

  // Gradients
  primaryGradient: 'linear-gradient(135deg, #0E3A5D 0%, #58A6A6 100%)',
};

// A dynamic palette of sage green shades, from lighter to darker, ensuring accessibility.
export const SAGE_PALETTE = [
  '#387676', // Contrast: 4.54:1
  '#346d6d',
  '#306565',
  '#2c5c5c',
  '#285353', // Contrast: 7.75:1
  '#244b4b',
  '#204242',
  '#1c3939',
  '#183131',
  '#142828', // Contrast: 12.8:1
];

export const EXERCISE_TYPE_ICONS: Record<ExerciseType, IconComponent> = {
  [ExerciseType.WRITTEN]: WrittenIcon,
  [ExerciseType.VERBAL]: VerbalIcon,
};