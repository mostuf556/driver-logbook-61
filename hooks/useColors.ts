import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type Colors } from '@/constants/colors';

export function useColors(): Colors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}
