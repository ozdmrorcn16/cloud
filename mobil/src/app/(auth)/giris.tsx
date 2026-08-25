import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { eFormatinaCevir } from '../../../lib/telefon'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../../tasarim/tema'
import { MarkaYazisi } from '../../tasarim/MarkaYazisi'

/**
 * GIRIS - uygulamanin ilk sayfasi.
 *
 * Kullanicinin karari (2026-08-25): uygulamayi acan kisi dogrudan bu
 * ekrani gorur. Once bir karsilama/tanitim ekrani vardi; kullanici
 * Instagram'in giris ekranini ornek gosterip "ilk sayfa bu olacak"
 * dedi. Gerekce makul: donen kullanici cogunluktur ve onu bir tanitim
 * ekranindan gecirmek her acilista engel cikarmak demek.
 *
 * DUZEN (Instagram'dan alinan iskelet, Slooin kimligiyle):
 *   - Ust bosluk, ortada marka isareti
 *   - Iki alan: telefon ve sifre
 *   - Dolu birincil buton (turuncu)
 *   - Esnek bosluk
 *   - Altta CERCEVELI ikincil eylem: yeni hesap olustur
 *   - En altta kelime markasi
 *
 * Iki eylemin bicimi bilerek farkli: birincil DOLU, ikincil CERCEVELI.
 * Boylece ekranda tek bir turuncu dolgu kaliyor ve "asil eylem hangisi"
 * sorusu bakisla cevaplaniyor - kimlik kurali da bunu soyluyor
 * (turuncu yalnizca eylem ve canlilik icin).
 */
export default function GirisEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [telefon, setTelefon] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [odaklanan, setOdaklanan] = useState<'telefon' | 'sifre' | null>(null)

  const hazir = telefon.trim().length > 0 && sifre.length > 0

  async function girisYap() {
    setHata(null)
    if (!hazir) {
      setHata(t('giris.hataBos'))
      return
    }
    const eFormatli = eFormatinaCevir(telefon)
    if (!eFormatli) {
      setHata(t('giris.hataTelefon'))
      return
    }

    setGonderiliyor(true)
    const { error } = await supabase.auth.signInWithPassword({
      phone: eFormatli,
      password: sifre,
    })
    setGonderiliyor(false)

    if (error) {
      setHata(error.message)
      return
    }
    router.replace('/')
  }

  return (
    <View style={stiller.sayfa}>
      <View style={stiller.ust}>
        {/* Kelime markasi: marka adini da gosteriyor. Isaret yerine
            burada yazi kullaniliyor - uygulamayi ilk acan kisi adi
            gormeli. */}
        <MarkaYazisi genislik={200} />
      </View>

      <View style={stiller.form}>
        <TextInput
          style={[stiller.girdi, odaklanan === 'telefon' && stiller.girdiOdakli]}
          placeholder={t('giris.telefonYerTutucu')}
          placeholderTextColor={renk.metinSoluk}
          keyboardType="phone-pad"
          autoComplete="tel"
          value={telefon}
          onChangeText={setTelefon}
          onFocus={() => setOdaklanan('telefon')}
          onBlur={() => setOdaklanan(null)}
        />
        <TextInput
          style={[stiller.girdi, odaklanan === 'sifre' && stiller.girdiOdakli]}
          placeholder={t('giris.sifreYerTutucu')}
          placeholderTextColor={renk.metinSoluk}
          secureTextEntry
          autoComplete="current-password"
          value={sifre}
          onChangeText={setSifre}
          onFocus={() => setOdaklanan('sifre')}
          onBlur={() => setOdaklanan(null)}
        />

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {/* Alanlar bosken buton soluk: basmadan once ne bekledigi
            belli oluyor. Yine de basilabilir ve eksigi soyluyor -
            devre disi bir buton neyin eksik oldugunu anlatmiyor. */}
        <Pressable
          style={({ pressed }) => [
            stiller.birincil,
            !hazir && stiller.birincilSoluk,
            pressed && stiller.birincilBasili,
          ]}
          onPress={girisYap}
          disabled={gonderiliyor}
          accessibilityRole="button"
        >
          <Text style={stiller.birincilYazi}>
            {gonderiliyor ? t('giris.gonderiliyor') : t('giris.gonder')}
          </Text>
        </Pressable>
      </View>

      <View style={stiller.esnekBosluk} />

      <Pressable
        style={({ pressed }) => [stiller.ikincil, pressed && stiller.ikincilBasili]}
        onPress={() => router.push('/kayit')}
        accessibilityRole="button"
      >
        <Text style={stiller.ikincilYazi}>{t('giris.kayitOl')}</Text>
      </Pressable>

    </View>
  )
}

const stiller = StyleSheet.create({
  sayfa: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.xl,
    paddingTop: 96,
    paddingBottom: bosluk.xl,
  },

  ust: { alignItems: 'center', marginBottom: 56 },

  form: { gap: bosluk.m },
  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 16,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  girdiOdakli: { borderColor: renk.turuncu },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    paddingHorizontal: bosluk.xs,
  },

  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: bosluk.xs,
  },
  birincilSoluk: { opacity: 0.45 },
  birincilBasili: { backgroundColor: renk.turuncuKoyu },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.altBaslik,
    color: '#FFFFFF',
  },

  esnekBosluk: { flex: 1 },

  // Ikincil eylem CERCEVELI: ekranda tek turuncu dolgu kalsin diye.
  ikincil: {
    borderWidth: 1.5,
    borderColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ikincilBasili: { backgroundColor: renk.turuncuZemin },
  ikincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.turuncu,
  },

  marka: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.metinSoluk,
    textAlign: 'center',
    marginTop: bosluk.l,
  },
  markaNokta: { color: renk.turuncu },
})
