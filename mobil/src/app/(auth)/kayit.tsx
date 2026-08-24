import { useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { eFormatinaCevir } from '../../../lib/telefon'
import { kayitMetadatasi } from '../../../lib/kvkk'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'

const EN_AZ_SIFRE = 8

/** Onay kutusu. Dokunma hedefi satirin tamami. */
function OnayKutusu({
  isaretli,
  onDegis,
  children,
  etiket,
}: {
  isaretli: boolean
  onDegis: (yeni: boolean) => void
  children: React.ReactNode
  etiket: string
}) {
  return (
    <Pressable
      style={stiller.onaySatiri}
      onPress={() => onDegis(!isaretli)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isaretli }}
      accessibilityLabel={etiket}
    >
      <View style={[stiller.kutu, isaretli && stiller.kutuIsaretli]}>
        {isaretli && <Text style={stiller.tik}>✓</Text>}
      </View>
      <Text style={stiller.onayYazi}>{children}</Text>
    </Pressable>
  )
}

export default function KayitEkrani() {
  const router = useRouter()
  const [telefon, setTelefon] = useState('')
  const [dil, setDil] = useState<'tr' | 'en'>('tr')
  const [sifre, setSifre] = useState('')
  const [sifreTekrar, setSifreTekrar] = useState('')
  const [aydinlatma, setAydinlatma] = useState(false)
  const [konumRizasi, setKonumRizasi] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [odaklanan, setOdaklanan] = useState<string | null>(null)

  async function kayitOl() {
    setHata(null)

    const eFormatli = eFormatinaCevir(telefon)
    if (!eFormatli) {
      setHata('Geçerli bir telefon numarası gir.')
      return
    }
    if (sifre.length < EN_AZ_SIFRE) {
      setHata(`Şifre en az ${EN_AZ_SIFRE} karakter olmalı.`)
      return
    }
    if (sifre !== sifreTekrar) {
      setHata('Şifreler aynı değil. İkisini de kontrol et.')
      return
    }
    // Aydinlatma onayi olmadan hesap acilamaz. Acik riza (konum) ise
    // KVKK geregi OZGUR IRADEYLE verilmeli; hizmetin kosulu yapilamaz.
    // Bu yuzden yalnizca aydinlatma zorunlu tutuluyor.
    if (!aydinlatma) {
      setHata('Devam etmek için gizlilik metnini kabul etmen gerekiyor.')
      return
    }

    setGonderiliyor(true)
    const { error } = await supabase.auth.signUp({
      phone: eFormatli,
      password: sifre,
      options: { data: kayitMetadatasi({ aydinlatma, konumRizasi }, dil) },
    })
    setGonderiliyor(false)

    if (error) {
      setHata(error.message)
      return
    }
    router.push(`/dogrula?telefon=${encodeURIComponent(eFormatli)}`)
  }

  function girdiStili(alan: string) {
    return [stiller.girdi, odaklanan === alan && stiller.girdiOdakli]
  }

  return (
    <ScrollView style={stiller.sayfa} contentContainerStyle={stiller.icerik}>
      <Text style={stiller.marka}>
        slooin<Text style={stiller.markaNokta}>.</Text>
      </Text>

      <Text style={stiller.baslik}>Hesabını oluştur</Text>
      <Text style={stiller.altYazi}>
        Numaranı doğrulayacağız. Numaran profilinde görünmez.
      </Text>

      <Text style={stiller.etiket}>Telefon numarası</Text>
      <TextInput
        style={girdiStili('telefon')}
        placeholder="05XX XXX XX XX"
        placeholderTextColor={renk.metinSoluk}
        keyboardType="phone-pad"
        autoComplete="tel"
        value={telefon}
        onChangeText={setTelefon}
        onFocus={() => setOdaklanan('telefon')}
        onBlur={() => setOdaklanan(null)}
      />

      <Text style={stiller.etiket}>Uygulama dili</Text>
      <View style={stiller.dilSatiri}>
        <Pressable
          style={[stiller.dilCipi, dil === 'tr' && stiller.dilCipiSecili]}
          onPress={() => setDil('tr')}
          accessibilityRole="radio"
          accessibilityState={{ selected: dil === 'tr' }}
        >
          <Text style={[stiller.dilYazi, dil === 'tr' && stiller.dilYaziSecili]}>Türkçe</Text>
        </Pressable>
        {/* Ingilizce arayuz henuz hazir degil. Secilebilir gostermek
            yaniltici olurdu: kullanici Ingilizce secip Turkce bir
            uygulama gorurdu. Tercih alani simdiden duruyor ki ceviri
            geldiginde kullaniciya yeniden sorulmasin. */}
        <View style={[stiller.dilCipi, stiller.dilCipiPasif]}>
          <Text style={stiller.dilYaziPasif}>English</Text>
          <Text style={stiller.yakinda}>yakında</Text>
        </View>
      </View>

      <Text style={stiller.etiket}>Şifre</Text>
      <TextInput
        style={girdiStili('sifre')}
        placeholder={`En az ${EN_AZ_SIFRE} karakter`}
        placeholderTextColor={renk.metinSoluk}
        secureTextEntry
        autoComplete="new-password"
        value={sifre}
        onChangeText={setSifre}
        onFocus={() => setOdaklanan('sifre')}
        onBlur={() => setOdaklanan(null)}
      />

      <Text style={stiller.etiket}>Şifreyi tekrar gir</Text>
      <TextInput
        style={girdiStili('tekrar')}
        placeholder="Aynı şifreyi bir kez daha"
        placeholderTextColor={renk.metinSoluk}
        secureTextEntry
        autoComplete="new-password"
        value={sifreTekrar}
        onChangeText={setSifreTekrar}
        onFocus={() => setOdaklanan('tekrar')}
        onBlur={() => setOdaklanan(null)}
      />
      {/* Uyusmazlik yazarken soyleniyor, gonderdikten sonra degil. */}
      {sifreTekrar.length > 0 && sifre !== sifreTekrar && (
        <Text style={stiller.uyari}>Şifreler henüz aynı değil.</Text>
      )}

      <View style={stiller.onayBolumu}>
        <OnayKutusu
          isaretli={aydinlatma}
          onDegis={setAydinlatma}
          etiket="Gizlilik metnini okudum ve kabul ediyorum"
        >
          <Text>
            Gizlilik metnini okudum, kişisel verilerimin burada anlatıldığı şekilde işlenmesini
            kabul ediyorum.{' '}
          </Text>
          <Text
            style={stiller.baglantiYazi}
            onPress={() => router.push('/gizlilik')}
            accessibilityRole="link"
          >
            Metni oku
          </Text>
        </OnayKutusu>

        {/* Acik riza AYRI bir onaydir ve zorunlu DEGILDIR: KVKK'ya gore
            acik riza ozgur iradeyle verilmeli, hizmetin on kosulu
            yapilamaz. Rizasiz da hesap acilir; konum isteyen ekranlar
            o zaman rizayi ayrica sorar. */}
        <OnayKutusu
          isaretli={konumRizasi}
          onDegis={setKonumRizasi}
          etiket="Konum verimin işlenmesine açık rıza veriyorum"
        >
          Yakınımdaki mekânları ve orada olan kişileri görebilmem için konum verimin
          işlenmesine açık rıza veriyorum. Bu onayı sonradan geri çekebilirim.
        </OnayKutusu>

        <Text style={stiller.onayNotu}>
          Açık rıza zorunlu değil. Vermezsen de hesabını açabilirsin; konum gerektiren
          bölümlerde tekrar sorulur.
        </Text>
      </View>

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Pressable
        style={({ pressed }) => [
          stiller.birincil,
          pressed && stiller.birincilBasili,
          gonderiliyor && stiller.birincilPasif,
        ]}
        onPress={kayitOl}
        disabled={gonderiliyor}
        accessibilityRole="button"
      >
        <Text style={stiller.birincilYazi}>
          {gonderiliyor ? 'Gönderiliyor…' : 'Hesap oluştur'}
        </Text>
      </Pressable>

      <Pressable
        style={stiller.ikincil}
        onPress={() => router.push('/giris')}
        accessibilityRole="button"
      >
        <Text style={stiller.ikincilYazi}>
          Zaten hesabın var mı? <Text style={stiller.ikincilVurgu}>Giriş yap</Text>
        </Text>
      </Pressable>
    </ScrollView>
  )
}

