import { ScrollView, Text, View, StyleSheet } from 'react-native'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../tasarim/tema'
import { useRenk, useStiller } from '../tasarim/tema-baglami'
import { UstCubuk } from '../tasarim/UstCubuk'

// Kaynak metin: docs/gizlilik-metni.md. Icerik uzak bir kaynaktan
// CEKILMEZ, kod icinde sabit tutulur - gizlilik metni ag baglantisi
// olmadan da okunabilmeli.
//
// Bu dizi kaynak dosyanin "Veri sorumlusu" bolumu ve yedi maddesindeki
// HER OLGUSAL IDDIAYI tasir.
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
    baslik: 'Veri sorumlusu',
    paragraflar: [
      "Bu uygulamanın veri sorumlusu, gerçek kişi olarak Orçun Özdemir'dir. KVKK kapsamındaki başvurularını destek@slooin.com adresine iletebilirsin; başvurun en geç 30 gün içinde yanıtlanır.",
    ],
  },
  {
    baslik: '1. Hangi verilerini işliyoruz',
    paragraflar: [
      'E-posta adresin - bugün hesabının BİRİNCİL kimliği. Hesap açarken ve giriş yaparken kullanılır, doğrulama kodu buraya gönderilir.',
      "Telefon numaran - YALNIZCA ESKİ HESAPLARDA. Kayıt ve giriş 2026 Eylül'ünde e-postaya taşındı; daha önce telefonla açılmış hesaplar çalışmaya devam ettiği için numara o hesaplarda kayıtlı kalır. Yeni bir hesap açarken telefon numarası istenmez.",
      'Adın, kullanıcı adın, doğum tarihin, biyografin, profil fotoğrafların.',
      'Konumun - üç farklı şekilde: mekan ararken ve mekan eklerken cihaz konumun sunucuya gönderilir ama saklanmaz; check-in aktifken koordinatın saklanır, check-in anıya dönüşünce (1 saat sonra ya da hemen "ayrıldım" dediğinde) koordinat silinir ve geriye yalnızca hangi mekanda olduğun kalır (tam ayrıntı aşağıda, 3. maddede).',
      'Gönderdiğin ve aldığın mesajların içeriği.',
      'Arkadaşlık bilgin: kimi takip ettiğin, kimlerle sohbet isteği alışverişinde bulunduğun, kimi engellediğin.',
      'Bildirim göndermemiz için cihazının bildirim jetonu.',
      'Şikayet ettiğin ya da hakkında şikayet edilen bilgiler.',
    ],
  },
  {
    baslik: '2. Ne amaçla işliyoruz - ve hangi hukuki sebeple',
    paragraflar: [
      'KVKK m.10, işleme amacının yanında hukuki sebebin de bildirilmesini ister. Her amacın dayanağı ayrı ayrı yazılıdır.',
      'Hesabını kurmak ve e-posta adresini doğrulamak (eski hesaplarda telefon numaranı). Hukuki sebep: sözleşmenin ifası (KVKK m.5/2-c) - hesap olmadan uygulamanın hiçbir işlevi çalışmaz.',
      "Yakınındaki mekanları ve kişileri keşfetmeni sağlamak (konum ve check-in). Hukuki sebep: sözleşmenin ifası (KVKK m.5/2-c). Slooin'in yaptığı tek şey bir yere check-in yapman ve orada kimin olduğunu görmendir; konum işlenmeden uygulama çalışmaz, yani konum ayrı bir \"ek özellik\" değil hizmetin kendisidir.",
      'Mesajlaşmanı sağlamak. Hukuki sebep: sözleşmenin ifası (KVKK m.5/2-c).',
      'Kötüye kullanımı (taciz, sahte hesap, uygunsuz içerik) önlemek ve incelemek - şikayet kayıtları, moderasyon denetim izi, hesap durumu kayıtları ve istek tavanı sayaçları. Hukuki sebep: meşru menfaat (KVKK m.5/2-f): kullanıcıları taciz ve kötüye kullanımdan koruyabilmek.',
      'Hesap açarken "Devam"a bastığında verdiğin kabul, bir ispat kaydı olarak veritabanına yazılır: aydınlatma metnini okuduğun ve konum verinin işlenmesini kabul ettiğin, hangi metin sürümü için ve ne zaman onay verdiğinle birlikte kaydedilir (aydinlatma ve konum_rizasi olmak üzere iki kayıt). Bu kayıt yukarıdaki hukuki sebeplerin yerine geçmez - onların üstüne, sana neyin bildirildiğini geriye dönük gösterebilmek için tutulur.',
    ],
  },
  {
    baslik: '3. Konum özel olarak',
    paragraflar: [
      'Cihazının konumu ÜÇ farklı şekilde kullanılır; bunları karıştırmamak önemli.',
      'Mekan ararken: yakınındaki mekanları gösterebilmemiz için cihazının konumu her mekan aramasında sunucuya GÖNDERİLİR. Bu konum SAKLANMAZ - yalnızca o anki sorguyu cevaplamak için kullanılır, veritabanında bir yere yazılmaz.',
      'Yeni bir mekan eklerken: eklemek istediğin mekana gerçekten yakın olduğunu doğrulamak için cihazının konumu gönderilir (~200 metre içinde olman gerekir). Bu konum da SAKLANMAZ - yalnızca bu yakınlık kontrolü için kullanılır. Saklanan tek şey eklenen mekanın konumudur, senin o andaki konumun değil.',
      'Check-in yaptığında: check-in AKTİFKEN koordinatın saklanır. Ama bu geçici: check-in 1 SAAT sonra (ya da hemen "ayrıldım" dediğinde) otomatik olarak anıya dönüşür, ve bu dönüşümde koordinat SİLİNİR (veritabanında null\'a çekilir) - geriye yalnızca hangi mekanda olduğun kalır, tam koordinat değil. Temizlik işi 10 dakikada bir çalıştığı için koordinat en fazla yaklaşık 1 saat 10 dakika saklanır.',
      'Check-in aktifken saklanan koordinat, check-in için seçtiğin bulunurluk kademesine göre paylaşılır (bu, CANLI check-in içindir): Herkese açık - uygulamadaki herkes DEĞİL, yalnızca aynı mekanda o an canlı check-in\'i olanlar ya da karşılıklı takiplerin görür. Sadece takipçilerim - yalnızca karşılıklı takiplerin görür. Gizli - kimse görmez, check-in yalnızca kendi geçmişinde kalır.',
      'Check-in anıya dönüştükten sonra (konum silindikten sonra), anının görünürlüğü AYRI bir üç kademedir ve "aynı mekanda canlı olma" şartı yoktur: Herkese açık - uygulamadaki herkes görür (aktif hesaplar, engelleme hariç). Sadece takipçilerim - yalnızca karşılıklı takiplerin görür. Kimse - yalnızca kendi profilinde sen görürsün.',
      'Gizli seçtiğinde kimliğin kimseye görünmez - moderasyon dışında. Ama bir istisna var: bulunduğun mekanın herkese açık "kaç kişi var" sayacına (yoğunluk) bulunurluk kademenden BAĞIMSIZ olarak dahil olursun. Yani kimliğin gizli kalır, ama sayaç senin varlığınla artar - sakin bir mekanda sayaç 0\'dan 1\'e çıktığında oradaki biri "birisi var" bilgisini çıkarabilir.',
    ],
  },
  {
    baslik: '4. Moderasyon erişimi',
    paragraflar: [
      "Bir şikayet aldığında ya da kötüye kullanım şüphesiyle incelenirken, moderasyon ekibimiz profilini, check-in'lerini ve mesaj içeriklerini okuyabilir. Bu, bulunurluk kademen gizli olsa da geçerlidir.",
      'Moderasyonun her erişimi kaydedilir: kim, ne zaman, hangi kaydına baktığı bir denetim izinde tutulur. Bu iz YALNIZCA EKLEME kabul eder - kayıt sunucu tarafında oluşturulur, bir moderatörün kendi erişim kaydını silmesine ya da değiştirmesine izin veren hiçbir yol yoktur. Erişim yalnızca bir şikayet ya da inceleme bağlamında kullanılır, gelişigüzel göz atma değildir. Kayıtlar 2 YIL saklanır (6. maddeye bak).',
      'Bu satırı yazdığımız gün denetim izinde hiç kayıt yok - bugüne kadar hiçbir moderatör erişimi olmadı. Bu, mekanizmanın kurulu olmadığı anlamına gelmez; kurulu ve çalışıyor, henüz kullanılması gerekmedi.',
    ],
  },
  {
    baslik: '5. Yurt dışına aktarım',
    paragraflar: [
      "Supabase (veritabanı ve dosya depolama) sunucuları Almanya'da (eu-central-1 bölgesi). Bütün kişisel verin Türkiye dışında, Avrupa Birliği sınırları içinde tutulur.",
      "Expo Push API (bildirim gönderimi) sunucuları Amerika Birleşik Devletleri'nde. Bildirim gönderirken cihazının bildirim jetonu, kime gönderildiği bilgisi ve bildirimi tetikleyen kişinin adı buradan geçer (örneğin 'Deniz sana mesaj gönderdi' gibi). Mesajın metni bildirime hiçbir zaman eklenmez, ama bir başkasının adı da kişisel veridir ve bu aktarımın bir parçasıdır.",
      "Harita zemini iOS'ta Apple Haritalar, Android'de Google Haritalar tarafından sağlanır. Harita çizilirken ekranda görünen bölgenin koordinatları bu sağlayıcıya gider; kimliğin, hesabın ya da check-in'lerin gitmez. Web sürümünde gerçek harita yoktur, bu aktarım da olmaz.",
      "Yol tarifi çizgisi: bir mekânın sayfasında, bulunduğun yerden o mekâna giden yolu haritada çizerken iki koordinat (senin konumun ve mekânın konumu) OSRM adlı açık kaynaklı yol tarifi servisine gönderilir. Bu servis OpenStreetMap verisiyle çalışır. Gönderilen istek kimliğini, hesabını ya da check-in'lerini taşımaz. Yol tarifi alınamazsa haritada çizgi gösterilmez.",
      'Aktarımın hukuki sebebi: dört aktarım da hizmetin verilebilmesi için zorunludur, yani 2. maddedeki dayanakların aynısına - sözleşmenin ifasına - dayanır; bildirim gönderimi ayrıca meşru menfaat kapsamındadır.',
      "Bunu açıkça yazmak istiyoruz: KVKK m.9 yurt dışına aktarım için hukuki sebebin yanında bir aktarım mekanizması da arar (yeterlilik kararı, standart sözleşme, taahhütname ya da açık rıza). Kişisel Verileri Koruma Kurulu'nun bu ülkeleri kapsayan bir yeterlilik kararı bulunmuyor ve bizim de bugün imzalanmış bir standart sözleşmemiz YOK. Bu, uygulama gerçek kullanıcılara açılmadan önce tamamlanması gereken açık bir eksiktir. Var olmayan bir mekanizmayı varmış gibi göstermemeyi tercih ediyoruz.",
    ],
  },
  {
    baslik: '6. Saklama süreleri',
    paragraflar: [
      'Bugün geçerli olan otomatik silme/temizleme kuralları birden fazla (tek bir kural değil).',
      'Süresi dolmuş (90 günden eski) hesap askıya alma kayıtları her gün otomatik olarak veritabanından silinir (tam silme, arşivlenmez). Bu kayıtların başka bir yerde saklanan bir kopyası bugün yoktur.',
      'Takip/sohbet isteği günlük tavanını hesaplamak için tutulan kayıtlarda 2 günden eski satırlar her gün otomatik silinir.',
      'Check-in koordinatın (3. maddede anlatıldığı gibi) check-in anıya dönüştüğünde otomatik olarak silinir.',
      'Moderasyon erişim kayıtları (4. maddeye bak) 2 YIL saklanır. Her gün 04:45\'te çalışan bir temizlik işi bundan eski satırları siler. Bu kural bugün YÜRÜRLÜKTEDİR.',
      'Anılarının (check-in geçmişinin geri kalanı), mesajlarının ve şikayetlerin bugün tam bir otomatik silme işlemi yoktur - süresiz saklanırlar. "Gerekli olduğu süre kadar saklama" ilkesinin tam karşılığı henüz tamamlanmadı.',
      'Planlanan (henüz uygulanmadı): karara bağlanmış şikayetlerin karardan 1 yıl sonra silinmesi. Şikayet kayıtları için bugün otomatik bir silme işi yoktur.',
      'Bir kullanıcıyı engellersen: aranızdaki bütün birebir mesajlar ve konuşma, bekleyen istekler ve arkadaşlık bağı kalıcı olarak silinir. Silme her iki tarafta da geçerlidir ve geri alınamaz; engeli kaldırman silinen mesajları geri getirmez.',
      'Hesabını silersen: profilin, anıların, arkadaşların ve konuşma listen kalıcı olarak silinir. Gönderdiğin mesajlar silinmez ama gönderen kimliğin koparılır. Senin açtığın şikayetlerde kimlik bağı kopar; hakkında açılan şikayetlerde ise kimlik bağı KOPMAZ, hedef kimliği moderasyon kaydında kalır. Profil ve check-in fotoğrafların depolama alanından silinir.',
    ],
  },
  {
    baslik: '7. Hakların',
    paragraflar: [
      'Hesabını dondurabilirsin. Verilerin silinmez, görünmez hale gelirsin; tekrar giriş yaptığında hesabın kendiliğinden aktif olur.',
      'Hesabını kalıcı olarak silebilirsin. Geri dönüşü yoktur; yeniden gelmek istersen sıfırdan hesap açman gerekir.',
      'Verilerinin bir kopyasını talep edebilirsin. Bu talep için bugün uygulama içinde otomatik bir akış yok; aşağıdaki başvuru yolundan talep edebilirsin.',
      'Başvuru yolu: başvurularını destek@slooin.com adresine gönderebilirsin; başvurun en geç 30 gün içinde yanıtlanır.',
    ],
  },
]

export default function GizlilikEkrani() {
  const stiller = useStiller(stilleriYap)
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

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kaydirici: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: bosluk.sayfa,
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
