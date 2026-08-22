import { useEffect, useState } from 'react'
import { View, Text, Switch, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native'
import {
  varsayilanBulunurluguGetir,
  varsayilanBulunurluguAyarla,
  aniGorunurlugunuAyarla,
  aramadaGorunsunGetir,
  aramadaGorunsunAyarla,
  kullaniciAdiDurumunuGetir,
} from '../../../lib/ayarlar'
import type { Bulunurluk, AniGorunurlugu } from '../../../lib/checkin'
import {
  KULLANICI_ADI_KURALI,
  kullaniciAdiGecerliMi,
  kullaniciAdiniNormallestir,
  kullaniciAdiniDegistir,
} from '../../../lib/kullanici-adi'
import { router } from 'expo-router'
import { hesabiDondur } from '../../../lib/hesap'
import { supabase } from '../../../lib/supabase'

const VARSAYILAN_SECENEKLERI: { deger: Bulunurluk; etiket: string }[] = [
  { deger: 'herkese_acik', etiket: 'Herkese açık' },
  { deger: 'takipcilerim', etiket: 'Sadece takipçilerim' },
  { deger: 'gizli', etiket: 'Gizli' },
]

const ANI_GORUNURLUK_SECENEKLERI: { deger: AniGorunurlugu; etiket: string }[] = [
  { deger: 'herkese_acik', etiket: 'Herkes görsün' },
  { deger: 'takipcilerim', etiket: 'Sadece takipçilerim görsün' },
  { deger: 'kimse', etiket: 'Kimse görmesin' },
]

function tarihiBicimlendir(tarih: Date): string {
  const gun = String(tarih.getDate()).padStart(2, '0')
  const ay = String(tarih.getMonth() + 1).padStart(2, '0')
  const yil = tarih.getFullYear()
  return `${gun}.${ay}.${yil}`
}

export default function AyarlarEkrani() {
  const [varsayilanBulunurluk, setVarsayilanBulunurluk] = useState<Bulunurluk>('herkese_acik')
  // Bu bir sunucudan gelen kalici tercih degil (RPC her cagrildiginda
  // butun anilara uygulanan toplu bir eylem) - son basarili secimi
  // gostermek icin yalnizca yerel. Baslangicta null: henuz hicbir secim
  // yapilmadi, hicbir cip secili gorunmemeli.
  const [aniGorunurluk, setAniGorunurluk] = useState<AniGorunurlugu | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [yeniKullaniciAdi, setYeniKullaniciAdi] = useState('')
  const [kullaniciAdiSonucu, setKullaniciAdiSonucu] = useState<string | null>(null)
  const [aramadaGorunsun, setAramadaGorunsun] = useState(true)
  const [kullaniciAdiDurumu, setKullaniciAdiDurumu] = useState<{
    kullaniciAdi: string
    sonrakiDegisimTarihi: Date | null
  } | null>(null)
  const [dondurmaOnayi, setDondurmaOnayi] = useState(false)

  async function hesabiDondurmayiOnayla() {
    try {
      await hesabiDondur()
      // Dondurmadan hemen sonra cikis: aksi halde kullanici dondurulmus
      // ama girisli bir ara durumda kalirdi (spec karar 66).
      await supabase.auth.signOut()
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    } finally {
      setDondurmaOnayi(false)
    }
  }

  async function ayarlariYukle() {
    try {
      setVarsayilanBulunurluk(await varsayilanBulunurluguGetir())
      setAramadaGorunsun(await aramadaGorunsunGetir())
      setKullaniciAdiDurumu(await kullaniciAdiDurumunuGetir())
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  async function kullaniciAdiniGuncelle() {
    const normal = kullaniciAdiniNormallestir(yeniKullaniciAdi)
    if (!kullaniciAdiGecerliMi(normal)) {
      setKullaniciAdiSonucu(KULLANICI_ADI_KURALI)
      return
    }
    try {
      await kullaniciAdiniDegistir(normal)
      setKullaniciAdiSonucu('Kullanıcı adın güncellendi.')
      setYeniKullaniciAdi('')
    } catch (e) {
      setKullaniciAdiSonucu(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  async function aramadaGorunsunDegisti(deger: boolean) {
    const oncekiDeger = aramadaGorunsun
    setAramadaGorunsun(deger)
    try {
      await aramadaGorunsunAyarla(deger)
      setHata(null)
    } catch (e) {
      setAramadaGorunsun(oncekiDeger)
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  useEffect(() => {
    ayarlariYukle()
  }, [])

  async function varsayilanDegisti(deger: Bulunurluk) {
    const onceki = varsayilanBulunurluk
    setVarsayilanBulunurluk(deger)
    try {
      await varsayilanBulunurluguAyarla(deger)
      setHata(null)
    } catch (e) {
      setVarsayilanBulunurluk(onceki)
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  async function aniGorunurluguDegistir(deger: AniGorunurlugu) {
    const onceki = aniGorunurluk
    setAniGorunurluk(deger)
    try {
      await aniGorunurlugunuAyarla(deger)
      setHata(null)
    } catch (e) {
      setAniGorunurluk(onceki)
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  return (
    // Duzeltme turu 1 (Minor, kod incelemesi): kok eskiden `flex: 1`
    // View'di ve alt tarafta bes bolum vardi - telefonda "Hesabimi sil"
    // butonu ekranin en dibinde kalip kaydirilamayabiliyordu. ScrollView'a
    // cevrildi.
    <ScrollView style={stiller.kaydirici} contentContainerStyle={stiller.kapsayici}>
      <Text style={stiller.baslik}>Gizlilik ayarları</Text>
      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Text style={stiller.altBaslik}>Hesap</Text>
      {kullaniciAdiDurumu && (
        <Text style={stiller.ipucu}>Kullanıcı adın: @{kullaniciAdiDurumu.kullaniciAdi}</Text>
      )}
      {kullaniciAdiDurumu?.sonrakiDegisimTarihi &&
        kullaniciAdiDurumu.sonrakiDegisimTarihi > new Date() && (
          <Text style={stiller.ipucu}>
            Tekrar degistirebilecegin tarih:{' '}
            {tarihiBicimlendir(kullaniciAdiDurumu.sonrakiDegisimTarihi)}
          </Text>
        )}
      <TextInput
        style={stiller.girdi}
        placeholder="Yeni kullanıcı adı"
        autoCapitalize="none"
        value={yeniKullaniciAdi}
        onChangeText={setYeniKullaniciAdi}
      />
      <Pressable style={stiller.buton} onPress={kullaniciAdiniGuncelle}>
        <Text style={stiller.butonMetni}>Kullanıcı adını değiştir</Text>
      </Pressable>
      {kullaniciAdiSonucu ? (
        <Text style={stiller.ipucu}>{kullaniciAdiSonucu}</Text>
      ) : (
        <Text style={stiller.ipucu}>{KULLANICI_ADI_KURALI}</Text>
      )}

      <Pressable style={stiller.buton} onPress={() => router.push('/gizlilik')}>
        <Text style={stiller.butonMetni}>Gizlilik metni</Text>
      </Pressable>

      <Text style={stiller.altBaslik}>Yeni check-in'lerim varsayılan olarak</Text>
      <View style={stiller.butonSatiri}>
        {VARSAYILAN_SECENEKLERI.map((secenek) => (
          <Pressable
            key={secenek.deger}
            accessibilityLabel={`Varsayılan bulunurluk: ${secenek.deger}${
              varsayilanBulunurluk === secenek.deger ? ', seçili' : ''
            }`}
            style={[
              stiller.buton,
              varsayilanBulunurluk === secenek.deger && stiller.butonSecili,
            ]}
            onPress={() => varsayilanDegisti(secenek.deger)}
          >
            <Text
              style={[
                stiller.butonMetni,
                varsayilanBulunurluk === secenek.deger && stiller.butonMetniSecili,
              ]}
            >
              {secenek.etiket}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={stiller.satir}>
        <Text style={stiller.etiket}>Beni aramada göster</Text>
        <Switch
          accessibilityLabel="Aramada görünürlük"
          value={aramadaGorunsun}
          onValueChange={aramadaGorunsunDegisti}
        />
      </View>

      <Text style={stiller.altBaslik}>Bütün anılarımı kim görsün</Text>
      <Text style={stiller.ipucu}>
        Bu secim butun anilarina uygulanir, ama gizli check-in'den donusen anilar bu ayardan
        etkilenmez ve kapali kalir.
      </Text>
      <View style={stiller.butonSatiri}>
        {ANI_GORUNURLUK_SECENEKLERI.map((secenek) => (
          <Pressable
            key={secenek.deger}
            accessibilityLabel={`Anı görünürlüğü: ${secenek.deger}${
              aniGorunurluk === secenek.deger ? ', seçili' : ''
            }`}
            style={[
              stiller.buton,
              aniGorunurluk === secenek.deger && stiller.butonSecili,
            ]}
            onPress={() => aniGorunurluguDegistir(secenek.deger)}
          >
            <Text
              style={[
                stiller.butonMetni,
                aniGorunurluk === secenek.deger && stiller.butonMetniSecili,
              ]}
            >
              {secenek.etiket}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={stiller.altBaslik}>Hesabı dondur</Text>
      <Text style={stiller.ipucu}>
        Verilerin silinmez. Tekrar giris yaptiginda hesabin kendiliginden
        aktif olur.
      </Text>
      {!dondurmaOnayi ? (
        <Pressable style={stiller.buton} onPress={() => setDondurmaOnayi(true)}>
          <Text style={stiller.butonMetni}>Hesabımı dondur</Text>
        </Pressable>
      ) : (
        <View style={stiller.butonSatiri}>
          <Pressable style={stiller.buton} onPress={hesabiDondurmayiOnayla}>
            <Text style={stiller.butonMetni}>Evet, dondur</Text>
          </Pressable>
          <Pressable style={stiller.buton} onPress={() => setDondurmaOnayi(false)}>
            <Text style={stiller.butonMetni}>Vazgeç</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        style={stiller.buton}
        onPress={() => router.push('/profil/hesabi-sil')}
      >
        <Text style={stiller.butonMetni}>Hesabımı sil</Text>
      </Pressable>
    </ScrollView>
  )
}

const stiller = StyleSheet.create({
  kaydirici: { flex: 1 },
  kapsayici: { padding: 16 },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  altBaslik: { fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  satir: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  etiket: { fontSize: 16, flex: 1, marginRight: 12 },
  butonSatiri: { flexDirection: 'row', gap: 12 },
  buton: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  butonSecili: { backgroundColor: '#111' },
  butonMetni: { color: '#0645ad', fontWeight: '600' },
  // #111 zemin uzerinde onceki mavi (#0645ad) yaklasik 2.2:1 kontrast
  // veriyordu (esik 4.5:1) ve bu cip kullanicinin gizlilik tercihinin
  // TEK gostergesiydi. Beyaz metin #111 uzerinde ~19:1 kontrast verir.
  butonMetniSecili: { color: '#fff' },
  hata: { color: '#c00', marginBottom: 12 },
  girdi: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 8 },
  ipucu: { color: '#555', marginBottom: 12 },
})
