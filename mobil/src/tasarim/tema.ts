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
   * Ana vurgu. Eylem ve canlilik.
   *
   * Kullanicinin karari (2026-08-25): ton logodan OLCULEREK alindi ve
   * uygulamanin her yerine tasindi. Marka isareti ile butonlar arasinda
   * renk farki kalmiyor. Onceki degerler #FF6B1A ve #E66208'di; ikisi
   * de logonun gercek tonu degildi.
   */
  turuncu: '#FE7813',
  /** Basili/aktif hal. */
  turuncuKoyu: '#E06509',
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
  /** Ayirici cizgi ve kenarlik. */
  cizgi: '#EFEAE5',

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
   * Yuzer cubugun zemini: yari saydam, altindaki icerik hafifce
   * suzuluyor. Alt gezinme cubugu haritanin uzerinde durdugu icin
   * dolu bir renk oraya agir geliyordu.
   */
  yuzerZemin: 'rgba(255, 255, 255, 0.86)',

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
   * Vurgu KOYU MODDA DA AYNI: marka rengi degismiyor, cunku dolgu
   * olarak kullanildigi yerlerde (buton, rozet, check-in dugmesi)
   * koyu zeminde zaten parliyor.
   */
  turuncu: '#FE7813',
  /**
   * Basili hal koyu modda ACILIYOR, koyulasmiyor: koyu zeminde daha
   * koyu bir turuncu "basildi" degil "pasif" gibi okunuyor.
   */
  turuncuKoyu: '#FFA45C',
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

  yuzerZemin: 'rgba(28, 25, 23, 0.88)',

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
