import { useState } from 'react'
import { View, Text, TextInput, Pressable, Platform, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { epostaGecerliMi, epostaNormallestir } from '../../../lib/eposta'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'
import { MarkaIsareti } from '../../tasarim/MarkaIsareti'
import { AppleIkonu, GoogleIkonu } from '../../tasarim/sosyal-ikonlar'
import { hataMetni } from '../../../lib/hata-metni'
import { gonderimKaydet } from '../../../lib/kod-gonderim'
import { epostaKayitliMi } from '../../../lib/eposta-kayit'

/**
 * KAYDIN ILK ADIMI: yalnizca e-posta adresi.
 *
 * KAYIT TELEFONDAN E-POSTAYA TASINDI (kullanicinin karari 2026-09-01).
 * Sebep pratikti: Turkiye'de A2P SMS gondermek icin operatorler vergi
 * mukellefiyeti ve KEP uzerinden belge istiyor; kullanicinin sirketi
 * yok. E-posta ucretsiz ve sirket gerektirmiyor. `auth.users` icindeki
 * telefon alani duruyor - ileride SMS'e donmek bir ayar degisikligi.
 *
 * DUZEN kullanicinin verdigi referansa gore: ustte ORTALANMIS marka
 * ISARETI (kelime markasi degil), altinda baslik, e-posta kutusu,
 * turuncu "Devam", ayrac ve saglayici dugmeleri.
 *
 * Burada `signUp` DEGIL `signInWithOtp` cagriliyor: sifre henuz yok.
 * Bu cagri kullaniciyi olusturuyor ve 6 haneli kodu e-postayla
 * gonderiyor; sifre ile KVKK onayi dogrulamadan sonraki adimda
 * aliniyor.
 *
 * ADRESI ZATEN KAYITLI OLAN POSTA ALMAZ: kontrol `epostaKayitliMi` ile
 * sunucuya soruluyor. Kontrol CEVAP VEREMEZSE (ag hatasi ya da saatlik
 * tavan) akis eski haline duesuyor - posta gonderilir ve "zaten
 * kayitli" kontrolu dogrulama ekranindaki son kapida yapilir. Yani bu
 * bir HIZLI YOL, zorunlu bir adim degil.
 */

/**
 * Hangi saglayici dugmeleri gosterilecek.
 *
 * iOS'ta Apple ZORUNLU: App Store, baska bir sosyal giris sunuluyorsa
 * "Apple ile giris"in de bulunmasini sart kosuyor - bu bir tercih
 * degil, kural. Android'de Apple gosterilmiyor: orada zorunlu degil ve
 * kimse beklemiyor (kullanicinin karari 2026-09-01).
 */
function saglayicilar(): ('apple' | 'google')[] {
  return Platform.OS === 'ios' ? ['apple', 'google'] : ['google']
}

export default function KayitEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [eposta, setEposta] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [odakli, setOdakli] = useState(false)

  async function devamEt() {
    setHata(null)

    if (!epostaGecerliMi(eposta)) {
      setHata(t('kayit.hataEposta'))
      return
    }

    const adres = epostaNormallestir(eposta)
    setGonderiliyor(true)

    // POSTADAN ONCE: adres zaten kayitliysa posta hic gonderilmiyor.
    // Kontrol patlarsa akis DURMUYOR - hizli yol, zorunlu adim degil.
    const kayitli = await epostaKayitliMi(adres).catch(() => null)
    if (kayitli === true) {
      setGonderiliyor(false)
      setHata(t('kayit.hataEpostaKayitli'))
      return
    }

    const { error } = await supabase.auth.signInWithOtp({ email: adres })
    setGonderiliyor(false)

    if (error) {
      setHata(hataMetni(error))
      return
    }
    // Ilk kod da sayaca yaziliyor; yoksa dogrulama ekrani sifir
    // beklemeyle aciliyor ve "Tekrar gonder" aninda basilabiliyor.
    await gonderimKaydet(adres)
    router.push(`/dogrula?eposta=${encodeURIComponent(adres)}`)
  }

  async function saglayiciyla(saglayici: 'apple' | 'google') {
    setHata(null)
    const { error } = await supabase.auth.signInWithOAuth({ provider: saglayici })
    if (error) {
      // Saglayici Supabase panelinde acik degilse buraya duesuluyor.
      // Kullaniciyi CALISAN yola yonlendiriyoruz; kapali bir kapiya
      // bakip beklemesin.
      setHata(t('kayit.hataSaglayiciKapali'))
    }
  }

  return (
    <View style={stiller.sayfa}>
      {/* Marka ISARETI, ortada ve ustte (kullanicinin verdigi referans
          duzeni). Kelime markasi burada kullanilmiyor: ekranin kendi
          basligi zaten metin, ikisi ust uste yigilinca ust taraf
          agirlasiyordu. */}
      <MarkaIsareti boyut={56} style={stiller.marka} />

      <Text style={stiller.baslik}>{t('kayit.baslik')}</Text>

      <Text style={stiller.etiket}>{t('kayit.epostaEtiket')}</Text>
      <TextInput
        style={[stiller.girdi, odakli && stiller.girdiOdakli]}
        value={eposta}
        onChangeText={setEposta}
        placeholder={t('kayit.epostaYerTutucu')}
        placeholderTextColor={renk.metinSoluk}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        onFocus={() => setOdakli(true)}
        onBlur={() => setOdakli(false)}
        editable={!gonderiliyor}
      />

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Pressable
        style={[stiller.birincil, gonderiliyor && stiller.birincilPasif]}
        onPress={devamEt}
        disabled={gonderiliyor}
        accessibilityRole="button"
      >
        <Text style={stiller.birincilYazi}>
          {gonderiliyor ? t('kayit.gonderiliyor') : t('kayit.devam')}
        </Text>
      </Pressable>

      <View style={stiller.ayrac}>
        <View style={stiller.ayracCizgi} />
        <Text style={stiller.ayracYazi}>{t('kayit.veya')}</Text>
        <View style={stiller.ayracCizgi} />
      </View>

      {saglayicilar().map((saglayici) => (
        <Pressable
          key={saglayici}
          style={stiller.saglayici}
          onPress={() => saglayiciyla(saglayici)}
          accessibilityRole="button"
        >
          {saglayici === 'apple' ? <AppleIkonu /> : <GoogleIkonu />}
          <Text style={stiller.saglayiciYazi}>
            {saglayici === 'apple' ? t('kayit.appleIle') : t('kayit.googleIle')}
          </Text>
        </Pressable>
      ))}

      <Pressable
        style={stiller.ikincil}
        onPress={() => router.push('/giris')}
        accessibilityRole="button"
      >
        <Text style={stiller.ikincilYazi}>
          {t('kayit.zatenHesap')} <Text style={stiller.ikincilVurgu}>{t('kayit.girisYap')}</Text>
        </Text>
      </Pressable>

      <View style={stiller.bosluk} />
      <Text style={stiller.aydinlatma}>{t('kayit.aydinlatma')}</Text>
    </View>
  )
}

