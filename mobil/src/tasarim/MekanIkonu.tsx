import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg'

/**
 * Mekan turune gore ikon.
 *
 * Karar (kullanici, 2026-08-23): mekanlarin FOTOGRAFI olmayacak. Dis
 * kaynaktan (Wikimedia, Mapillary, Google) gorsel cekme iptal edildi -
 * telif, kapsam ve API bagimliligi getiriyordu. Yerine turu anlatan bir
 * ikon konuyor: kafeyse fincan, restoransa catal-bicak, binaysa bina.
 * Gercek fotograflar yalnizca ANILARDA, yani kisilerin orada cektikleri.
 *
 * 133 tur var ama ikon sayisi bilerek az: turler anlamli gruplara
 * dusuyor. Eslesmeyen her tur nokta ikonuna dusuyor, hicbir yer bos
 * kalmiyor.
 */

type IkonAdi =
  | 'fincan' | 'catal' | 'kadeh' | 'ekmek' | 'dondurma'
  | 'agac' | 'dalga' | 'cadir' | 'dag' | 'meydan'
  | 'sutun' | 'cerceve' | 'bina' | 'kitap' | 'film' | 'nota'
  | 'dambil' | 'stadyum' | 'havuz'
  | 'yatak' | 'canta' | 'sepet'
  | 'mezuniyet' | 'kubbe' | 'haç' | 'otobus' | 'nokta'

