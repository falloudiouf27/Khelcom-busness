/**
 * Utility functions for formatting currencies, dates, and phone numbers in FCFA / Senegal format
 */

export function formatFCFA(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 FCFA';
  }
  // Format with French thousand separator (space)
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function generateOrderNumber(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const dateStr = new Date().getFullYear();
  return `KB-${dateStr}-${randomNum}`;
}

export function getStatusBadge(status: string): { label: string; bg: string; text: string; border: string; dot: string } {
  switch (status) {
    case 'pending_payment':
      return {
        label: 'En attente de paiement',
        bg: 'bg-amber-950/40',
        text: 'text-amber-300',
        border: 'border-amber-700/60',
        dot: 'bg-amber-400',
      };
    case 'paid':
      return {
        label: 'Paiement Validé',
        bg: 'bg-emerald-950/40',
        text: 'text-emerald-300',
        border: 'border-emerald-700/60',
        dot: 'bg-emerald-400',
      };
    case 'preparing':
      return {
        label: 'En préparation',
        bg: 'bg-blue-950/40',
        text: 'text-blue-300',
        border: 'border-blue-700/60',
        dot: 'bg-blue-400',
      };
    case 'delivered':
      return {
        label: 'Livré / Récupéré',
        bg: 'bg-emerald-950/50',
        text: 'text-emerald-200',
        border: 'border-emerald-500/60',
        dot: 'bg-emerald-400',
      };
    case 'cancelled':
      return {
        label: 'Annulée',
        bg: 'bg-rose-950/40',
        text: 'text-rose-300',
        border: 'border-rose-700/60',
        dot: 'bg-rose-400',
      };
    default:
      return {
        label: status,
        bg: 'bg-purple-950/40',
        text: 'text-purple-300',
        border: 'border-purple-700/60',
        dot: 'bg-purple-400',
      };
  }
}