const stiller = StyleSheet.create({
  sayfa: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.xl,
    // LOGO YUKARIDA, YAZILAR ASAGIDA (kullanicinin verdigi referans
    // duzeni, 2026-09-01). Isaret ekranin tepesine yakin duruyor;
    // arasindaki genis bosluk onu formdan ayiriyor ve tek basina
    // duran bir marka ogesi olarak okutuyor. Form da ekranin ortasina
    // iniyor, yani basparmagin dogal olarak durdugu yere.
    paddingTop: bosluk.xxl + bosluk.s,
    paddingBottom: bosluk.xl,
  },
  marka: { alignSelf: 'center', marginBottom: bosluk.xxl * 4 },

  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginBottom: bosluk.l,
  },

  etiket: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginBottom: bosluk.xs,
  },
  girdi: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 15,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  girdiOdakli: { borderColor: renk.turuncu },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginTop: bosluk.s,
  },

  birincil: {
    marginTop: bosluk.m,
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 16,
    alignItems: 'center',
    ...golge.yuzer,
  },
  birincilPasif: { opacity: 0.6 },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },

  ayrac: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    marginVertical: bosluk.xl,
  },
  ayracCizgi: { flex: 1, height: 1, backgroundColor: renk.cizgi },
  ayracYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
  },

  // Notr dugme: marka rengi saglayici dugmelerine UYGULANMAZ. Ekranda
  // tek birincil turuncu eylem "Devam" olmali.
  saglayici: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: bosluk.m,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.hap,
    paddingVertical: 14,
    marginBottom: bosluk.s,
  },
  saglayiciYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },

  ikincil: { marginTop: bosluk.m, alignItems: 'center' },
  ikincilYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  ikincilVurgu: { fontFamily: yazi.govdeKalin, color: renk.metin },

  bosluk: { flex: 1 },
  aydinlatma: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    lineHeight: 16,
    color: renk.metinSoluk,
    textAlign: 'center',
  },
})