// Tur -> ikon. Sozlukte olmayan tur 'nokta'ya duser.
const TUR_IKONU: Record<string, IkonAdi> = {
  // Yeme icme
  'Kafe': 'fincan', 'Kahveci': 'fincan', 'Çay evi': 'fincan',
  'İnternet kafe': 'fincan',
  'Restoran': 'catal', 'Türk mutfağı': 'catal', 'Kebapçı': 'catal',
  'Pizzacı': 'catal', 'Balık restoranı': 'catal', 'Steakhouse': 'catal',
  'Suşi restoranı': 'catal', 'İtalyan restoranı': 'catal',
  'Çin restoranı': 'catal', 'Burgerci': 'catal', 'Ocakbaşı': 'catal',
  'Kahvaltı salonu': 'catal', 'Fast food': 'catal', 'Lokanta': 'catal',
  'Yemek katı': 'catal', 'Yeme içme': 'catal',
  'Fırın': 'ekmek', 'Tatlıcı': 'dondurma', 'Dondurmacı': 'dondurma',
  'Meyve suyu barı': 'dondurma',
  // Gece
  'Bar': 'kadeh', 'Pub': 'kadeh', 'Şarap evi': 'kadeh',
  'Kokteyl barı': 'kadeh', 'Bira evi': 'kadeh', 'Bira bahçesi': 'kadeh',
  'Spor barı': 'kadeh', 'Gece kulübü': 'nota', 'Karaoke': 'nota',
  'Nargile kafe': 'fincan', 'Şaraphane': 'kadeh',
  'Bira fabrikası': 'kadeh', 'Meyhane': 'kadeh',
  // Acik alan
  'Park': 'agac', 'Milli park': 'agac', 'Tabiat parkı': 'agac',
  'Halk bahçesi': 'agac', 'Botanik bahçe': 'agac', 'Piknik alanı': 'agac',
  'Orman': 'agac', 'Doğal alan': 'agac',
  'Plaj': 'dalga', 'Göl': 'dalga', 'Nehir': 'dalga', 'Şelale': 'dalga',
  'Kaplıca': 'dalga', 'Marina': 'dalga',
  'Kamp alanı': 'cadir', 'Dağ': 'dag', 'Seyir terası': 'dag',
  'Meydan': 'meydan',
  // Kultur
  'Müze': 'sutun', 'Ören yeri': 'sutun', 'Anıt': 'sutun',
  'Kale': 'bina', 'Tarihi yer': 'bina',
  'Sanat galerisi': 'cerceve', 'Kültür merkezi': 'cerceve',
  'Sanat ve eğlence': 'cerceve',
  'Kütüphane': 'kitap', 'Kitapçı': 'kitap',
  'Sinema': 'film', 'Tiyatro': 'film', 'Sahne sanatları': 'film',
  'Opera binası': 'nota', 'Canlı müzik': 'nota', 'Konser salonu': 'nota',
  'Akvaryum': 'dalga', 'Hayvanat bahçesi': 'agac',
  'Lunapark': 'meydan', 'Aquapark': 'havuz',
  // Spor
  'Spor salonu': 'dambil', 'Fitness merkezi': 'dambil',
  'Yoga stüdyosu': 'dambil', 'Pilates stüdyosu': 'dambil',
  'Dövüş sporları salonu': 'dambil', 'Spor kulübü': 'dambil',
  'Bowling salonu': 'dambil', 'Bilardo salonu': 'dambil',
  'Spor ve rekreasyon': 'dambil',
  'Yüzme havuzu': 'havuz', 'Stadyum': 'stadyum',
  'Tenis kortu': 'stadyum', 'Golf sahası': 'agac',
  'Kayak merkezi': 'dag', 'Kaykay parkı': 'stadyum',
  // Konaklama
  'Otel': 'yatak', 'Motel': 'yatak', 'Hostel': 'yatak',
  'Pansiyon': 'yatak', 'Tatil köyü': 'yatak', 'Konaklama': 'yatak',
  'Kiralık daire': 'bina', 'Apartman': 'bina', 'Konut': 'bina',
  'Site': 'bina',
  // Alisveris
  'AVM': 'canta', 'Alışveriş': 'canta', 'Giyim mağazası': 'canta',
  'Ayakkabı mağazası': 'canta', 'Kuyumcu': 'canta',
  'Elektronik mağazası': 'canta', 'Telefoncu': 'canta',
  'Mobilyacı': 'canta', 'Ev eşyası mağazası': 'canta',
  'Çiçekçi': 'agac', 'Petshop': 'canta', 'Oyuncakçı': 'canta',
  'Spor mağazası': 'canta',
  'Market': 'sepet', 'Süpermarket': 'sepet', 'Bakkal': 'sepet',
  'Semt pazarı': 'sepet', 'Kasap': 'sepet', 'Manav': 'sepet',
  // Egitim
  'Anaokulu': 'mezuniyet', 'İlkokul': 'mezuniyet',
  'Ortaokul': 'mezuniyet', 'Lise': 'mezuniyet', 'Okul': 'mezuniyet',
  'Üniversite': 'mezuniyet', 'Kampüs binası': 'mezuniyet',
  'Eğitim kurumu': 'mezuniyet', 'Dil okulu': 'mezuniyet',
  'Sürücü kursu': 'mezuniyet', 'Müzik okulu': 'nota',
  'Sanat okulu': 'cerceve',
  // Ibadet
  'Cami': 'kubbe', 'Kilise': 'kubbe', 'Sinagog': 'kubbe',
  'İbadet yeri': 'kubbe', 'Mezarlık': 'agac',
  // Saglik
  'Hastane': 'haç', 'Eczane': 'haç', 'Diş kliniği': 'haç',
  'Sağlık merkezi': 'haç', 'Veteriner': 'haç',
  // Ulasim
  'Havalimanı': 'otobus', 'Tren istasyonu': 'otobus',
  'Otogar': 'otobus', 'Metro istasyonu': 'otobus',
  'İskele': 'dalga', 'Ulaşım noktası': 'otobus',
  'Otopark': 'otobus', 'Benzin istasyonu': 'otobus',
  'Dinlenme tesisi': 'fincan',
  // Kamu / hizmet
  'Kamu kurumu': 'bina', 'Kamu hizmeti': 'bina', 'Postane': 'bina',
  'Karakol': 'bina', 'İtfaiye': 'bina', 'Adliye': 'sutun',
  'Konsolosluk': 'bina', 'Toplum merkezi': 'bina',
  'Banka': 'bina', 'ATM': 'bina',
  // Kisisel bakim
  'Kuaför': 'canta', 'Berber': 'canta', 'Güzellik salonu': 'canta',
  'Spa': 'dalga', 'Hamam': 'dalga', 'Tırnak bakımı': 'canta',
  'Dövme stüdyosu': 'cerceve',
}

export function turIkonAdi(tur: string): IkonAdi {
  return TUR_IKONU[tur] ?? 'nokta'
}

