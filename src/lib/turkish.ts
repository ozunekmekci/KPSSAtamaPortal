/**
 * Two-tier Turkish Character Normalization Library
 * Solves:
 * 1. Dotted/dotless I issues (İ <-> i, I <-> ı)
 * 2. Cross-keyboard compatibility (English keyboard typing "bilgisayar muhendisligi" matches "BİLGİSAYAR MÜHENDİSLİĞİ")
 * 3. Case folding preserving Turkish locale rules
 */

/**
 * Tier 1: Canonical Turkish Lowercase
 * Preserves Turkish grammatical characters (ş, ğ, ü, ö, ç, ı, i)
 */
export function normalizeTr(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLocaleLowerCase('tr-TR')
    .trim();
}

/**
 * Tier 2: Universal Search Normalization
 * Folds Turkish diacritics to ASCII for resilient matching across English and Turkish keyboards
 */
export function normalizeTrSearch(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[âîû]/g, (match) => ({ â: 'a', î: 'i', û: 'u' }[match] || match))
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Turkish Uppercase ensuring correct dotted İ conversion
 */
export function toTurkishUpper(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toLocaleUpperCase('tr-TR')
    .trim();
}

/**
 * Turkish Title Case
 */
export function toTurkishTitle(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      const lower = normalizeTr(word);
      const first = lower.charAt(0);
      const rest = lower.slice(1);
      const upperFirst = first === 'i' ? 'İ' : first === 'ı' ? 'I' : first.toLocaleUpperCase('tr-TR');
      return upperFirst + rest;
    })
    .join(' ');
}
