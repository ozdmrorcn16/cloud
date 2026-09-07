/**
 * Slooin gorsel kimligi - tek kaynak.
 *
 * Degerler tasarim kanvasindan (tasarim/slooin-kanvas/Stil.dc.html)
 * birebir alindi. Kimlik karar 73-74'te belirlendi: beyaz zemin, TEK
 * turuncu vurgu, tam kanama fotograf kapaklari uzerinde karartma, cam
 * rozetler, yuzer gezinme cubugu.
 *
 * Kural: turuncu YALNIZCA eylem ve canlilik icin kullanilir. Bir sey
 * turuncuysa ya tiklanabilir ya da "su an oluyor" demektir. Dekorasyon
 * icin turuncu kullanmak kimligi tuketir.
 */

export const acikRenk = {
  /**
   * DOLGU ve IKON turuncusu. Eylem ve canlilik.
   *
   * Ton logodan olculdu (kullanicinin karari 2026-08-25): hue 25,8 derece,
   * doygunluk %99. Onceki deger #FE7813'tu; ACIKLIK %54'ten %48'e indi
   * (2026-09-07 tasarim denetimi). Sebep olculdu: #FE7813 uzerinde beyaz
   * yazi 2,65:1 veriyordu - govde esiginin (4,5) yarisi ve kalin yazi
   * icin gecerli gevsek esigin (3,0) de altinda. #F66A01 ile 3,01:1.
   *
   * Ton ve doygunluk DEGISMEDI, yani marka isaretiyle yan yana fark
   * gozle secilmiyor. Ikon ve grafik olarak da beyaz uzerinde 3,01:1,
   * yani metin olmayan ogeler icin gereken 3:1 esigini geciyor.
   *
   * DIKKAT: bu jeton YAZI RENGI OLARAK KULLANILMAZ - onun icin
   * `turuncuYazi` var. Beyaz zeminde turuncu yazi bu tonda 3,01:1'de
   * kalir ve govde metni esigini gecmez.
   */
  turuncu: '#F66A01',
  /**
   * TURUNCU YAZI ve ikon-yaninda-etiket rengi.
   *
   * Acik modda dolgudan AYRI olmak zorunda: ayni ton hem dolgu (uzerinde
   * beyaz yazi) hem yazi (beyaz zeminde) olamaz, cunku ikisi zit yonde
   * duzeltme ister. Bu ton uygulamadaki BUTUN acik yuzeylerde 4,5:1'i
   * geciyor - en zorlayicisi profil bandinin ustu (#FFE6D2): 4,51:1.
   */
  turuncuYazi: '#B04C01',
  /**
   * BASILI hal dolgusu. Uzerinde beyaz etiket durdugu icin iki modda da
   * KOYU kalir (beyaz yaziyla 3,98:1).
   *
   * Eskiden bu is `turuncuKoyu` jetonundaydi ve o jeton ayni zamanda
   * yazi rengi olarak da kullaniliyordu. Koyu modda yazi rolu icin
   * acilinca (#FFA45C) dolgu rolu bozuldu: basili butonun beyaz etiketi
   * 1,96:1'e dusup kayboluyordu. Jeton bu yuzden ikiye ayrildi.
   */
  turuncuBasili: '#D25C05',
  /** Turuncunun yumusak zemini (secili satir, rozet arkasi). */
  turuncuZemin: '#FFF3E8',

  /** Ana metin. Saf siyah degil - sicak, fotografla kavga etmiyor. */
  metin: '#17130F',
  /** Ikincil metin: aciklama, zaman damgasi. */
  metinIkincil: '#6E6660',
  /** Soluk metin: yer tutucu, pasif durum. */
  metinSoluk: '#A39B93',

  /**
   * Sayfa zemini: TAM BEYAZ.
   *
   * Kullanicinin karari (2026-08-27): "Ilk baslangic ekrani disindaki
   * butun sayfalarin arka planini tam beyaz yap." Onceki deger
   * #FAF7F3 idi (bir tik sicak beyaz). Yalnizca karsilama ekrani o
   * sicak tonu koruyor - onun jetonu `karsilamaZemini`.
   *
   * DIKKAT: `yuzey` de beyaz. Yani kart ve satirlar artik zeminden
   * RENKLE ayrilmiyor; ayrimi `golge.kart` ve `cizgi` tasiyor.
   */
  zemin: '#FFFFFF',
  /**
   * YALNIZCA karsilama ekrani. Sicaklik zemininin altindaki taban
   * renk ve o ekrandaki ikonlarin ic dolgusu bu tonu kullaniyor;
   * beyaz olsalardi lekelerin uzerinde delik gibi dururlardi.
   */
  karsilamaZemini: '#FAF7F3',
  /** Kart ve yuzer yuzeyler. */
  yuzey: '#FFFFFF',
  /**
   * Ayirici cizgi ve kenarlik.
   *
   * Onceki deger #EFEAE5'ti ve beyaz zeminde 1,20:1 veriyordu; sayfa da
   * kart da tam beyaz oldugu icin kartlarin sinirlari ekranda neredeyse
   * gorunmuyordu (2026-09-07 denetimi, ekran goruntusuyle olculdu).
   * #DCD3C9 ile 1,48:1 - %23 daha gorunur.
   *
   * NOT: 3:1 grafik esigine cikarmak MUMKUN DEGIL. Olculdu: #CFC4B8 bile
   * yalnizca 1,72:1 veriyor; 3:1 icin cizgiyi orta griye cekmek gerekir
   * ve o da karti cerceveli bir kutuya cevirir. Koyu modda ayni sorun
   * yok, cunku orada yuzey zeminden bir ton acik - ayrimi ton tasiyor.
   */
  cizgi: '#DCD3C9',

  /**
   * YIKICI EYLEM (sil, sikayet et, engelle).
   *
   * Koyu modda ACILIYOR: acik moddaki #C0392B, koyu zeminde 3,4:1'e
   * duesuyor ve okunmuyor. Kirmizinin anlami ayni, tonu zemine gore
   * degisiyor.
   */
  yikici: '#C0392B',

  /**
   * Profil kimlik bandinin gecisi (ust -> orta -> `zemin`).
   *
   * Jeton olmasi sart: gecis acik modda seftaliden beyaza gidiyor;
   * koyu modda ayni degerler kalsaydi koyu bir uygulamanin tepesinde
   * parlak bir bant dururdu.
   */
  bandUst: '#FFE6D2',
  bandOrta: '#FFF3E9',

  /**
   * Profil fotografindaki "+" rozetinin zemini.
   *
   * Acik modda KOYU: beyaz fotograf halkasinin uzerinde ancak koyu bir
   * daire secilir. Koyu modda TURUNCU (kullanicinin istegi
   * 2026-09-03): koyu zeminde koyu bir rozet kayboluyor, acik gri bir
   * rozet de fotografla ayni tonda kaliyordu. Turuncu ayrica kurala
   * uyuyor - rozet bir EYLEM (fotograf degistir).
   */
  rozetZemin: '#17130F',

  /**
   * Yuzer cubugun zemini: OPAK.
   *
   * Eskiden yari saydamdi (rgba(255,255,255,0.86)) ve Instagram'in ust
   * cubugunu taklit ediyordu. Kaldirildi (2026-09-07 denetimi): saydamlik
   * BULANIKLIK OLMADAN malzeme gibi degil cizim hatasi gibi okunuyordu -
   * cubugun ardindan kirpilmis bir mekan adi ve tam bir turuncu buton
   * hayalet gibi goruenuyordu (iki ekran goruntusunde de olculdu).
   *
   * Gercek buzlu cam `expo-blur` istiyor ve o NATIVE bir paket: yeni bir
   * derleme gerektirir, OTA ile gitmez. Opak cozum bugun gidiyor.
   */
  yuzerZemin: '#FFFFFF',

  /** Fotograf uzerindeki yazinin okunmasi icin karartma. */
  kapakKarartma: 'rgba(23, 19, 15, 0.45)',
  /** Cam (blur) rozet zemini - fotograf uzerinde. */
  camRozet: 'rgba(255, 255, 255, 0.22)',
} as const

