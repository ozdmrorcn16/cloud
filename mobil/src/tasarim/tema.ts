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
   * MARKA TURUNCUSU - dolgu, ikon ve yazi. Eylem ve canlilik.
   *
   * Ton logodan OLCULEREK alindi (kullanicinin karari 2026-08-25) ve
   * DEGISTIRILMEZ. 2026-09-07 denetiminde kontrast gerekcesiyle %6
   * koyulastirilmisti (#F66A01); kullanici ayni gun GERI ALDIRDI:
   * "turuncu rengi eski haline cevir."
   *
   * BILINEN VE KABUL EDILEN ODUN: uzerinde beyaz yazi 2,65:1 veriyor,
   * WCAG govde esigi 4,5 ve kalin yazi icin gevsek esik 3,0. Beyaz
   * zeminde turuncu YAZI da ayni orani veriyor. Bu bir gozden kacma
   * degil, marka tonu lehine verilmis bir karar.
   *
   * Ileride kontrast iyilestirilecekse TONA DOKUNMAYAN yollar var:
   * yaziyi buyutmek/kalinlastirmak, turuncuyu dolgu yerine kenarlik
   * yapmak, altindaki zemini degistirmek, ya da o metni turuncu
   * yapmaktan vazgecmek. Tonu degistirmek bir secenek degil.
   */
  turuncu: '#FE7813',
  /**
   * TURUNCU YAZI. Su an marka tonuyla AYNI deger.
   *
   * Jeton ayri duruyor cunku bir ROL isaretliyor: "burada turuncu metin
   * var". Metin ve dolgu ayni tonu paylastigi surece degeri ayni, ama
   * ileride yalnizca metin tarafi degistirilmek istenirse tek satirlik
   * bir is oluyor - 37 kullanim yerini yeniden gezmek gerekmiyor.
   */
  turuncuYazi: '#FE7813',
  /**
   * BASILI hal dolgusu. Uzerinde beyaz etiket durdugu icin iki modda da
   * KOYU kalir (beyaz yaziyla 3,48:1).
   *
   * Eskiden bu is `turuncuKoyu` jetonundaydi ve o jeton ayni zamanda
   * yazi rengi olarak da kullaniliyordu. Koyu modda yazi rolu icin
   * acilinca (#FFA45C) dolgu rolu bozuldu: basili butonun beyaz etiketi
   * 1,96:1'e dusup kayboluyordu. Jeton bu yuzden ayri kaldi - marka
   * tonu geri alinirken bu ayrim KORUNDU, cunku duzelttigi sey renk
   * degil bir hataydi.
   */
  turuncuBasili: '#E06509',
  /**
   * SECILI hal dolgusu - `turuncuBasili` ile KARISTIRILMAMALI.
   *
   * Ikisi farkli seyi anlatiyor ve bu yuzden ZIT yonde ayarlaniyor:
   *   basili  = parmak su an uzerinde, ANLIK  -> KOYULASIR
   *   secili  = o bolumdesin, KALICI bir hal  -> PARLAKLASIR
   *
   * Tek jeton kullanildiginda check-in dugmesi secili haldeyken
   * koyulasiyordu ve kullanicinin bildirdigi sey tam buydu (2026-09-07:
   * "checkin dugmesine basinca koyu renk oluyor, daha acik parlak bir
   * renk olsun"). Koyu bir ton "basildi" degil "sonmus" okunuyor.
   *
   * FARK KASITLI OLARAK KUCUK. Ilk denemede #FF9142 kullanildi ve
   * kullanici "cok acik renk olmus" dedi (2026-09-07); istegi
   * "basilmadan onceki rengi kalsin, basinca SADECE daha parlak
   * gorunsun, obur butonlar gibi olsun" seklindeydi.
   *
   * "Obur butonlar kadar ama ters yonde" diye simetrik bir hesap
   * denendi ve ELENDI: butonlarin koyulasma miktari 0,0938 parlaklik
   * ve ayni miktarda yukari cikmak 0,4393 hedefi veriyor - yani zaten
   * cok acik bulunan #FF9142'den (0,4190) DAHA acik bir ton. Simetri
   * burada yanlis olcut; goz koyulasmayi ve aciltmayi ayni buyuklukte
   * algilamiyor.
   *
   * Secilen fark, butonlarin basili farkinin ucte biri kadar:
   *     marka   #FE7813  parlaklik 0,3455
   *     secili  #FF8419  parlaklik 0,3783   (+0,0328)
   *
   * ODUN, olculdu ve bilerek kabul edildi: uzerindeki beyaz konum
   * ignesi bu tonda 2,45:1 veriyor (marka tonunda 2,65). Grafik esigi
   * 3:1, yani ikisi de altinda - marka turuncusundaki ayni odunun
   * devami (bkz. `turuncu` jetonunun notu). Farki kucultmek ikon
   * okunurlugunu da iyilestirdi (2,24 -> 2,45). Elenen adaylar:
   * #FFA45C 1,96 (beyaz igne gorunur sekilde soluk), #FF9142 2,24
   * (kullanici cok acik buldu).
   *
   * Secili dugme ayrica buyueyup yukari kalkiyor, yani ayirt edicilik
   * yalnizca renge yuklenmis degil - ton bu yuzden ince kalabiliyor.
   */
  turuncuSecili: '#FF8419',
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
   * Yuzer cubugun zemini: NEREDEYSE OPAK (%94).
   *
   * Kullanicinin istegi (2026-09-09): "arkasini cok az seffaf yap."
   * "Cok az" ifadesi bilerek harfiyen uygulandi - alfa F0, yani yalnizca
   * %6 saydamlik.
   *
   * Bu, 2026-09-07 denetiminin gerekcesini KORUYOR. O gun cubuk %86
   * opakligindan tam opaga cekilmisti, cunku saydamlik BULANIKLIK
   * OLMADAN malzeme gibi degil cizim hatasi gibi okunuyordu: cubugun
   * ardindan kirpilmis bir mekan adi ve tam bir turuncu buton hayalet
   * gibi goruenuyordu (iki ekran goruntusunde olculdu). %6'da altta
   * gecen sey okunacak kadar belirmiyor; yalnizca cubugun cam bir
   * yuzey oldugu hissediliyor.
   *
   * Gercek buzlu cam `expo-blur` istiyor ve o NATIVE bir paket: yeni
   * bir derleme gerektirir, OTA ile gitmez. Bu yuzden saydamlik dusuk
   * tutuluyor.
   */
  yuzerZemin: '#FFFFFFF0',

  /**
   * PROFIL UST BLOGUNDAKI HARITA DOKUSU.
   *
   * Uc yol kalinligi + yesil alan. Degerler TEMAYLA DONUYOR ve bu bir
   * duzeltme: ilk yazimda "harita her modda acik gorunsun" diye sabit
   * acik tonlar kullanildi, koyu modda doku siyah zeminde PARLADI ve
   * ekran goruntusuyle yakalandi (2026-09-10).
   *
   * Dogru olcut sabit renk degil, ZEMINE GORE HAFIF kalmak: acik modda
   * beyazdan bir tik koyu, koyu modda siyahtan bir tik acik.
   */
  haritaYolInce: '#E6DFD6',
  haritaYolOrta: '#DED5C9',
  haritaYolAna: '#D5C9BA',
  haritaYesil: '#E9EFE4',

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
  /** Marka turuncusu iki modda da ayni. */
  turuncu: '#FE7813',
  /**
   * Koyu modda turuncu yazinin zaten hicbir sorunu yok: #FE7813 koyu
   * zeminde 7,10:1, kart yuzeyinde 6,59:1, cipte 5,49:1 veriyor.
   */
  turuncuYazi: '#FE7813',
  /**
   * BASILI dolgu iki modda da AYNI ve KOYU. Onceki hal #FFA45C'ti ve
   * "koyu zeminde daha koyu bir turuncu pasif gorunur" gerekcesiyle
   * acilmisti - o gerekce YAZI icin dogruydu, dolgu icin degil: basili
   * butonun beyaz etiketi 1,96:1'e dusuyordu ve alt gezinmedeki aktif
   * merkez dugme, listedeki butonlardan daha ZAYIF gorunuyordu.
   */
  turuncuBasili: '#E06509',
  /**
   * SECILI dolgu iki modda da AYNI. Koyu zeminde bu ton zaten guclu
   * ayrisiyor; ayrica koyu modda "secili" halin parlak olmasi acik
   * moddakinden bile dogal.
   */
  turuncuSecili: '#FF8419',
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

  rozetZemin: '#FE7813',

  /** Harita dokusu koyu modda KOYU tonlarda - bkz. acik paletteki not. */
  haritaYolInce: '#221F1C',
  haritaYolOrta: '#2A2622',
  haritaYolAna: '#332E29',
  haritaYesil: '#1B231A',

  /** Yuzer cubuk koyu modda da ayni saydamlikta - acik modla ayni gerekce. */
  yuzerZemin: '#1C1917F0',

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
