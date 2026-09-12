import { ScrollView, Text, View, StyleSheet } from 'react-native'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'
import { yazi, olcek, bosluk, type Renk } from '../tasarim/tema'
import { useStiller } from '../tasarim/tema-baglami'
import { UstCubuk } from '../tasarim/UstCubuk'

/**
 * KULLANIM KOSULLARI (2026-09-13).
 *
 * Kaynak metin: `site/src/pages/[...dil]/kosullar.astro` (7 Eylul 2026
 * surumu). Hesap olusturma ekranindaki "Kullanim kosullarini" baglantisi
 * buraya geliyor; onceden uygulama icinde boyle bir belge YOKTU ve
 * kayit metni var olmayan bir seye atif yapiyordu (CLAUDE.md'de acik
 * borctu). Gizlilik metni gibi OTURUMSUZ da acilabiliyor (`_layout`).
 *
 * Icerik kod icinde sabit: ag olmadan da okunabilmeli. Site metni
 * degisirse bu dizi de AYNI TURDA guncellenmeli.
 */
export const KOSUL_BOLUMLERI: { baslik: string; paragraflar: string[] }[] = [
  {
    baslik: '1. Taraflar',
    paragraflar: [
      "Bu hizmetin (Slooin) veri sorumlusu ve işletmecisi, gerçek kişi olarak Orçun Özdemir'dir. Bu belge, Slooin uygulamasını kullanan herkesle işletmeci arasındaki sözleşme niteliğindedir.",
    ],
  },
  {
    baslik: '2. Yaş sınırı',
    paragraflar: [
      'Slooin yalnızca 18 yaşını doldurmuş kullanıcılar içindir. 18 yaşından küçük biri hesap açamaz. Veli onayıyla kısıtlı bir kullanım biçimi yoktur; Slooin tek bir kitleye, yetişkin kullanıcılara hitap eder.',
    ],
  },
  {
    baslik: '3. Hesap',
    paragraflar: [
      'Bir kişi yalnızca bir hesap açabilir.',
      'Kullanıcı adın benzersizdir ve belirli bir biçime uymalıdır (küçük harf, rakam, nokta ve alt çizgi; 3-20 karakter). Kullanıcı adını 30 günde bir değiştirebilirsin.',
      'Hesabına giriş için belirlediğin parolanın gizliliği senin sorumluluğundadır. Hesabında gerçekleşen işlemlerden, parolanı paylaşman ya da güvenli tutmaman durumunda sen sorumlusun.',
    ],
  },
  {
    baslik: '4. Konum',
    paragraflar: [
      "Slooin'in çalışabilmesi için konum bilgin gereklidir: yakınındaki mekânları keşfetmek, mekân eklemek ve check-in yapmak konum erişimine dayanır. Check-in senin kendi eylemindir - hangi mekânda olduğunu paylaşmak istemediğin sürece uygulama seni otomatik olarak başka kullanıcılara göstermez. Konumunun ne şekilde işlendiği ve ne kadar saklandığı Gizlilik Politikası'nda ayrıntılı anlatılır.",
    ],
  },
  {
    baslik: '5. Yasak davranış',
    paragraflar: [
      "Slooin'i kullanırken aşağıdakiler yasaktır: taciz, tehdit ya da başka bir kullanıcıyı rahatsız edecek davranış; sahte hesap açmak ya da başkasını taklit etmek; başkasının konumunu, rıza almadan uygulama dışında paylaşmak; ticari amaçlı toplu mesaj gönderme (spam).",
      'Bu davranışlardan biri tespit edilirse 7. maddedeki moderasyon yaptırımları uygulanır.',
    ],
  },
  {
    baslik: '6. İçerik',
    paragraflar: [
      "Check-in'e eklediğin not ve fotoğrafın sahibi sensin. Bunları paylaşarak Slooin'e, o içeriği uygulama içinde (akışta, profilinde, ilgili mekân sayfasında) gösterme izni vermiş olursun. İçeriğin sahipliği sende kalır.",
    ],
  },
  {
    baslik: '7. Moderasyon',
    paragraflar: [
      'Bir şikâyet üzerine içeriğin (check-in notu, fotoğrafı ya da yorumun) gizlenebilir. Tekrarlayan ya da ağır ihlallerde hesabın geçici olarak askıya alınabilir ya da kalıcı olarak yasaklanabilir. Bir moderasyon kararına itiraz etmek istersen destek@slooin.com adresinden bize ulaşabilirsin.',
    ],
  },
  {
    baslik: '8. Hesap kapatma',
    paragraflar: [
      'Hesabını istediğin zaman dondurabilirsin: verilerin silinmez, tekrar giriş yaptığında hesabın kendiliğinden yeniden aktif olur.',
      "Hesabını kalıcı olarak silebilirsin. Bu işlem geri alınamaz; yeniden kullanmak istersen sıfırdan hesap açman gerekir. Silme sırasında neyin silindiği, neyin (anonimleştirilerek) kaldığı Gizlilik Politikası'nda anlatılır.",
    ],
  },
  {
    baslik: '9. Sorumluluk sınırı',
    paragraflar: [
      'Slooin, kullanıcıların birbiriyle check-in aracılığıyla aynı ortamı paylaşmasını kolaylaştıran bir araçtır. Kullanıcıların buluşmasından ya da birbirleriyle olan etkileşiminden doğan sonuçlardan işletmeci sorumlu değildir.',
      'Uygulamadaki mekân verisi (ad, konum, tür bilgisi) üçüncü taraf kaynaklardan (Foursquare ve OpenStreetMap) gelir ve hatalı olabilir. Bu soyut bir feragat değildir: veritabanında, aynı mekânın yanlış koordinatlarla birden fazla kez göründüğü gerçek kayıtlar vardır - örneğin "Galata Kulesi" adıyla Çekmeköy, Silivri ve Büyükçekmece\'de ayrı kayıtlar bulunmaktadır. Bir mekânın adını, konumunu ya da türünü doğru kabul etmeden önce kendi değerlendirmeni yapmalısın.',
    ],
  },
  {
    baslik: '10. Değişiklik',
    paragraflar: ['Bu koşullar değişirse değişiklik uygulama içinde bildirilir.'],
  },
  {
    baslik: '11. Uygulanacak hukuk',
    paragraflar: ['Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir.'],
  },
]

export default function KosullarEkrani() {
  const stiller = useStiller(stilleriYap)
  return (
    <ScrollView style={stiller.kaydirici} contentContainerStyle={stiller.icerik}>
      <UstCubuk baslik="Kullanım koşulları" geriEtiketi="Geri" />
      <Text style={stiller.guncelleme}>Son güncelleme: 7 Eylül 2026</Text>
      {KOSUL_BOLUMLERI.map((bolum) => (
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

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    kaydirici: { flex: 1, backgroundColor: renk.zemin },
    icerik: {
      paddingHorizontal: bosluk.sayfa,
      gap: bosluk.s,
      paddingBottom: ALT_GEZINME_PAYI,
    },
    guncelleme: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.metinSoluk,
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