/** Iki paletin de uymak zorunda oldugu sekil. */
export type Renk = { [A in keyof typeof acikRenk]: string }

/**
 * NOT: eskiden `renk` diye TEK bir palet vardi ve ekranlar onu modul
 * duzeyinde okuyordu. Koyu mod gelince kaldirildi - duruyor olsaydi
 * yeni bir ekran yanlislikla ACIK paleti sabitleyebilirdi ve hata
 * ancak koyu modda gorunurdu. Palet artik `useRenk()` ile aliniyor.
 */

/**
 * KOYU PALET (kullanicinin istegi 2026-09-03).
 *
 * Notr tonlar SICAK: saf gri degil, kahverengiye kacan bir siyah.
 * Sebep markanin kendisi - turuncu vurgu soguk grinin uzerinde
 * titriyor, sicak siyahin uzerinde oturuyor.
 *
 * Her jetonun ROLU aynen korunuyor; degisen yalnizca degeri. Boylece
 * ekran kodu hangi modda oldugunu HIC bilmiyor, yalnizca "zemin",
 * "yuzey", "cizgi" diyor.
 */
export const koyuRenk: Renk = {
  /**
   * DOLGU turuncusu koyu modda da AYNI degeri tasiyor: uzerindeki beyaz
   * etiketin kontrasti sayfanin temasina bagli degil, yalnizca dolgunun
   * kendisine bagli. Yani beyaz-uzerine-turuncu sorunu iki modda ayni
   * sorundu ve ayni degerle cozuluyor (3,01:1).
   *
   * Koyu zeminde gorunurluk de tamam: #F66A01 / #121110 = 6,27:1.
   */
  turuncu: '#F66A01',
  /**
   * TURUNCU YAZI koyu modda MARKA TONUNDA kalabiliyor - hicbir odun
   * gerekmiyor, cunku zemin koyu: #FE7813 / #121110 = 7,10:1,
   * kart yuzeyinde 6,59:1, cipte 5,49:1.
   *
   * Yani turuncu yazinin koyulastirilmasi (acik moddaki #B04C01)
   * YALNIZCA ACIK MODUN bedeli. Koyu modda vurgu tam canliligiyla
   * duruyor.
   */
  turuncuYazi: '#FE7813',
  /**
   * BASILI dolgu iki modda da AYNI ve KOYU. Onceki hal #FFA45C'ti ve
   * "koyu zeminde daha koyu bir turuncu pasif gorunur" gerekcesiyle
   * acilmisti - o gerekce YAZI icin dogruydu, dolgu icin degil: basili
   * butonun beyaz etiketi 1,96:1'e dusuyordu ve alt gezinmedeki aktif
   * merkez dugme, listedeki butonlardan daha ZAYIF gorunuyordu.
   */
  turuncuBasili: '#D25C05',
  /** Yumusak zemin: turuncunun sicak, cok koyu hali. */
  turuncuZemin: '#3A2412',

  metin: '#F4F0EB',
  metinIkincil: '#B0A79E',
  metinSoluk: '#7C736A',

  /** Sayfa zemini: saf siyah DEGIL - saf siyahta beyaz metin titriyor. */
  zemin: '#121110',
  karsilamaZemini: '#171512',
  /**
   * Kart ve yuzer yuzeyler zeminden BIR TIK ACIK. Acik modda ikisi de
   * beyazdi ve ayrimi golge tasiyordu; koyu modda golge gorunmuyor,
   * bu yuzden ayrimi ton tasiyor.
   */
  yuzey: '#1C1917',
  cizgi: '#2E2823',

  yikici: '#FF6B5A',

  bandUst: '#3A2412',
  bandOrta: '#221A15',

  rozetZemin: '#F66A01',

  /** Yuzer cubuk koyu modda da OPAK - acik modla ayni gerekce. */
  yuzerZemin: '#1C1917',

  /** Fotograf karartmasi ayni: fotograf iki modda da ayni fotograf. */
  kapakKarartma: 'rgba(23, 19, 15, 0.45)',
  camRozet: 'rgba(255, 255, 255, 0.16)',
}


