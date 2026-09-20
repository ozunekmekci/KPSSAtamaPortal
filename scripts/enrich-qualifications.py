import os
import re

# 1. Parse ozel_kosullar
ozel = {}
with open('/tmp/kpss_raw/ozel_kosullar.txt', 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        m = re.match(r'^\s*(\d{4})\s+(.+)$', line)
        if m:
            ozel[m.group(1)] = m.group(2).strip()

# 2. Parse lisans_nitelik
lisans = {}
with open('/tmp/kpss_raw/lisans_nitelik.txt', 'r', encoding='utf-8', errors='ignore') as f:
    cur_code = None
    cur_txt = []
    for line in f:
        m = re.match(r'^\s*(\d{4})\s+(.+)$', line)
        if m:
            if cur_code:
                lisans[cur_code] = ' '.join(cur_txt).strip()
            cur_code = m.group(1)
            t = re.sub(r'\s{2,}\d+.*$', '', m.group(2)).strip()
            cur_txt = [t]
        elif cur_code and line.strip() and not line.strip().startswith('Nitelik') and not line.strip().startswith('LİSANS'):
            t = re.sub(r'\s{2,}\d+.*$', '', line.strip()).strip()
            if t: cur_txt.append(t)
    if cur_code: lisans[cur_code] = ' '.join(cur_txt).strip()

# 3. Parse onlisans_nitelik
onlisans = {}
with open('/tmp/kpss_raw/onlisans_nitelik.txt', 'r', encoding='utf-8', errors='ignore') as f:
    cur_code = None
    cur_txt = []
    for line in f:
        m = re.match(r'^\s*(\d{4})\s+(.+)$', line)
        if m:
            if cur_code:
                onlisans[cur_code] = ' '.join(cur_txt).strip()
            cur_code = m.group(1)
            t = re.sub(r'\s{2,}\d+.*$', '', m.group(2)).strip()
            cur_txt = [t]
        elif cur_code and line.strip() and not line.strip().startswith('Nitelik') and not line.strip().startswith('ÖN LİSANS'):
            t = re.sub(r'\s{2,}\d+.*$', '', line.strip()).strip()
            if t: cur_txt.append(t)
    if cur_code: onlisans[cur_code] = ' '.join(cur_txt).strip()

orta = {
    '2001': 'Ortaöğretim kurumlarının herhangi bir alanından mezun olmak.',
    '2023': 'Ortaöğretim kurumlarının Elektrik-Elektronik Teknolojisi Alanı ve Dallarından mezun olmak.',
    '2043': 'Ortaöğretim kurumlarının Makine Teknolojisi Alanı ve Dallarından mezun olmak.',
    '2047': 'Ortaöğretim kurumlarının Motorlu Araçlar Teknolojisi Alanı ve Dallarından mezun olmak.',
    '2051': 'Ortaöğretim kurumlarının Kimya Teknolojisi Alanı ve Dallarından mezun olmak.',
    '2053': 'Ortaöğretim kurumlarının İnşaat Teknolojisi Alanı ve Dallarından mezun olmak.',
    '2055': 'Ortaöğretim kurumlarının Harita-Tapu-Kadastro Alanı ve Dallarından mezun olmak.',
    '2059': 'Ortaöğretim kurumlarının Metal Teknolojisi Alanı ve Dallarından mezun olmak.',
    '2061': 'Ortaöğretim kurumlarının Tesisat Teknolojisi ve İklimlendirme Alanı ve Dallarından mezun olmak.',
    '2065': 'Ortaöğretim kurumlarının Bilişim Teknolojileri Alanı ve Dallarından mezun olmak.',
    '2071': 'Ortaöğretim kurumlarının Raylı Sistemler Teknolojisi Alanı ve Dallarından mezun olmak.',
    '2075': 'Ortaöğretim kurumlarının Sağlık Hizmetleri Alanı - Hemşire Yardımcılığı Dalından mezun olmak.',
    '2079': 'Ortaöğretim kurumlarının Sağlık Hizmetleri Alanı - Ebe Yardımcılığı Dalından mezun olmak.',
    '2085': 'Ortaöğretim kurumlarının Büro Yönetimi Alanı ve Dallarından mezun olmak.',
    '2086': 'Ortaöğretim kurumlarının Muhasebe ve Finansman Alanı ve Dallarından mezun olmak.',
    '2087': 'Ortaöğretim kurumlarının Hasta ve Yaşlı Hizmetleri Alanı ve Dallarından mezun olmak.',
    '2111': 'Ortaöğretim kurumlarının İtfaiyecilik ve Yangın Güvenliği Alanı ve Dallarından mezun olmak.',
    '2112': 'Ortaöğretim kurumlarının Uçak Bakım Alanı ve Dallarından mezun olmak.',
    '2117': 'Ortaöğretim kurumlarının Biyomedikal Cihaz Teknolojileri Alanı ve Dallarından mezun olmak.',
}

all_official = {}
all_official.update(orta)
all_official.update(ozel)
all_official.update(lisans)
all_official.update(onlisans)

# Read existing qualifications.ts
qual_file = './src/data/qualifications.ts'
with open(qual_file, 'r', encoding='utf-8') as f:
    qual_content = f.read()

existing_codes = set(re.findall(r"kod:\s*'(\d{4})'", qual_content))

# Codes in records
import json
with open('./src/data/kpss_records.json', 'r', encoding='utf-8') as f:
    recs = json.load(f)
rec_codes = set()
for r in recs:
    for c in r['nitelikKodlari']:
        rec_codes.add(c)

missing = sorted(list(rec_codes.difference(existing_codes)))
print(f'Adding {len(missing)} missing qualification codes...')

new_entries = []
for code in missing:
    raw_desc = all_official.get(code, f'{code} nitelik kodu').replace("'", "\\'")
    
    first_digit = code[0]
    if first_digit == '4':
        kat = 'lisans_mezuniyet'
        lvl = 'lisans'
        is_sp = 'false'
        kisa = raw_desc.replace('lisans programından mezun olmak.', '').replace('lisans programlarının birinden mezun olmak.', '').strip()[:40]
    elif first_digit == '3':
        kat = 'onlisans_mezuniyet'
        lvl = 'onlisans'
        is_sp = 'false'
        kisa = raw_desc.replace('önlisans programından mezun olmak.', '').replace('önlisans programlarının birinden mezun olmak.', '').strip()[:40]
    elif first_digit == '2':
        kat = 'ortaogretim_mezuniyet'
        lvl = 'ortaogretim'
        is_sp = 'false'
        kisa = raw_desc.replace('Ortaöğretim kurumlarının ', '').replace(' Alanı ve Dallarından mezun olmak.', '').strip()[:40]
    elif code.startswith(('65')):
        kat = 'surucu_belgesi'
        lvl = 'hepsi'
        is_sp = 'true'
        kisa = raw_desc[:40]
    elif code.startswith(('62')):
        kat = 'bilgisayar_sertifika'
        lvl = 'hepsi'
        is_sp = 'true'
        kisa = raw_desc[:40]
    elif code.startswith(('71')):
        kat = 'yabanci_dil'
        lvl = 'hepsi'
        is_sp = 'true'
        kisa = raw_desc[:40]
    elif code.startswith(('73')):
        kat = 'guvenlik_ve_vardiya' if 'güvenlik' in raw_desc.lower() or 'vardiya' in raw_desc.lower() else 'kurumsal_ozel_sart'
        lvl = 'hepsi'
        is_sp = 'true'
        kisa = raw_desc[:40]
    else:
        kat = 'diger_ozel_sart'
        lvl = 'hepsi'
        is_sp = 'true'
        kisa = raw_desc[:40]

    entry = f"""  {{
    kod: '{code}',
    kategori: '{kat}',
    ogrenimDuzeyi: '{lvl}',
    aciklama: '{raw_desc}',
    kisaTanim: '{kisa}',
    isSpecialCondition: {is_sp},
  }},"""
    new_entries.append(entry)

# Insert before '];\n\nexport const QUALIFICATIONS_BY_CODE'
insertion_point = qual_content.rfind('];\n\nexport const QUALIFICATIONS_BY_CODE')
if insertion_point == -1:
    insertion_point = qual_content.rfind('];\nexport const QUALIFICATIONS_BY_CODE')

updated_content = (
    qual_content[:insertion_point]
    + '\n  // ==========================================================================\n'
    + '  // RESMÎ ÖSYM 2024–2026 KILAVUZ ENTEGRASYON KODLARI\n'
    + '  // ==========================================================================\n'
    + '\n'.join(new_entries)
    + '\n'
    + qual_content[insertion_point:]
)

with open(qual_file, 'w', encoding='utf-8') as f:
    f.write(updated_content)

print('Updated src/data/qualifications.ts successfully!')
