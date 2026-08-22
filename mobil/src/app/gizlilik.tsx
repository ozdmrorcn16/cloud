import { ScrollView, Text, View, StyleSheet } from 'react-native'

// Kaynak metin: docs/gizlilik-metni.md. Icerik uzak bir kaynaktan
// CEKILMEZ, kod icinde sabit tutulur - gizlilik metni ag baglantisi
// olmadan da okunabilmeli.
//
// Bu dizi kaynak dosyanin yedi maddesindeki HER OLGUSAL IDDIAYI tasir
// (bicim mobil ekran icin kisaltilmis olabilir, ama hicbir iddia
// dusurulmez ya da degistirilmez). Ikisi ayrisirsa hangisinin dogru
// oldugu belirsizlesir - docs/gizlilik-metni.md degisirse bu dizi de
// AYNI TURDA guncellenmeli.
//
// Duzeltme turu 1 (kod incelemesi): ilk surum birkac yerde yanlis ya
// da eksik beyanda bulunuyordu - ayrinti docs/gizlilik-metni.md
// basindaki nota bak.
// export: test dosyasi (gizlilik.test.tsx) yapisal bir emniyet olarak
// BOLUMLER.length === 7 kontrol ediyor - yalnizca uc metin regex'i
// bakan bir suite, bir bolum yanlislikla silinse bile yesil kalirdi.
export const BOLUMLER: { baslik: string; paragraflar: string[] }[] = [
  {
    baslik: '1. Hangi verilerini isliyoruz',
    paragraflar: [
      'Telefon numaran, adin, kullanici adin, dogum tarihin, biyografin ve profil fotograflarin.',
      'Konumun - mekan ararken sunucuya gonderilir ama saklanmaz; check-in yaptiginda ise kalici olarak saklanir (ayrinti asagida, 3. maddede).',
      'Gonderdigin ve aldigin mesajlarin icerigi.',
      'Bag bilgin: kimi takip ettigin, kimlerle sohbet istegi alisverisinde bulundugun, kimi engelledigin.',
      'Bildirim gonderebilmemiz icin cihazinin bildirim jetonu.',
      'Sikayet ettigin ya da hakkinda sikayet edilen bilgiler.',
    ],
  },
  {
    baslik: '2. Ne amacla isliyoruz',
    paragraflar: [
      'Hesabini kurmak ve telefon numarani dogrulamak.',
      'Yakinindaki mekanlari ve kisileri kesfetmeni saglamak.',
      'Mesajlasmani saglamak.',
      'Kotuye kullanimi onlemek ve incelemek.',
    ],
  },
  {
    baslik: '3. Konum ozel olarak',
    paragraflar: [
      'Cihazinin konumu iki farkli sekilde kullanilir. Mekan ararken: yakinindaki mekanlari gosterebilmemiz icin konumun her aramada sunucuya GONDERILIR ama SAKLANMAZ - yalnizca o sorguyu cevaplamak icin kullanilir, veritabaninda tutulmaz.',
      'Check-in yaptiginda ise konumun KALICI olarak saklanir. Bu saklanan konum, sectigin bulunurluk kademesine gore paylasilir: herkese acik, sadece takipcilerim ya da gizli.',
      'Gizli sectiginde kimligin kimseye gorunmez - moderasyon disinda (bkz. 4. madde). Ama bulundugun mekanin herkese acik kisi sayacina bulunurluk kademenden bagimsiz olarak dahil olursun: kimligin gizli kalir, ama sayac senin varliginla artar.',
    ],
  },
  {
    baslik: '4. Moderasyon erisimi',
    paragraflar: [
      "Bir sikayet aldiginda ya da kotuye kullanim suphesiyle incelenirken, moderasyon ekibimiz profilini, check-in'lerini ve mesaj iceriklerini okuyabilir. Bu, bulunurluk kademen gizli olsa da gecerlidir.",
      'Moderasyonun her erisimi kaydedilecek: kim, ne zaman, hangi kaydina baktigi bir denetim izinde tutulacak. Bu denetim izinin kendisi bugun henuz kurulmadi, moderasyon paneliyle birlikte gelecek.',
    ],
  },
  {
    baslik: '5. Yurt disina aktarim',
    paragraflar: [
      "Supabase (veritabani ve dosya depolama) sunuculari Almanya'da (eu-central-1 bolgesi). Butun kisisel verin Turkiye disinda, Avrupa Birligi sinirlari icinde tutulur.",
      "Expo Push API (bildirim gonderimi) sunuculari Amerika Birlesik Devletleri'nde. Bildirim gonderirken cihazinin bildirim jetonu, kime gonderildigi bilgisi ve bildirimi tetikleyen kisinin adi buradan gecer (ornegin 'Deniz sana mesaj gonderdi' gibi). Mesajin metni bildirime hicbir zaman eklenmez, ama bir baskasinin adi da kisisel veridir ve bu aktarimin bir parcasidir.",
    ],
  },
  {
    baslik: '6. Saklama sureleri',
    paragraflar: [
      'Bugun gecerli olan tek otomatik silme kurali: suresi dolmus (90 gunden eski) hesap askiya alma kayitlari her gun otomatik olarak veritabanindan tamamen silinir; baska bir yerde saklanan bir kopyasi bugun yoktur.',
      'Anilarin, mesajlarin ve sikayetler icin bugun herhangi bir otomatik silme islemi yoktur - suresiz saklanirlar; bu KVKK uyum listemizde acik bir madde olarak durur.',
      'Planlanan (henuz uygulanmadi): moderasyon erisim kayitlarinin 2 yil, karara baglanmis sikayetlerin karardan 1 yil sonra silinmesi - bu, moderasyon paneliyle birlikte gelecek ve bugun icin gecerli degildir.',
      'Hesabini silersen: profilin, anilarin, baglarin ve konusma listen kalici olarak silinir. Gonderdigin mesajlar silinmez ama gonderen kimligin koparilir. Senin actigin sikayetlerde kimlik bagi kopar; hakkinda acilan sikayetlerde ise kimlik bagi KOPMAZ, hedef kimligi moderasyon kaydinda kalir. Profil ve check-in fotograflarin depolama alanindan silinir.',
    ],
  },
  {
    baslik: '7. Haklarin',
    paragraflar: [
      'Hesabini dondurabilirsin. Verilerin silinmez, gorunmez hale gelirsin; tekrar giris yaptiginda hesabin kendiliginden aktif olur.',
      'Hesabini kalici olarak silebilirsin. Geri donusu yoktur; yeniden gelmek istersen sifirdan hesap acman gerekir.',
      'Verilerinin bir kopyasini talep edebilirsin; bu talep icin bize ulasman gerekir.',
      'Basvuru yolu: bugun icin somut bir destek kanali (e-posta, form) yayinda degil - bu, yayin oncesi eklenmesi gereken acik bir bosluktur.',
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