export const yazi = {
  /**
   * EKRAN BASLIKLARI - ve baslik gibi davranan her sey (bas harfli
   * avatarlar, sayilar).
   *
   * Kullanicinin karari (2026-08-25): "Basliklar dahil butun yazim
   * stilleri resimdeki gibi olucak." Referans, Instagram duzenine
   * gecirilmis kendi ayarlar ekranimizdi.
   *
   * Uygulamanin ICINDE TEK YAZI AILESI var: Instrument Sans. Marka
   * fontu Bricolage Grotesque buradan tamamen cikti (once yalnizca
   * basliklardan cikmisti, sonra tamamen). Kelime markasi bir gorsel
   * oldugu icin markanin karakteri orada duruyor.
   */
  ekranBasligi: 'InstrumentSans_700Bold',

  /** Govde ailesi. */
  govde: 'InstrumentSans_400Regular',
  govdeOrta: 'InstrumentSans_500Medium',
  govdeKalin: 'InstrumentSans_600SemiBold',
} as const

/** Tip olcegi. Kanvastaki degerlerden turetildi. */
export const olcek = {
  dev: 56,
  baslik: 26,
  altBaslik: 19,
  govde: 15,
  kucuk: 13,
  minik: 11,
} as const

export const bosluk = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  /**
   * SAYFA KENARI - butun ekranlarin yan payi.
   *
   * Kullanicinin istegi (2026-09-06): "Ekrani yanlardan sigdir, ekrani
   * yay, tam ekran gorunsun uygulama her zaman." Onceden her ekran
   * `bosluk.xl` (24) kullaniyordu ve icerik dar kaliyordu.
   *
   * AYRI BIR JETON olmasinin sebebi: `bosluk.xl` dikey bosluk ve gap
   * olarak da kullaniliyor; degerini degistirmek istenmeyen yerleri de
   * kaydirirdi. Sayfa kenari kendi adiyla durunca ileride tek yerden
   * ayarlanabiliyor.
   */
  sayfa: 16,
} as const

export const yuvarlak = {
  kart: 16,
  buyuk: 20,
  hap: 999,
} as const

/** Yuzer yuzeyler icin golge (gezinme cubugu, kartlar). */
export const golge = {
  yuzer: {
    shadowColor: '#17130F',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  kart: {
    shadowColor: '#17130F',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
} as const
