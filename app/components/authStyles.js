// Shared visual tokens for auth forms
export const glassContainer =
  "w-full ui-future-panel p-6 sm:p-10 max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--ui-border)]";
export const glassMorph = "glass-morph backdrop-blur-md";
// Icon bubble on the left (lock/user/etc). Inputs reserve left padding.
export const iconBubble = `absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full ui-future-chip text-[var(--color-primary-500)] transition-colors`;
// Default input: reserve left padding for the icon, and right padding for optional buttons
export const inputBase = `w-full pr-12 pl-12 py-4 ui-future-panel border border-[var(--ui-border)] rounded-xl text-[var(--ui-foreground)] placeholder:text-[var(--ui-muted)] focus:outline-none focus:border-[var(--ui-border-strong)] transition-all text-base font-medium`;
// Password inputs need extra right padding for the show/hide button
export const inputBasePassword = `${inputBase} pr-12`; // Adjust padding for eye icon on the right
export const btnPrimary =
  "w-full px-8 py-4 rounded-xl border border-[var(--ui-border-strong)] bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-secondary-500)] text-white font-bold text-lg shadow-[var(--shadow-glow)] transition-all hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3";
export const socialButton = `flex-1 max-w-40 h-12 rounded-xl ui-future-chip text-[var(--ui-foreground)] transition-all hover:border-[var(--ui-border-strong)] flex items-center justify-center gap-2 font-medium`;
export const backHomeBtn = `w-10 h-10 flex items-center justify-center rounded-full ui-future-chip text-[var(--ui-foreground)] transition-all`;

// Centralized color tokens for auth forms
export const authText = "text-[var(--ui-foreground)]"; // primary text color for labels/headings
export const authIcon = "text-[var(--color-primary-500)]"; // color for icons and small accents

const authStyles = {
  glassContainer,
  glassMorph,
  iconBubble,
  inputBase,
  inputBasePassword,
  btnPrimary,
  socialButton,
  backHomeBtn,
};

export default authStyles;
