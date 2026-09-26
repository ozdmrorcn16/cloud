"""ANIYA IFADE TEPKISI - CANLI TEST (2026-09-24).

EMOJI SURUMU (2026-09-26: ifade seti yerine standart emoji). IZLEYEN anliga
ifade atar, paylasan onu "Gorenler"de gorur. Jest Supabase'i mock'ladigi
icin sunucu kurali orada gorulemez. Olculen:
  1. Arkadas B ifade atar -> A'nin gorenler listesinde ifadesiyle.
  2. B'nin gorme kaydi (hikaye_goruntulendi) attigi ifadeyi doner.
  3. B ifadeyi degistirir (tek satir) ve null ile kaldirir.
  4. Sozluk disi slug reddedilir.
  5. A kendi anina ifade atamaz.
  6. Aniyi goremeyen yabanci C atamaz.
  7. Gorenler listesi yalnizca sahibe (B icin bos, ifade sizmaz).
  8. verilerimi_disa_aktar: A'da goren satirinda ifade, B'de
     hikaye_ifadelerim.
  9. anon RPC'yi cagiramaz.
Actiklarini siler. Kosum: python araclar/hikaye-ifade-tepkisi-canli-test.py
"""
import os
import time

from supabase import create_client

BURASI = os.path.dirname(os.path.abspath(__file__))
for satir in open(os.path.join(BURASI, '..', 'mobil', '.env'), encoding='utf-8'):
    satir = satir.strip()
    if satir and not satir.startswith('#') and '=' in satir:
        k, v = satir.split('=', 1)
        os.environ.setdefault(k, v.strip().strip('"'))

URL, ANON = os.environ['EXPO_PUBLIC_SUPABASE_URL'], os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
KOVA = 'hikaye-medyalari'
JPEG = bytes.fromhex(
    'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432'
    'ffc0000b080001000101011100ffc40014000100000000000000000000000000000009ffc40014100100000000000000000000000000000000ffda0008010100003f00d2cf20ffd9'
)

sonuclar = []


def kontrol(ad, kosul, ek=''):
    kosul = bool(kosul)
    sonuclar.append(kosul)
    print(('OK   ' if kosul else 'FAIL ') + ad + (f'  [{ek}]' if ek else ''))


def giris(eposta):
    c = create_client(URL, ANON)
    c.auth.sign_in_with_password({'email': eposta, 'password': 'test1234'})
    return c, c.auth.get_user().user.id


def reddedilir(ad, cagri, beklenen):
    try:
        cagri()
        kontrol(ad, False, 'kabul edildi!')
    except Exception as e:
        kontrol(ad, beklenen in str(e), str(e)[:80])


a, a_id = giris('test0@slooin.test')
b, b_id = giris('test1@slooin.test')
c, c_id = giris('test2@slooin.test')

