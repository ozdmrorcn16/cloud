import type { HukukiMetin } from './tur'

/**
 * TURKCE - KAYNAK METIN. Diger alti dil bunun cevirisidir ve her
 * birinin basinda "Turkce metin esastir" notu vardir.
 *
 * Gizlilik: kaynak `docs/gizlilik-metni.md`. Icerik uzak bir kaynaktan
 * CEKILMEZ, kod icinde sabit tutulur - gizlilik metni ag baglantisi
 * olmadan da okunabilmeli. Bu dizi kaynak dosyanin "Veri sorumlusu"
 * bolumu ve yedi maddesindeki HER OLGUSAL IDDIAYI tasir; md
 * degisirse bu dizi (ve alti ceviri) AYNI TURDA guncellenmeli.
 *
 * Kosullar: kaynak `site/src/pages/[...dil]/kosullar.astro` (7 Eylul
 * 2026 surumu).
 *
 * Ekran metinleri karar 74 geregi duzgun Turkce (aksanli) yazilir.
 */
const tr: HukukiMetin = {
  gizlilik: [
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
        'Adın, kullanıcı adın, doğum tarihin, biyografin, profil fotoğrafların.',
        'Konumun - üç farklı şekilde: mekan ararken ve mekan eklerken cihaz konumun sunucuya gönderilir ama saklanmaz; check-in aktifken koordinatın saklanır, check-in anıya dönüşünce (1 saat sonra ya da hemen "ayrıldım" dediğinde) koordinat silinir ve geriye yalnızca hangi mekanda olduğun kalır (tam ayrıntı aşağıda, 3. maddede).',
        'Gönderdiğin ve aldığın mesajların içeriği.',
        'Arkadaşlık bilgin: kimi takip ettiğin, kimlerle sohbet isteği alışverişinde bulunduğun, kimi engellediğin.',
        'Bildirim göndermemiz için cihazının bildirim jetonu.',
        'Şikayet ettiğin ya da hakkında şikayet edilen bilgiler.',
        'Mekânlara verdiğin puanlar (Kötü / İyi / Harika). Herkes yalnızca toplamları görür; hangi puanı verdiğini yalnızca sen görürsün. Check-in fotoğrafların, seçtiğin görünürlük kuralıyla o mekânın fotoğraf alanında da görünür.',
      ],
    },
    {
      baslik: '2. Ne amaçla işliyoruz - ve hangi hukuki sebeple',
      paragraflar: [
        'KVKK m.10, işleme amacının yanında hukuki sebebin de bildirilmesini ister. Her amacın dayanağı ayrı ayrı yazılıdır.',
        'Hesabını kurmak ve e-posta adresini doğrulamak. Hukuki sebep: sözleşmenin ifası (KVKK m.5/2-c) - hesap olmadan uygulamanın hiçbir işlevi çalışmaz.',
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
        'Aktarımın hukuki sebebi: üç aktarım da hizmetin verilebilmesi için zorunludur, yani 2. maddedeki dayanakların aynısına - sözleşmenin ifasına - dayanır; bildirim gönderimi ayrıca meşru menfaat kapsamındadır.',
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
        'Verilerinin bir kopyasını indirebilirsin: Ayarlar > Verilerimi indir. Dosya JSON biçiminde hazırlanır ve 24 saat geçerli bir bağlantıyla verilir; süre dolunca dosya erişilemez olur ve yeniden indirebilirsin.',
        'Dosyada NELER YOK: hakkında açılan şikâyetler (şikâyet edenin kimliğini taşıdıkları için), moderasyon denetim izi, seni kimin engellediği ve sana gelen mesajların metinleri. Sana gelen mesajlar için yalnızca kiminle, kaç mesaj ve en son ne zaman bilgisi yer alır - bir konuşmanın karşı tarafındaki cümleler o kişinin verisidir.',
        'İNDİRDİĞİN DOSYAYI SEN KORURSUN. İçinde konum geçmişin de dahil olmak üzere hesabındaki her şey vardır; paylaştığın kişi bunların tamamını görür.',
        'Başvuru yolu: başvurularını destek@slooin.com adresine gönderebilirsin; başvurun en geç 30 gün içinde yanıtlanır.',
      ],
    },
  ],
  kosullar: [
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
  ],
}

export default tr
