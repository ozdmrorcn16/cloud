import { ScrollView, Text, View, StyleSheet } from 'react-native'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../tasarim/tema'
import { UstCubuk } from '../tasarim/UstCubuk'

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
// Ekran metinleri karar 74 geregi duzgun Turkce (aksanli) yazilir;
// ASCII kurali yalnizca kod, yorum ve commit metinleri icindir.
//
// Duzeltme gecmisi: docs/gizlilik-metni.md basindaki "Duzeltme
// gecmisi" notuna bak (tur 1 ve tur 2, kod incelemesi).
export const BOLUMLER: { baslik: string; paragraflar: string[] }[] = [
  {
    baslik: '1. Hangi verilerini işliyoruz',
    paragraflar: [
      'Telefon numaran (hesap ve doğrulama için).',
      'Adın, kullanıcı adın, doğum tarihin, biyografin, profil fotoğrafların.',
      'Konumun - üç farklı şekilde: mekan ararken ve mekan eklerken cihaz konumun sunucuya gönderilir ama saklanmaz; check-in aktifken koordinatın saklanır, check-in anıya dönüşünce (en fazla ~30 dakika sonra, ya da hemen "ayrıldım" dediğinde) koordinat silinir ve geriye yalnızca hangi mekanda olduğun kalır (tam ayrıntı aşağıda, 3. maddede).',
      'Gönderdiğin ve aldığın mesajların içeriği.',
      'Bağ bilgin: kimi takip ettiğin, kimlerle sohbet isteği alışverişinde bulunduğun, kimi engellediğin.',
      'Bildirim göndermemiz için cihazının bildirim jetonu.',
      'Şikayet ettiğin ya da hakkında şikayet edilen bilgiler.',
    ],
  },
  {
    baslik: '2. Ne amaçla işliyoruz',
    paragraflar: [
      'Hesabını kurmak ve telefon numaranı doğrulamak.',
      'Yakınındaki mekanları ve kişileri keşfetmeni sağlamak.',
      'Mesajlaşmanı sağlamak.',
      'Kötüye kullanımı (taciz, sahte hesap, uygunsuz içerik) önlemek ve incelemek.',
    ],
  },
  {
    baslik: '3. Konum özel olarak',
    paragraflar: [
      'Cihazının konumu ÜÇ farklı şekilde kullanılır; bunları karıştırmamak önemli.',
      'Mekan ararken: yakınındaki mekanları gösterebilmemiz için cihazının konumu her mekan aramasında sunucuya GÖNDERİLİR. Bu konum SAKLANMAZ - yalnızca o anki sorguyu cevaplamak için kullanılır, veritabanında bir yere yazılmaz.',
      'Yeni bir mekan eklerken: eklemek istediğin mekana gerçekten yakın olduğunu doğrulamak için cihazının konumu gönderilir (~200 metre içinde olman gerekir). Bu konum da SAKLANMAZ - yalnızca bu yakınlık kontrolü için kullanılır. Saklanan tek şey eklenen mekanın konumudur, senin o andaki konumun değil.',
      'Check-in yaptığında: check-in AKTİFKEN koordinatın saklanır. Ama bu geçici: check-in en fazla ~30 dakika sonra (ya da hemen "ayrıldım" dediğinde) otomatik olarak anıya dönüşür, ve bu dönüşümde koordinat SİLİNİR (veritabanında null\'a çekilir) - geriye yalnızca hangi mekanda olduğun kalır, tam koordinat değil.',
      'Check-in aktifken saklanan koordinat, check-in için seçtiğin bulunurluk kademesine göre paylaşılır (bu, CANLI check-in içindir): Herkese açık - uygulamadaki herkes DEĞİL, yalnızca aynı mekanda o an canlı check-in\'i olanlar ya da karşılıklı takiplerin görür. Sadece takipçilerim - yalnızca karşılıklı takiplerin görür. Gizli - kimse görmez, check-in yalnızca kendi geçmişinde kalır.',
      'Check-in anıya dönüştükten sonra (konum silindikten sonra), anının görünürlüğü AYRI bir üç kademedir ve "aynı mekanda canlı olma" şartı yoktur: Herkese açık - uygulamadaki herkes görür (aktif hesaplar, engelleme hariç). Sadece takipçilerim - yalnızca karşılıklı takiplerin görür. Kimse - yalnızca kendi profilinde sen görürsün.',
      'Gizli seçtiğinde kimliğin kimseye görünmez - moderasyon dışında. Ama bir istisna var: bulunduğun mekanın herkese açık "kaç kişi var" sayacına (yoğunluk) bulunurluk kademenden BAĞIMSIZ olarak dahil olursun. Yani kimliğin gizli kalır, ama sayaç senin varlığınla artar - sakin bir mekanda sayaç 0\'dan 1\'e çıktığında oradaki biri "birisi var" bilgisini çıkarabilir.',
    ],
  },
  {
    baslik: '4. Moderasyon erişimi',
    paragraflar: [
      "Bir şikayet aldığında ya da kötüye kullanım şüphesiyle incelenirken, moderasyon ekibimiz profilini, check-in'lerini ve mesaj içeriklerini okuyabilir. Bu, bulunurluk kademen gizli olsa da geçerlidir.",
      'Moderasyonun her erişimi kaydedilecek: kim, ne zaman, hangi kaydına baktığı bir denetim izinde tutulacak. Bu denetim izinin kendisi bugün henüz kurulmadı, moderasyon paneliyle birlikte gelecek.',
    ],
  },
  {
    baslik: '5. Yurt dışına aktarım',
    paragraflar: [
      "Supabase (veritabanı ve dosya depolama) sunucuları Almanya'da (eu-central-1 bölgesi). Bütün kişisel verin Türkiye dışında, Avrupa Birliği sınırları içinde tutulur.",
      "Expo Push API (bildirim gönderimi) sunucuları Amerika Birleşik Devletleri'nde. Bildirim gönderirken cihazının bildirim jetonu, kime gönderildiği bilgisi ve bildirimi tetikleyen kişinin adı buradan geçer (örneğin 'Deniz sana mesaj gönderdi' gibi). Mesajın metni bildirime hiçbir zaman eklenmez, ama bir başkasının adı da kişisel veridir ve bu aktarımın bir parçasıdır.",
      "Harita zemini iOS'ta Apple Haritalar, Android'de Google Haritalar tarafından sağlanır. Harita çizilirken ekranda görünen bölgenin koordinatları bu sağlayıcıya gider; kimliğin, hesabın ya da check-in'lerin gitmez. Web sürümünde gerçek harita yoktur, bu aktarım da olmaz.",
      "Bir mekanın konum ekranını açtığında, o mekanın koordinatı aynı sağlayıcıya gönderilip tam adrese çevrilir (mahalle, cadde, kapı numarası, ilçe/il). Gönderilen şey mekanın konumudur, senin bulunduğun yer değil; sorgu yalnızca o ekranı açtığında yapılır. Web sürümünde bu çeviri desteklenmez, orada mekanın yalnızca semti görünür.",
    ],
  },
  {
    baslik: '6. Saklama süreleri',
    paragraflar: [
      'Bugün geçerli olan otomatik silme/temizleme kuralları birden fazla (tek bir kural değil).',
      'Süresi dolmuş (90 günden eski) hesap askıya alma kayıtları her gün otomatik olarak veritabanından silinir (tam silme, arşivlenmez). Bu kayıtların başka bir yerde saklanan bir kopyası bugün yoktur.',
      'Takip/sohbet isteği günlük tavanını hesaplamak için tutulan kayıtlarda 2 günden eski satırlar her gün otomatik silinir.',
      'Check-in koordinatın (3. maddede anlatıldığı gibi) check-in anıya dönüştüğünde otomatik olarak silinir - en fazla ~30 dakika sonra.',
      'Anılarının (check-in geçmişinin geri kalanı), mesajlarının ve şikayetlerin bugün tam bir otomatik silme işlemi yoktur - süresiz saklanırlar. "Gerekli olduğu süre kadar saklama" ilkesinin tam karşılığı henüz tamamlanmadı.',
      'Planlanan (henüz uygulanmadı): moderasyon erişim kayıtlarının 2 yıl, karara bağlanmış şikayetlerin karardan 1 yıl sonra silinmesi - bu, moderasyon paneliyle birlikte gelecek ve bugün için geçerli değildir.',
      'Hesabını silersen: profilin, anıların, bağların ve konuşma listen kalıcı olarak silinir. Gönderdiğin mesajlar silinmez ama gönderen kimliğin koparılır. Senin açtığın şikayetlerde kimlik bağı kopar; hakkında açılan şikayetlerde ise kimlik bağı KOPMAZ, hedef kimliği moderasyon kaydında kalır. Profil ve check-in fotoğrafların depolama alanından silinir.',
    ],
  },
  {
    baslik: '7. Hakların',
    paragraflar: [
      'Hesabını dondurabilirsin. Verilerin silinmez, görünmez hale gelirsin; tekrar giriş yaptığında hesabın kendiliğinden aktif olur.',
      'Hesabını kalıcı olarak silebilirsin. Geri dönüşü yoktur; yeniden gelmek istersen sıfırdan hesap açman gerekir.',
      'Verilerinin bir kopyasını talep edebilirsin; bu talep için bize ulaşman gerekir.',
      'Başvuru yolu: bugün için somut bir destek kanalı (e-posta, form) yayında değil - bu, yayın öncesi eklenmesi gereken açık bir boşluktur.',
    ],
  },
]

export default function GizlilikEkrani() {
  return (
    <ScrollView style={stiller.kaydirici} contentContainerStyle={stiller.icerik}>
      <UstCubuk baslik="Gizlilik metni" geriEtiketi="Geri" />
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
  kaydirici: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: bosluk.xl,
    gap: bosluk.s,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginBottom: bosluk.s,
  },
  bolum: { marginTop: bosluk.l, gap: bosluk.xs },
  bolumBasligi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  paragraf: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 23,
    color: renk.metinIkincil,
  },
})
