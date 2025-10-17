/**
 * iOS-Inspired Design System
 * Centralized design tokens for consistent styling across the application
 */

// ==================== COLORS ====================

export const COLORS = {
  // Surfaces
  surface: {
    base: 'bg-surface-base',
    elevated: 'bg-surface-elevated hover:bg-surface-elevated-hover',
    card: 'bg-surface-card hover:bg-surface-card-hover',
  },
  
  // Text
  text: {
    primary: 'text-white',
    secondary: 'text-neutral-400',
    tertiary: 'text-neutral-500',
    disabled: 'text-neutral-600',
  },
  
  // Accent - Monochrome
  accent: {
    primary: 'bg-white text-black',
    secondary: 'bg-white/10 text-white',
    hover: 'hover:bg-neutral-100',
  },
  
  // Status - Monochrome subtle indicators
  status: {
    success: 'text-white',
    warning: 'text-neutral-400',
    error: 'text-neutral-500',
    info: 'text-neutral-300',
    
    // Backgrounds
    successBg: 'bg-white/10 text-white',
    warningBg: 'bg-white/5 text-neutral-400',
    errorBg: 'bg-white/5 text-neutral-500',
    infoBg: 'bg-white/5 text-neutral-300',
  },
  
  // Borders
  border: {
    subtle: 'border-border-subtle',
    default: 'border-border',
    strong: 'border-border-strong',
  },
} as const;

// ==================== TYPOGRAPHY ====================

export const TYPOGRAPHY = {
  // Display (large headlines)
  display: 'text-display font-semibold tracking-tight',
  
  // Titles
  title1: 'text-title-1 font-semibold tracking-tight',
  title2: 'text-title-2 font-semibold tracking-tight',
  title3: 'text-title-3 font-medium',
  
  // Headlines
  headline: 'text-headline font-semibold',
  
  // Body
  body: 'text-body font-normal',
  bodySm: 'text-body-sm font-normal',
  
  // Captions
  caption1: 'text-caption-1 font-normal',
  caption2: 'text-caption-2 font-normal',
  
  // Mono (for data, numbers, code)
  mono: 'font-mono',
  monoSm: 'font-mono text-caption-1',
} as const;

// ==================== SPACING ====================

export const SPACING = {
  // Content padding
  page: 'p-6',
  section: 'p-4',
  card: 'p-4',
  cardLg: 'p-6',
  
  // Gaps
  gapXs: 'gap-1',
  gapSm: 'gap-2',
  gapMd: 'gap-3',
  gapLg: 'gap-4',
  gapXl: 'gap-6',
  
  // Stack spacing (vertical)
  stackXs: 'space-y-1',
  stackSm: 'space-y-2',
  stackMd: 'space-y-3',
  stackLg: 'space-y-4',
  stackXl: 'space-y-6',
} as const;

// ==================== BORDERS & RADIUS ====================

export const BORDERS = {
  // Border radius (iOS-style rounded corners)
  radiusSm: 'rounded-ios-sm',
  radius: 'rounded-ios',
  radiusLg: 'rounded-ios-lg',
  radiusXl: 'rounded-ios-xl',
  
  // Border styles
  subtle: 'border border-border-subtle',
  default: 'border border-border',
  strong: 'border border-border-strong',
} as const;

// ==================== SHADOWS ====================

export const SHADOWS = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  elevated: 'shadow-elevated',
  card: 'shadow-card',
} as const;

// ==================== INTERACTIONS ====================

export const INTERACTIONS = {
  // Transitions (iOS-style easing)
  transition: 'transition-all duration-200 ease-ios',
  transitionFast: 'transition-all duration-150 ease-ios',
  transitionSlow: 'transition-all duration-300 ease-ios',
  
  // Hover states
  hoverScale: 'hover:scale-[1.02] active:scale-[0.98]',
  hoverLift: 'hover:-translate-y-0.5',
  
  // Active states
  activePress: 'active:scale-95',
} as const;

// ==================== BUTTONS ====================

export const BUTTONS = {
  // Primary button - Monochrome White
  primary: `
    bg-white text-black
    hover:bg-neutral-100
    ${BORDERS.radius}
    px-4 py-2.5
    ${TYPOGRAPHY.body}
    font-semibold
    ${INTERACTIONS.transition}
    ${INTERACTIONS.activePress}
    shadow-sm
  `.trim().replace(/\s+/g, ' '),
  
  // Secondary button
  secondary: `
    ${COLORS.surface.elevated}
    ${BORDERS.radius}
    ${BORDERS.default}
    px-4 py-2.5
    ${TYPOGRAPHY.body}
    ${COLORS.text.primary}
    font-medium
    ${INTERACTIONS.transition}
    ${INTERACTIONS.activePress}
  `.trim().replace(/\s+/g, ' '),
  
  // Ghost button
  ghost: `
    ${COLORS.text.secondary}
    ${BORDERS.radius}
    px-4 py-2.5
    ${TYPOGRAPHY.body}
    font-medium
    ${INTERACTIONS.transition}
    ${INTERACTIONS.activePress}
    hover:bg-surface-elevated
  `.trim().replace(/\s+/g, ' '),
  
  // Icon button
  icon: `
    ${COLORS.surface.elevated}
    ${BORDERS.radius}
    p-2.5
    ${INTERACTIONS.transition}
    ${INTERACTIONS.activePress}
    hover:bg-surface-elevated-hover
  `.trim().replace(/\s+/g, ' '),
} as const;

