import { clsx, type ClassValue } from 'clsx';
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // If it starts with +1 (US/Canada)
  if (cleaned.startsWith('+1') && cleaned.length === 12) {
    return `+1 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
  }

  // If it's 10 digits (US format without country code)
  if (/^\d{10}$/.test(cleaned)) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // If it's 7 digits (local format)
  if (/^\d{7}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }

  return phone;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatCallDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (minutes < 60) {
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatTime(date: Date, is24Hour: boolean = false): string {
  return format(date, is24Hour ? 'HH:mm' : 'h:mm a');
}

export function formatDate(date: Date, formatStr: string = 'MMM d, yyyy'): string {
  return format(date, formatStr);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateGradient(seed: string): string {
  const colors = [
    ['#0ea5e9', '#a855f7'], // Aurora -> Cosmic
    ['#a855f7', '#ec4899'], // Cosmic -> Nebula
    ['#ec4899', '#0ea5e9'], // Nebula -> Aurora
    ['#10b981', '#0ea5e9'], // Emerald -> Aurora
    ['#f59e0b', '#ec4899'], // Amber -> Nebula
    ['#6366f1', '#a855f7'], // Indigo -> Cosmic
  ];

  // Simple hash based on string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colorPair = colors[Math.abs(hash) % colors.length];
  return `linear-gradient(135deg, ${colorPair[0]} 0%, ${colorPair[1]} 100%)`;
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Check various valid formats
  const patterns = [
    /^\+?1?\d{10}$/, // US/Canada
    /^\+\d{1,3}\d{4,14}$/, // International
    /^\d{3,4}$/, // Extension
  ];

  return patterns.some((pattern) => pattern.test(cleaned));
}

export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function playSound(soundName: string, volume: number = 1): void {
  // This would play actual sound files
  console.log(`Playing sound: ${soundName} at volume ${volume}`);
}

export function vibrateDevice(pattern: number | number[]): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function getPresenceColor(presence: string): string {
  const colors: Record<string, string> = {
    available: 'bg-emerald-500',
    busy: 'bg-red-500',
    away: 'bg-amber-500',
    dnd: 'bg-red-600',
    offline: 'bg-surface-500',
    'on-call': 'bg-aurora-500',
    ringing: 'bg-amber-400',
  };

  return colors[presence] || colors.offline;
}

export function getPresenceLabel(presence: string): string {
  const labels: Record<string, string> = {
    available: 'Available',
    busy: 'Busy',
    away: 'Away',
    dnd: 'Do Not Disturb',
    offline: 'Offline',
    'on-call': 'On a Call',
    ringing: 'Ringing',
  };

  return labels[presence] || 'Unknown';
}
