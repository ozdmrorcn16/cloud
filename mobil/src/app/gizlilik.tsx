import { ScrollView, Text, View, StyleSheet } from 'react-native'

// Kaynak metin: docs/gizlilik-metni.md. Icerik uzak bir kaynaktan
// CEKILMEZ, kod icinde sabit tutulur - gizlilik metni ag baglantisi
// olmadan da okunabilmeli.
//
// Bu dizi kaynak dosyanin yedi maddesindeki HER OLGUSAL IDDIAYI tasir.
// Duzeltme turu 2'den itibaren her md bulleti/onemli cumlesi KENDI
// paragrafi olarak buraya birebir tasiniyor (onceki turde birkac
// bulleti tek paragrafta ozetlemek, o ozetin bir cumleyi - en degerli
// olani, "sayac 0'dan 1'e ciktiginda..." cikarim uyarisini - sessizce
// dusurmesine yol acmisti). Ikisi ayrisirsa hangisinin dogru oldugu
// belirsizlesir - docs/gizlilik-metni.md degisirse bu dizi de AYNI
// TURDA guncellenmeli.
//
// Duzeltme gecmisi: docs/gizlilik-metni.md basindaki "Duzeltme
// gecmisi" notuna bak (tur 1 ve tur 2, kod incelemesi).
export const BOLUMLER: { baslik: string; paragraflar: string[] }[] = [
  {
    baslik: '1. Hangi verilerini isliyoruz',
    paragraflar: [
      'Telefon numaran (hesap ve dogrulama icin).',
      'Adin, kullanici adin, dogum tarihin, biyografin, profil fotograflarin.',
      'Konumun - UC farkli sekilde: mekan ararken ve mekan eklerken cihaz konumun sunucuya gonderilir ama saklanmaz; check-in aktifken koordinatin saklanir, check-in aniya donusunce (en fazla ~4 saat sonra, ya da hemen "ayrildim" dediginde) koordinat silinir ve geriye yalnizca hangi mekanda oldugun kalir (tam ayrinti asagida, 3. maddede).',
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
      'Kotuye kullanimi (taciz, sahte hesap, uygunsuz icerik) onlemek ve incelemek.',
    ],
  },
  {
    baslik: '3. Konum ozel olarak',
    paragraflar: [
      'Cihazinin konumu UC farkli sekilde kullanilir; bunlari karistirmamak onemli.',
      'Mekan ararken: yakinindaki mekanlari gosterebilmemiz icin cihazinin konumu her mekan aramasinda sunucuya GONDERILIR. Bu konum SAKLANMAZ - yalnizca o anki sorguyu cevaplamak icin kullanilir, veritabaninda bir yere yazilmaz.',
      'Yeni bir mekan eklerken: eklemek istedigin mekana gercekten yakin oldugunu dogrulamak icin cihazinin konumu gonderilir (~200 metre icinde olman gerekir). Bu konum da SAKLANMAZ - yalnizca bu yakinlik kontrolu icin kullanilir. Saklanan tek sey eklenen mekanin konumudur, senin o andaki konumun degil.',
      'Check-in yaptiginda: check-in AKTIFKEN koordinatin saklanir. Ama bu gecici: check-in en fazla ~4 saat sonra (ya da hemen "ayrildim" dediginde) otomatik olarak aniya donusur, ve bu donusumde koordinat SILINIR (veritabaninda null\'a cekilir) - geriye yalnizca hangi mekanda oldugun kalir, tam koordinat degil.',
      'Check-in aktifken saklanan koordinat, check-in icin sectigin bulunurluk kademesine gore paylasilir: herkese acik, sadece takipcilerim ya da gizli.',
      'Gizli sectiginde kimligin kimseye gorunmez - moderasyon disinda. Ama bir istisna var: bulundugun mekanin herkese acik "kac kisi var" sayacina (yogunluk) bulunurluk kademenden BAGIMSIZ olarak dahil olursun. Yani kimligin gizli kalir, ama sayac senin varliginla artar - sakin bir mekanda sayac 0\'dan 1\'e ciktiginda oradaki biri "birisi var" bilgisini cikarabilir.',
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
      'Bugun gecerli olan otomatik silme/temizleme kurallari birden fazla (tek bir kural degil).',
      'Suresi dolmus (90 gunden eski) hesap askiya alma kayitlari her gun otomatik olarak veritabanindan silinir (tam silme, arsivlenmez). Bu kayitlarin baska bir yerde saklanan bir kopyasi bugun yoktur.',
      'Takip/sohbet istegi gunluk tavanini hesaplamak icin tutulan kayitlar 2 gunden eski satirlar her gun otomatik silinir.',
      'Check-in koordinatin (3. maddede anlatildigi gibi) check-in aniya donustugunde otomatik olarak silinir - en fazla ~4 saat sonra.',
      'Anilarin (check-in gecmisinin geri kalani), mesajlarin ve sikayetler icin bugun tam bir otomatik silme islemi yoktur - suresiz saklanirlar. "Gerekli oldugu sure kadar saklama" ilkesinin tam karsiligi henuz tamamlanmadi.',
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