// ==================== CARDS ====================

export const CARDS = {
  // Standard card
  default: `
    ${COLORS.surface.card}
    ${BORDERS.radius}
    ${BORDERS.subtle}
    ${SPACING.card}
    ${INTERACTIONS.transition}
  `.trim().replace(/\s+/g, ' '),
  
  // Elevated card
  elevated: `
    ${COLORS.surface.elevated}
    ${BORDERS.radiusLg}
    ${BORDERS.default}
    ${SPACING.cardLg}
    ${SHADOWS.card}
    ${INTERACTIONS.transition}
  `.trim().replace(/\s+/g, ' '),
  
  // Interactive card
  interactive: `
    ${COLORS.surface.card}
    ${BORDERS.radius}
    ${BORDERS.subtle}
    ${SPACING.card}
    ${INTERACTIONS.transition}
    ${INTERACTIONS.hoverLift}
    hover:bg-surface-card-hover
    hover:border-border
    cursor-pointer
  `.trim().replace(/\s+/g, ' '),
} as const;

// ==================== INPUTS ====================

export const INPUTS = {
  // Text input
  text: `
    ${COLORS.surface.elevated}
    ${BORDERS.radius}
    ${BORDERS.default}
    px-3 py-2.5
    ${TYPOGRAPHY.body}
    ${COLORS.text.primary}
    placeholder:text-neutral-600
    ${INTERACTIONS.transition}
    focus:outline-none
    focus:border-accent-primary
    focus:ring-1
    focus:ring-accent-primary/20
  `.trim().replace(/\s+/g, ' '),
  
  // Search input
  search: `
    ${COLORS.surface.elevated}
    ${BORDERS.radiusLg}
    ${BORDERS.subtle}
    px-4 py-2.5
    ${TYPOGRAPHY.body}
    ${COLORS.text.primary}
    placeholder:text-neutral-600
    ${INTERACTIONS.transition}
    focus:outline-none
    focus:border-border
    focus:bg-surface-elevated-hover
  `.trim().replace(/\s+/g, ' '),
} as const;

// ==================== BADGES ====================

export const BADGES = {
  // Status badges
  success: `
    ${COLORS.status.successBg}
    ${BORDERS.radiusSm}
    px-2 py-1
    ${TYPOGRAPHY.caption1}
    font-medium
  `.trim().replace(/\s+/g, ' '),
  
  warning: `
    ${COLORS.status.warningBg}
    ${BORDERS.radiusSm}
    px-2 py-1
    ${TYPOGRAPHY.caption1}
    font-medium
  `.trim().replace(/\s+/g, ' '),
  
  error: `
    ${COLORS.status.errorBg}
    ${BORDERS.radiusSm}
    px-2 py-1
    ${TYPOGRAPHY.caption1}
    font-medium
  `.trim().replace(/\s+/g, ' '),
  
  info: `
    ${COLORS.status.infoBg}
    ${BORDERS.radiusSm}
    px-2 py-1
    ${TYPOGRAPHY.caption1}
    font-medium
  `.trim().replace(/\s+/g, ' '),
  
  // Neutral badge
  neutral: `
    bg-white/5
    ${BORDERS.radiusSm}
    px-2 py-1
    ${TYPOGRAPHY.caption1}
    ${COLORS.text.secondary}
    font-medium
  `.trim().replace(/\s+/g, ' '),
} as const;

// ==================== STATUS COLORS MAP ====================

export const STATUS_COLORS = {
  pending: { bg: BADGES.warning, text: 'text-status-warning' },
  processing: { bg: BADGES.info, text: 'text-status-info' },
  completed: { bg: BADGES.success, text: 'text-status-success' },
  cancelled: { bg: BADGES.neutral, text: 'text-neutral-400' },
  refunded: { bg: BADGES.error, text: 'text-status-error' },
  'on-hold': { bg: BADGES.warning, text: 'text-status-warning' },
  failed: { bg: BADGES.error, text: 'text-status-error' },
} as const;

// ==================== UTILITY FUNCTIONS ====================

/**
 * Combine multiple design system classes
 */
export const cx = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Get status badge classes
 */
export const getStatusBadge = (status: string) => {
  const key = status.toLowerCase() as keyof typeof STATUS_COLORS;
  return STATUS_COLORS[key] || STATUS_COLORS.pending;
};