hid = None
yol = None
bag_kurdum = False
c_bag_kaldir = False
try:
    # On kosul: B, A'nin arkadasi; C degil.
    if not a.table('takipler').select('durum').eq('takip_eden_id', b_id).eq('takip_edilen_id', a_id).eq('durum', 'kabul').execute().data:
        b.rpc('takip_istegi_gonder', {'p_kullanici_id': a_id}).execute()
        bag_kurdum = True
    if a.table('takipler').select('durum').eq('takip_eden_id', c_id).eq('takip_edilen_id', a_id).eq('durum', 'kabul').execute().data:
        c.rpc('takibi_birak', {'p_kullanici_id': a_id}).execute()
        c_bag_kaldir = True

    yol = f'{a_id}/ifade-canli-{int(time.time() * 1000)}.jpg'
    a.storage.from_(KOVA).upload(yol, JPEG, {'content-type': 'image/jpeg'})
    hid = a.rpc('hikaye_ekle', {'p_fotograf': yol}).execute().data['id']

    # 1-2. ifade at, gorme kaydi onu doner
    ilk = b.rpc('hikaye_goruntulendi', {'p_hikaye_id': hid}).execute().data
    kontrol('ifade yokken gorme kaydi null doner', ilk is None, repr(ilk))
    b.rpc('hikaye_emojisi_birak', {'p_hikaye_id': hid, 'p_emoji': '🔥'}).execute()
    gor = a.rpc('hikaye_goruntuleyenler', {'p_hikaye_id': hid}).execute().data
    kontrol('A gorenlerde B + ifadesi', [(g['kullanici_id'], g['emoji']) for g in gor] == [(b_id, '🔥')], str(gor)[:120])
    kontrol('B gorme kaydi attigi ifadeyi doner',
            b.rpc('hikaye_goruntulendi', {'p_hikaye_id': hid}).execute().data == '🔥')

    # 3. degistir / kaldir
    b.rpc('hikaye_emojisi_birak', {'p_hikaye_id': hid, 'p_emoji': '❤️'}).execute()
    gor = a.rpc('hikaye_goruntuleyenler', {'p_hikaye_id': hid}).execute().data
    kontrol('degistirince TEK satir, yeni ifade', len(gor) == 1 and gor[0]['emoji'] == '❤️')
    b.rpc('hikaye_emojisi_birak', {'p_hikaye_id': hid, 'p_emoji': None}).execute()
    gor = a.rpc('hikaye_goruntuleyenler', {'p_hikaye_id': hid}).execute().data
    kontrol('null ile kaldirilir, goren satiri kalir', len(gor) == 1 and gor[0]['emoji'] is None)

    # 4-6. kurallar
    reddedilir('sozluk disi slug reddedilir',
               lambda: b.rpc('hikaye_emojisi_birak', {'p_hikaye_id': hid, 'p_emoji': 'abc'}).execute(),
               'Gecersiz emoji')
    reddedilir('kendi anina ifade atilamaz',
               lambda: a.rpc('hikaye_emojisi_birak', {'p_hikaye_id': hid, 'p_emoji': '🔥'}).execute(),
               'Kendi anina ifade atamazsin')
    reddedilir('aniyi goremeyen yabanci C atamaz',
               lambda: c.rpc('hikaye_emojisi_birak', {'p_hikaye_id': hid, 'p_emoji': '🔥'}).execute(),
               'Hikaye bulunamadi')

    # 7. gorenler yalnizca sahibe
    b.rpc('hikaye_emojisi_birak', {'p_hikaye_id': hid, 'p_emoji': '🔥'}).execute()
    kontrol('B gorenler listesini goremez (ifade sizmaz)',
            b.rpc('hikaye_goruntuleyenler', {'p_hikaye_id': hid}).execute().data == [])

    # 8. disa aktarim
    da = a.rpc('verilerimi_disa_aktar').execute().data
    satir = [x for x in (da.get('hikaye_goruntulemelerim') or []) if x.get('hikaye_id') == hid]
    kontrol('A disa aktariminda goren satirinda ifade', satir and satir[0].get('emoji') == '🔥', str(satir)[:100])
    db = b.rpc('verilerimi_disa_aktar').execute().data
    kontrol('B disa aktariminda hikaye_ifadelerim',
            any(x.get('hikaye_id') == hid and x.get('emoji') == '🔥' for x in (db.get('hikaye_ifadelerim') or [])))

    # 9. anon
    reddedilir('anon ifade gonderemez',
               lambda: create_client(URL, ANON).rpc('hikaye_emojisi_birak', {'p_hikaye_id': hid, 'p_emoji': '🔥'}).execute(),
               'permission denied')
finally:
    if hid:
        try:
            a.rpc('hikaye_sil', {'p_hikaye_id': hid}).execute()
        except Exception as e:
            print('temizlik:', e)
    if yol:
        try:
            a.storage.from_(KOVA).remove([yol])
        except Exception as e:
            print('temizlik (kova):', e)
    if bag_kurdum:
        try:
            b.rpc('takibi_birak', {'p_kullanici_id': a_id}).execute()
        except Exception as e:
            print('temizlik (bag):', e)
    if c_bag_kaldir:
        try:
            c.rpc('takip_istegi_gonder', {'p_kullanici_id': a_id}).execute()
        except Exception as e:
            print('temizlik (C bag):', e)

print(f'\n{sum(sonuclar)}/{len(sonuclar)} gecti')
raise SystemExit(0 if all(sonuclar) else 1)
