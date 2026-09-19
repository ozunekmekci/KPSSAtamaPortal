import { describe, it, expect } from 'vitest';
import {
  normalizeTr,
  normalizeTrSearch,
  toTurkishUpper,
  toTurkishTitle,
} from '@/lib/turkish';

describe('Turkish Character Normalization Subsystem', () => {
  it('correctly handles dotted and dotless I in lowercase', () => {
    expect(normalizeTr('İSTANBUL')).toBe('istanbul');
    expect(normalizeTr('IĞDIR')).toBe('ığdır');
    expect(normalizeTr('İZMİR')).toBe('izmir');
    expect(normalizeTr('ISPARTA')).toBe('ısparta');
  });

  it('correctly folds diacritics for cross-keyboard search', () => {
    expect(normalizeTrSearch('BİLGİSAYAR MÜHENDİSLİĞİ')).toBe('bilgisayar muhendisligi');
    expect(normalizeTrSearch('bilgisayar muhendisligi')).toBe('bilgisayar muhendisligi');
    expect(normalizeTrSearch('ÇALIŞMA EKONOMİSİ')).toBe('calisma ekonomisi');
    expect(normalizeTrSearch('ÖĞRETMENLİK')).toBe('ogretmenlik');
    expect(normalizeTrSearch('ŞOFÖR')).toBe('sofor');
  });

  it('preserves numbers and removes special punctuation in search string', () => {
    expect(normalizeTrSearch('V.H.K.İ. (1. DERECE)')).toBe('v h k i 1 derece');
    expect(normalizeTrSearch('DHMİ / ESENBOĞA')).toBe('dhmi esenboga');
    expect(normalizeTrSearch('2024/1')).toBe('2024 1');
  });

  it('correctly converts to Turkish uppercase with dotted İ', () => {
    expect(toTurkishUpper('istanbul')).toBe('İSTANBUL');
    expect(toTurkishUpper('iğdır')).toBe('İĞDIR');
    expect(toTurkishUpper('bilgisayar')).toBe('BİLGİSAYAR');
  });

  it('properly formats Turkish title case', () => {
    expect(toTurkishTitle('bilgisayar mühendisliği')).toBe('Bilgisayar Mühendisliği');
    expect(toTurkishTitle('istanbul üniversitesi')).toBe('İstanbul Üniversitesi');
  });
});
