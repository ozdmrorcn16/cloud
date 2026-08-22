import { ScrollView, Text, View, StyleSheet } from 'react-native'

// Kaynak metin: docs/gizlilik-metni.md. Icerik uzak bir kaynaktan
// CEKILMEZ, kod icinde sabit tutulur - gizlilik metni ag baglantisi
// olmadan da okunabilmeli. Bu dizi o dosyanin yedi maddesini birebir
// yansitir; dosya guncellenirse burasi da elle guncellenmeli.
const BOLUMLER: { baslik: string; paragraflar: string[] }[] = [
  {
    baslik: '1. Hangi verilerini isliyoruz',
    paragraflar: [
      'Telefon numaran, adin, kullanici adin, dogum tarihin, biyografin ve profil fotograflarin.',
      'Konumun - yalnizca check-in yaptiginda.',
      'Gonderdigin ve aldigin mesajlarin icerigi.',
      'Bag bilgin: kimi takip ettigin, sohbet istegi alisverisi, kimi engelledigin.',
      'Bildirim gonderebilmemiz icin cihazinin bildirim jetonu.',
      'Sikayet ettigin ya da hakkinda sikayet edilen bilgiler.',
    ],
  },
  {
    baslik: '2. Ne amacla isliyoruz',
    paragraflar: [
      'Hesabini kurmak ve telefon numarani dogrulamak.',
      'Yakinindaki kisileri kesfetmeni saglamak.',
      'Mesajlasmani saglamak.',
      'Kotuye kullanimi onlemek ve incelemek.',
    ],
  },
  {
    baslik: '3. Konum ozel olarak',
    paragraflar: [
      'Konumun yalnizca check-in yaptiginda paylasilir; check-in yapmadigin surece hicbir konum bilgin islenmez.',
      'Paylasilan konum, o check-in icin sectigin bulunurluk kademesine gore gorunur: herkese acik, sadece takipcilerim ya da gizli.',
      'Gizli sectiginde konumun kimseye gorunmez - moderasyon disinda (bkz. asagidaki madde).',
    ],
  },
  {
    baslik: '4. Moderasyon erisimi',
    paragraflar: [
      'Bir sikayet aldiginda ya da kotuye kullanim suphesiyle incelenirken, moderasyon ekibimiz profilini, check-inlerini ve mesaj iceriklerini okuyabilir. Bu, bulunurluk kademen gizli olsa da gecerlidir.',
      'Moderasyonun her erisimi kaydedilir: kim, ne zaman, hangi kaydina baktigi denetim izinde tutulur.',
    ],
  },
  {
    baslik: '5. Yurt disina aktarim',
    paragraflar: [
      'Supabase (veritabani ve dosya depolama) sunuculari Almanya\'da (eu-central-1 bolgesi). Butun kisisel verin Turkiye disinda, Avrupa Birligi sinirlari icinde tutulur.',
      'Expo Push API (bildirim gonderimi) sunuculari Amerika Birlesik Devletleri\'nde. Bildirim gonderirken cihazinin bildirim jetonu buradan gecer. Bildirim icerik tasimaz.',
    ],
  },
  {
    baslik: '6. Saklama sureleri',
    paragraflar: [
      'Anilarin, mesajlarin ve sikayetler ilke olarak gerekli oldugu sure kadar saklanir; kalici bir imha takvimi henuz tamamlanmadi.',
      'Moderasyon erisim kayitlari 2 yil, karara baglanmis sikayetler karardan 1 yil sonra, suresi dolmus askiya alma kayitlari 90 gun sonra silinir.',
      'Hesabini silersen: profilin, anilarin, baglarin ve konusma listen kalici olarak silinir. Mesajlarin silinmez ama gonderen kimligin koparilir; sikayetler de silinmez ama kimlik bagi kopar. Profil ve check-in fotograflarin depolama alanindan silinir.',
    ],
  },
  {
    baslik: '7. Haklarin',
    paragraflar: [
      'Hesabini dondurabilirsin. Verilerin silinmez, gorunmez hale gelirsin; tekrar giris yaptiginda hesabin kendiliginden aktif olur.',
      'Hesabini kalici olarak silebilirsin. Geri donusu yoktur; yeniden gelmek istersen sifirdan hesap acman gerekir.',
      'Verilerinin bir kopyasini talep edebilirsin; bu talep icin bize ulasman gerekir.',
      'Basvuru yolu: uygulama icindeki destek/sikayet akisi uzerinden ya da hesabinla iliskili iletisim bilgin uzerinden bize ulasabilirsin.',
    ],
  },
]

export default function GizlilikEkrani() {
  return (
    <ScrollView style={stiller.kaydirici} contentContainerStyle={stiller.icerik}>
      <Text style={stiller.baslik}>Gizlilik metni</Text>
      {BOLUMLER.map((bolum) => (
        <View key={bolum.baslik} style={stiller.bolum}>
          <Text style={stiller.bolumBasligi}>{bolum.baslik}</Text>
          {bolum.paragraflar.map((paragraf) => (
            <Text key={paragraf} style={stiller.paragraf}>
              {paragraf}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

const stiller = StyleSheet.create({
  kaydirici: { flex: 1 },
  icerik: { padding: 24, gap: 8 },
  baslik: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  bolum: { marginTop: 16, gap: 6 },
  bolumBasligi: { fontSize: 16, fontWeight: '600' },
  paragraf: { fontSize: 14, lineHeight: 20 },
})
