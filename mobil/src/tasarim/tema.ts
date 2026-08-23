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

export const renk = {
  /** Ana vurgu. Eylem ve canlilik. */
  turuncu: '#FF6B1A',
  /** Basili/aktif hal. */
  turuncuKoyu: '#E85D0F',
  /** Turuncunun yumusak zemini (secili satir, rozet arkasi). */
  turuncuZemin: '#FFF3EA',

  /** Ana metin. Saf siyah degil - sicak, fotografla kavga etmiyor. */
  metin: '#17130F',
  /** Ikincil metin: aciklama, zaman damgasi. */
  metinIkincil: '#6E6660',
  /** Soluk metin: yer tutucu, pasif durum. */
  metinSoluk: '#A39B93',

  /** Sayfa zemini. Saf beyaz degil; fotograf kapaklari uzerinde
   *  parlamasin diye bir tik sicak. */
  zemin: '#FAF7F3',
  /** Kart ve yuzer yuzeyler. */
  yuzey: '#FFFFFF',
  /** Ayirici cizgi ve kenarlik. */
  cizgi: '#EFEAE5',

  /** Fotograf uzerindeki yazinin okunmasi icin karartma. */
  kapakKarartma: 'rgba(23, 19, 15, 0.45)',
  /** Cam (blur) rozet zemini - fotograf uzerinde. */
  camRozet: 'rgba(255, 255, 255, 0.22)',
} as const

export const yazi = {
  /** Baslik ailesi. Karakterli; olculu kullanilir. */
  baslik: 'BricolageGrotesque_600SemiBold',
  baslikKalin: 'BricolageGrotesque_700Bold',
  /** Govde ailesi. */
  govde: 'InstrumentSans_400Regular',
  govdeOrta: 'InstrumentSans_500Medium',
  govdeKalin: 'InstrumentSans_600SemiBold',
} as const

/** Tip olcegi. Kanvastaki degerlerden turetildi. */
export const olcek = {
  dev: 56,
  baslik: 24,
  altBaslik: 18,
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
