import os
import re
import json

def parse_tablo_details(tablo_file):
    """
    Parses Tablo-1, Tablo-2, or Tablo-3 to extract:
    - aranan nitelik kodları
    - sinif (GİH, TH, SH, AH, YH, KİT vb.)
    - derece
    - il / ilce
    - teskilat
    """
    data = {}
    with open(tablo_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if not re.match(r'^\s*\d{9}\b', line):
                continue
            parts = line.strip().split()
            code = parts[0]
            
            # Find all 4-digit numeric qualification codes at the end of line
            codes = []
            for token in reversed(parts[2:]):
                if re.match(r'^\d{4}$', token):
                    codes.insert(0, token)
                else:
                    break
            
            # Identify class (SINIFI) if present among known classes
            known_classes = {'GİH', 'TH', 'SH', 'AH', 'YH', 'EÖH', 'KİT', 'DH', 'GİHS', 'THS', 'SHS'}
            sinif = None
            for token in parts:
                if token in known_classes:
                    sinif = token
                    break
            if not sinif:
                sinif = 'GİH'
                
            data[code] = {
                'codes': codes,
                'sinif': sinif,
            }
    return data

def parse_minmax(minmax_file):
    """
    Parses minmax PDF text to extract placement results.
    Format:
    KurumKodu  Kurum / Sehir / Teskilat   Unvan   Kontenjan  Yerlesen  Bos  TabanPuan  TavanPuan
    """
    records = {}
    with open(minmax_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            # Match 9-digit row
            m = re.match(r'^(\d{9})\s+(.+?)\s{2,}(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d,]+)\s+([\d,]+)$', line)
            if m:
                code, kurum_raw, unvan_raw, kont, yerl, bos, min_p, max_p = m.groups()
                
                # Split kurum_raw by '/'
                k_parts = [p.strip() for p in kurum_raw.split('/')]
                kurum_adi = k_parts[0] if len(k_parts) > 0 and k_parts[0] else 'KAMU KURUMU'
                sehir = k_parts[1] if len(k_parts) > 1 and k_parts[1] else 'ANKARA'
                teskilat_raw = k_parts[2] if len(k_parts) > 2 and k_parts[2] else ''
                
                # Normalize teskilat
                if 'KİT' in teskilat_raw or 'KİT' in kurum_adi or 'A.Ş' in kurum_adi or 'GENEL MÜDÜRLÜĞÜ' in kurum_adi and ('DHMİ' in kurum_adi or 'TEİAŞ' in kurum_adi or 'TCDD' in kurum_adi):
                    teskilat = 'KIT'
                elif 'ÜNİVERSİTE' in kurum_adi:
                    teskilat = 'UNIVERSITE'
                elif 'BELEDİYE' in kurum_adi:
                    teskilat = 'BELEDIYE'
                elif 'TAŞRA' in teskilat_raw:
                    teskilat = 'TASRA'
                else:
                    teskilat = 'MERKEZ'
                    
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

def ingest_all():
    table_mappings = [
        # 2024/1
        ('2024/1', 'lisans', 'P3', '/tmp/kpss_raw/2024_1_tablo3.txt', '/tmp/kpss_raw/2024_1_minmax_lis.txt'),
        ('2024/1', 'onlisans', 'P93', '/tmp/kpss_raw/2024_1_tablo2.txt', '/tmp/kpss_raw/2024_1_minmax_onl.txt'),
        ('2024/1', 'ortaogretim', 'P94', '/tmp/kpss_raw/2024_1_tablo1.txt', '/tmp/kpss_raw/2024_1_minmax_ort.txt'),
        # 2024/2
        ('2024/2', 'lisans', 'P3', '/tmp/kpss_raw/2024_2_tablo3.txt', '/tmp/kpss_raw/2024_2_minmax_lis.txt'),
        ('2024/2', 'onlisans', 'P93', '/tmp/kpss_raw/2024_2_tablo2.txt', '/tmp/kpss_raw/2024_2_minmax_onl.txt'),
        ('2024/2', 'ortaogretim', 'P94', '/tmp/kpss_raw/2024_2_tablo1.txt', '/tmp/kpss_raw/2024_2_minmax_ort.txt'),
    ]

    all_records = []
    
    for period, level, score_type, tablo_path, minmax_path in table_mappings:
        tablo_data = parse_tablo_details(tablo_path)
        minmax_data = parse_minmax(minmax_path)
        
        count = 0
        for code, mm in minmax_data.items():
            tb = tablo_data.get(code, {'codes': [], 'sinif': 'GİH'})
            codes = tb['codes']
            
            mezuniyet_kodlari = [c for c in codes if c.startswith(('2', '3', '4'))]
            ozel_sartlar = [c for c in codes if c.startswith(('1', '6', '7'))]
            
            record = {
                'id': f'{period}-{level}-{code}',
                'kadroKodu': code,
                'donem': period,
                'ogrenimDuzeyi': level,
                'puanTuru': score_type,
                'kurumAdi': mm['kurumAdi'],
                'kadroUnvani': mm['kadroUnvani'],
                'teskilat': mm['teskilat'],
                'hizmetSinifi': tb['sinif'],
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
            all_records.append(record)
            count += 1
            
        print(f'{period} {level}: {count} records ingested')

    output_path = os.path.join(os.getcwd(), 'src/data/kpss_records.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_records, f, ensure_ascii=False, indent=2)
        
    print(f'\nTotal {len(all_records)} official ÖSYM placement records saved to {output_path}')

if __name__ == '__main__':
    ingest_all()
