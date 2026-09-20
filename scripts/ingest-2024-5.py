import os
import re
import json

def parse_tablo(tablo_path):
    table_data = {}
    with open(tablo_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            m = re.match(r'^\s*(\d{9})\s+', line)
            if not m:
                continue
            code = m.group(1)
            parts = line.strip().split()
            if 'TAŞRA' in parts:
                idx = parts.index('TAŞRA')
            elif 'MERKEZ' in parts:
                idx = parts.index('MERKEZ')
            else:
                idx = 2
            quals = [x for x in parts[idx+1:] if re.match(r'^\d{4}$', x)]
            table_data[code] = quals
    return table_data

def parse_minmax(minmax_path):
    records = {}
    with open(minmax_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            m = re.match(r'^\s*(\d{9})\s+(.+?)\s{2,}(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d,]+)\s+([\d,]+)', line)
            if m:
                code, kurum_raw, unvan_raw, kont, yerl, bos, min_p, max_p = m.groups()
                parts = [p.strip() for p in kurum_raw.split('/')]
                kurum_adi = parts[0] if len(parts) > 0 and parts[0] else 'T.C. SAĞLIK BAKANLIĞI'
                sehir = parts[1] if len(parts) > 1 and parts[1] else 'ANKARA'
                teskilat_raw = parts[2] if len(parts) > 2 and parts[2] else 'TAŞRA'
                teskilat = 'TASRA' if 'TAŞRA' in teskilat_raw else ('MERKEZ' if 'MERKEZ' in teskilat_raw else 'TASRA')
                records[code] = {
                    'kurumAdi': kurum_adi,
                    'sehir': sehir,
                    'teskilat': teskilat,
                    'kadroUnvani': unvan_raw.strip(),
                    'kontenjan': int(kont),
                    'yerlesen': int(yerl),
                    'bosKalan': int(bos),
                    'tabanPuan': float(min_p.replace(',', '.')),
                    'tavanPuan': float(max_p.replace(',', '.')),
                }
    return records

def ingest_2024_5():
    records_file = os.path.join(os.getcwd(), 'src/data/kpss_records.json')
    with open(records_file, 'r', encoding='utf-8') as f:
        existing = json.load(f)

    clean_existing = [r for r in existing if r.get('donem') != '2024/5']

    mappings = [
        ('2024/5', 'lisans', 'P3', '/tmp/kpss_raw/2024_5/tablo3.txt', '/tmp/2024_5_minmax_lis_layout.txt'),
        ('2024/5', 'onlisans', 'P93', '/tmp/kpss_raw/2024_5/tablo2.txt', '/tmp/2024_5_minmax_onl_layout.txt'),
        ('2024/5', 'ortaogretim', 'P94', '/tmp/kpss_raw/2024_5/tablo1.txt', '/tmp/2024_5_minmax_ort_layout.txt'),
    ]

    new_records = []
    for period, level, score_type, tablo_path, minmax_path in mappings:
        tablo_data = parse_tablo(tablo_path)
        minmax_data = parse_minmax(minmax_path)
        
        count = 0
        for code, mm in minmax_data.items():
            codes = tablo_data.get(code, [])
            mezuniyet_kodlari = [c for c in codes if c.startswith(('2', '3', '4'))]
            ozel_sartlar = [c for c in codes if c.startswith(('1', '6', '7'))]
            unvan = mm['kadroUnvani']
            if any(k in unvan for k in ['MÜHENDİS', 'MİMAR', 'ŞEHİR PLANCISI']):
                hizmet_sinifi = 'TH'
            elif any(k in unvan for k in ['AVUKAT']):
                hizmet_sinifi = 'AH'
            elif any(k in unvan for k in ['BÜRO PERSONELİ', 'İSTATİSTİKÇİ']):
                hizmet_sinifi = 'GİH'
            elif any(k in unvan for k in ['DESTEK PERSONELİ', 'ŞOFÖR']):
                hizmet_sinifi = 'YH'
            else:
                hizmet_sinifi = 'SH'
                
            rec = {
                'id': f'{period}-{level}-{code}',
                'kadroKodu': code,
                'donem': period,
                'ogrenimDuzeyi': level,
                'puanTuru': score_type,
                'kurumAdi': mm['kurumAdi'],
                'kadroUnvani': unvan,
                'teskilat': mm['teskilat'],
                'hizmetSinifi': hizmet_sinifi,
                'sehir': mm['sehir'],
                'kontenjan': mm['kontenjan'],
                'yerlesen': mm['yerlesen'],
                'bosKalan': mm['bosKalan'],
                'tabanPuan': mm['tabanPuan'],
                'tavanPuan': mm['tavanPuan'],
                'nitelikKodlari': codes,
                'mezuniyetKodlari': mezuniyet_kodlari,
                'ozelSartlar': ozel_sartlar,
            }
            new_records.append(rec)
            count += 1
        print(f'{period} {level}: {count} records parsed.')

    all_records = clean_existing + new_records
    with open(records_file, 'w', encoding='utf-8') as f:
        json.dump(all_records, f, ensure_ascii=False, indent=2)

    print(f'Total records in {records_file}: {len(all_records)} (added {len(new_records)} records from 2024/5)')

if __name__ == '__main__':
    ingest_2024_5()