const stiller = StyleSheet.create({
  sayfa: { flex: 1, backgroundColor: renk.zemin },
  icerik: { padding: bosluk.xl, paddingTop: 64, paddingBottom: bosluk.xxl },

  marka: {
    fontFamily: yazi.baslikKalin,
    fontSize: 22,
    color: renk.metin,
    letterSpacing: -0.5,
  },
  markaNokta: { color: renk.turuncu },

  baslik: {
    fontFamily: yazi.baslik,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginTop: bosluk.xl,
  },
  altYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
    marginTop: bosluk.s,
    marginBottom: bosluk.l,
  },

  etiket: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.l,
    marginBottom: bosluk.s,
  },
  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 14,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  girdiOdakli: { borderColor: renk.turuncu },
  uyari: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.s,
  },

  // --- Dil ---
  dilSatiri: { flexDirection: 'row', gap: bosluk.s },
  dilCipi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.s,
    paddingHorizontal: bosluk.l,
    paddingVertical: 10,
    borderRadius: yuvarlak.hap,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
  },
  dilCipiSecili: { borderColor: renk.turuncu, backgroundColor: renk.turuncuZemin },
  dilCipiPasif: { backgroundColor: 'transparent' },
  dilYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.govde, color: renk.metin },
  dilYaziSecili: { color: renk.turuncu },
  dilYaziPasif: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinSoluk },
  yakinda: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
  },

  // --- Onaylar ---
  onayBolumu: { marginTop: bosluk.xl, gap: bosluk.m },
  onaySatiri: { flexDirection: 'row', gap: bosluk.m, alignItems: 'flex-start' },
  kutu: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: renk.metinSoluk,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  kutuIsaretli: { backgroundColor: renk.turuncu, borderColor: renk.turuncu },
  tik: { color: '#FFFFFF', fontSize: 14, lineHeight: 18, fontFamily: yazi.govdeKalin },
  onayYazi: {
    flex: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
  },
  baglantiYazi: {
    fontFamily: yazi.govdeKalin,
    color: renk.metin,
    textDecorationLine: 'underline',
  },
  onayNotu: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    lineHeight: 16,
    color: renk.metinSoluk,
  },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginTop: bosluk.l,
  },

  // --- Eylemler ---
  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: bosluk.xl,
    ...golge.yuzer,
  },
  birincilBasili: { backgroundColor: renk.turuncuKoyu },
  birincilPasif: { opacity: 0.6 },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.altBaslik,
    color: '#FFFFFF',
  },
  ikincil: { alignItems: 'center', paddingVertical: bosluk.l },
  ikincilYazi: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil },
  ikincilVurgu: { fontFamily: yazi.govdeKalin, color: renk.metin },
})
