export const COLORS = {
  primary: '#4361EE',       // Vibrant Royal Blue
  primaryLight: '#4CC9F0',  // Vibrant Cyan
  primaryDark: '#3A0CA3',   // Deep Purple
  accent: '#F72585',        // Bright Pink Accent
  important: '#E63946',     // Premium Bold Red
  importantBg: '#FFF0F3',
  background: '#F8F9FA',    // Clean minimal background
  surface: '#FFFFFF',
  border: '#E9ECEF',
  textPrimary: '#2B2D42',   // Sharp Navy
  textSecondary: '#6C757D',
  textMuted: '#ADB5BD',
  success: '#2A9D8F',
  successBg: '#E8F5E9',
  white: '#FFFFFF',
  shadow: '#4361EE30',      // Colored aesthetic shadow
};

export const FONTS = {
  headline: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  body: { fontSize: 14, fontWeight: '400', color: COLORS.textSecondary, lineHeight: 21 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  small: { fontSize: 11, color: COLORS.textMuted },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.white },
};

export const SHADOW = {
  shadowColor: COLORS.primary,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};