/** Ikonlar tek renkli ve cizgisel; kapak zemininin uzerinde duruyorlar. */
export function MekanIkonu({
  tur,
  boyut = 28,
  renk = '#FFFFFF',
}: {
  tur: string
  boyut?: number
  renk?: string
}) {
  const ad = turIkonAdi(tur)
  // Cizgi kalinligi boyutla birlikte artiyor: sabit birakilirsa buyuk
  // ikon soluk, kucuk ikon tikanik gorunuyor.
  const kalinlik = boyut >= 48 ? 1.6 : boyut >= 30 ? 1.8 : 2
  const ortak = {
    stroke: renk,
    strokeWidth: kalinlik,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  }

  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      {ad === 'fincan' && (
        <>
          <Path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" {...ortak} />
          <Path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16" {...ortak} />
          <Line x1="6" y1="3" x2="6" y2="5" {...ortak} />
          <Line x1="10" y1="3" x2="10" y2="5" {...ortak} />
        </>
      )}
      {ad === 'catal' && (
        <>
          <Path d="M7 3v7a2 2 0 0 0 4 0V3" {...ortak} />
          <Line x1="9" y1="10" x2="9" y2="21" {...ortak} />
          <Path d="M17 3c-1.5 1.5-2 3.5-2 5.5S16 12 17 12v9" {...ortak} />
        </>
      )}
      {ad === 'kadeh' && (
        <>
          <Path d="M7 3h10l-1.2 6a4 4 0 0 1-7.6 0L7 3z" {...ortak} />
          <Line x1="12" y1="13" x2="12" y2="20" {...ortak} />
          <Line x1="8" y1="21" x2="16" y2="21" {...ortak} />
        </>
      )}
      {ad === 'ekmek' && (
        <>
          {/* Ekmek somunu: yuvarlak sirt, duz taban, uzerinde uc kesik. */}
          <Path d="M3 13c0-4.4 4-7 9-7s9 2.6 9 7v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4z" {...ortak} />
          <Path d="M8 9.5l-1.5 3M12 9l-1.5 3M16 9.5l-1.5 3" {...ortak} />
        </>
      )}
      {ad === 'dondurma' && (
        <>
          <Path d="M8 10a4 4 0 0 1 8 0" {...ortak} />
          <Path d="M8 10h8l-4 10-4-10z" {...ortak} />
        </>
      )}
      {ad === 'agac' && (
        <>
          <Path d="M12 3l5 7h-3l4 6H6l4-6H7l5-7z" {...ortak} />
          <Line x1="12" y1="16" x2="12" y2="21" {...ortak} />
        </>
      )}
      {ad === 'dalga' && (
        <>
          <Path d="M3 9c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 3-2" {...ortak} />
          <Path d="M3 15c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 3-2" {...ortak} />
        </>
      )}
      {ad === 'cadir' && (
        <>
          <Path d="M12 4L3 20h18L12 4z" {...ortak} />
          <Line x1="12" y1="4" x2="12" y2="20" {...ortak} />
        </>
      )}
      {ad === 'dag' && (
        <Path d="M3 20l6-11 4 6 2-3 6 8H3z" {...ortak} />
      )}
      {ad === 'meydan' && (
        <>
          <Rect x="3" y="6" width="18" height="13" rx="2" {...ortak} />
          <Circle cx="12" cy="12.5" r="2.5" {...ortak} />
        </>
      )}
      {ad === 'sutun' && (
        <>
          <Path d="M3 8l9-5 9 5" {...ortak} />
          <Line x1="6" y1="10" x2="6" y2="17" {...ortak} />
          <Line x1="12" y1="10" x2="12" y2="17" {...ortak} />
          <Line x1="18" y1="10" x2="18" y2="17" {...ortak} />
          <Line x1="3" y1="20" x2="21" y2="20" {...ortak} />
        </>
      )}
      {ad === 'cerceve' && (
        <>
          <Rect x="3" y="4" width="18" height="16" rx="2" {...ortak} />
          <Path d="M7 16l3.5-4.5L13 15l2-2.5L17 16" {...ortak} />
        </>
      )}
      {ad === 'bina' && (
        <>
          <Rect x="5" y="3" width="14" height="18" rx="1.5" {...ortak} />
          <Line x1="9" y1="7" x2="9" y2="7.01" {...ortak} />
          <Line x1="15" y1="7" x2="15" y2="7.01" {...ortak} />
          <Line x1="9" y1="11" x2="9" y2="11.01" {...ortak} />
          <Line x1="15" y1="11" x2="15" y2="11.01" {...ortak} />
          <Path d="M10 21v-4h4v4" {...ortak} />
        </>
      )}
      {ad === 'kitap' && (
        <>
          <Path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22V4.5z" {...ortak} />
          <Line x1="8" y1="7" x2="16" y2="7" {...ortak} />
        </>
      )}
      {ad === 'film' && (
        <>
          <Rect x="3" y="4" width="18" height="16" rx="2" {...ortak} />
          <Line x1="7" y1="4" x2="7" y2="20" {...ortak} />
          <Line x1="17" y1="4" x2="17" y2="20" {...ortak} />
        </>
      )}
      {ad === 'nota' && (
        <>
          <Path d="M9 18V5l10-2v13" {...ortak} />
          <Circle cx="6.5" cy="18" r="2.5" {...ortak} />
          <Circle cx="16.5" cy="16" r="2.5" {...ortak} />
        </>
      )}
      {ad === 'dambil' && (
        <>
          <Line x1="6" y1="8" x2="6" y2="16" {...ortak} />
          <Line x1="18" y1="8" x2="18" y2="16" {...ortak} />
          <Line x1="3" y1="10" x2="3" y2="14" {...ortak} />
          <Line x1="21" y1="10" x2="21" y2="14" {...ortak} />
          <Line x1="6" y1="12" x2="18" y2="12" {...ortak} />
        </>
      )}
      {ad === 'stadyum' && (
        <>
          <Circle cx="12" cy="12" r="9" {...ortak} />
          <Path d="M12 3v18M3 12h18" {...ortak} />
        </>
      )}
      {ad === 'havuz' && (
        <>
          <Path d="M3 16c2 0 2 2 4.5 2s2.5-2 4.5-2 2.5 2 4.5 2 2.5-2 4.5-2" {...ortak} />
          <Path d="M7 14V5a2 2 0 0 1 4 0M13 14V5a2 2 0 0 1 4 0" {...ortak} />
        </>
      )}
      {ad === 'yatak' && (
        <>
          <Path d="M3 18v-9M3 12h18a2 2 0 0 1 2 2v4" {...ortak} />
          <Circle cx="7.5" cy="9.5" r="2" {...ortak} />
          <Path d="M11 12V9a1 1 0 0 1 1-1h6a2 2 0 0 1 2 2v2" {...ortak} />
        </>
      )}
      {ad === 'canta' && (
        <>
          <Path d="M5 8h14l-1 12H6L5 8z" {...ortak} />
          <Path d="M9 8V6a3 3 0 0 1 6 0v2" {...ortak} />
        </>
      )}
      {ad === 'sepet' && (
        <>
          <Path d="M4 9h16l-1.5 10H5.5L4 9z" {...ortak} />
          <Path d="M9 9L7 4M15 9l2-5" {...ortak} />
        </>
      )}
      {ad === 'mezuniyet' && (
        <>
          <Path d="M2 9l10-4 10 4-10 4L2 9z" {...ortak} />
          <Path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" {...ortak} />
        </>
      )}
      {ad === 'kubbe' && (
        <>
          <Path d="M5 21V11a7 7 0 0 1 14 0v10" {...ortak} />
          <Line x1="12" y1="4" x2="12" y2="2" {...ortak} />
          <Line x1="3" y1="21" x2="21" y2="21" {...ortak} />
          <Path d="M10 21v-4a2 2 0 0 1 4 0v4" {...ortak} />
        </>
      )}
      {ad === 'haç' && (
        <Path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3z" {...ortak} />
      )}
      {ad === 'otobus' && (
        <>
          <Rect x="4" y="4" width="16" height="12" rx="2" {...ortak} />
          <Line x1="4" y1="11" x2="20" y2="11" {...ortak} />
          <Circle cx="8" cy="19" r="1.6" {...ortak} />
          <Circle cx="16" cy="19" r="1.6" {...ortak} />
        </>
      )}
      {ad === 'nokta' && (
        <>
          <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" {...ortak} />
          <Circle cx="12" cy="10" r="2.6" {...ortak} />
        </>
      )}
    </Svg>
  )
}
