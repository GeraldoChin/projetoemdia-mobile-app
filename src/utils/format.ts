const pad = (n: number) => String(n).padStart(2, '0');

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** 28/06/2026 */
export function formatDate(iso?: string | null): string {
  if (!iso) return 'Sem data';
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** 14 de Junho, 2026 */
export function formatDateLong(iso?: string | null): string {
  if (!iso) return 'Sem data';
  const d = new Date(iso);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

/** 20 Jun */
export function formatDateShort(iso?: string | null): string {
  if (!iso) return 'Sem data';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function formatTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isToday(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

/** "Faltam 4 dias", "Termina hoje", "Atrasado 2 dias" */
export function daysLeftLabel(daysLeft: number | null | undefined): string {
  if (daysLeft === null || daysLeft === undefined) return 'Sem prazo';
  if (daysLeft < 0) return `Atrasado ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'dia' : 'dias'}`;
  if (daysLeft === 0) return 'Termina hoje';
  return `Faltam ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`;
}

/** Dias inteiros até uma data (negativo = já passou). */
export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

/** "há 2 horas", "ontem", "agora mesmo" */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} ${h === 1 ? 'hora' : 'horas'}`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ontem';
  if (d < 7) return `há ${d} dias`;
  return formatDate(iso);
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** "Samira Nguenha" → "Samira N." */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

/** Converte a data escolhida no seletor para ISO ao meio-dia (evita saltos de fuso). */
export function toIsoNoon(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).toISOString();
}
