import { useEffect, useState } from 'react'
import { View, Text, Switch, Pressable, TextInput, StyleSheet } from 'react-native'
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

const VARSAYILAN_SECENEKLERI: { deger: Bulunurluk; etiket: string }[] = [
  { deger: 'herkese_acik', etiket: 'Herkese acik' },
  { deger: 'takipcilerim', etiket: 'Sadece takipcilerim' },
  { deger: 'gizli', etiket: 'Gizli' },
]

const ANI_GORUNURLUK_SECENEKLERI: { deger: AniGorunurlugu; etiket: string }[] = [
  { deger: 'herkese_acik', etiket: 'Herkes gorsun' },
  { deger: 'takipcilerim', etiket: 'Sadece takipcilerim gorsun' },
  { deger: 'kimse', etiket: 'Kimse gormesin' },
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

  async function ayarlariYukle() {
    try {
      setVarsayilanBulunurluk(await varsayilanBulunurluguGetir())
      setAramadaGorunsun(await aramadaGorunsunGetir())
      setKullaniciAdiDurumu(await kullaniciAdiDurumunuGetir())
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
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
      setKullaniciAdiSonucu('Kullanici adin guncellendi.')
      setYeniKullaniciAdi('')
    } catch (e) {
      setKullaniciAdiSonucu(e instanceof Error ? e.message : 'Bir sorun olustu')
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
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
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
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
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
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Gizlilik ayarlari</Text>
      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Text style={stiller.altBaslik}>Hesap</Text>
      {kullaniciAdiDurumu && (
        <Text style={stiller.ipucu}>Kullanici adin: @{kullaniciAdiDurumu.kullaniciAdi}</Text>
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
        placeholder="Yeni kullanici adi"
        autoCapitalize="none"
        value={yeniKullaniciAdi}
        onChangeText={setYeniKullaniciAdi}
      />
      <Pressable style={stiller.buton} onPress={kullaniciAdiniGuncelle}>
        <Text style={stiller.butonMetni}>Kullanici adini degistir</Text>
      </Pressable>
      {kullaniciAdiSonucu ? (
        <Text style={stiller.ipucu}>{kullaniciAdiSonucu}</Text>
      ) : (
        <Text style={stiller.ipucu}>{KULLANICI_ADI_KURALI}</Text>
      )}

      <Text style={stiller.altBaslik}>Yeni check-in'lerim varsayilan olarak</Text>
      <View style={stiller.butonSatiri}>
        {VARSAYILAN_SECENEKLERI.map((secenek) => (
          <Pressable
            key={secenek.deger}
            accessibilityLabel={`Varsayilan bulunurluk: ${secenek.deger}${
              varsayilanBulunurluk === secenek.deger ? ', secili' : ''
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
        <Text style={stiller.etiket}>Beni aramada goster</Text>
        <Switch
          accessibilityLabel="Aramada gorunurluk"
          value={aramadaGorunsun}
          onValueChange={aramadaGorunsunDegisti}
        />
      </View>

      <Text style={stiller.altBaslik}>Butun anilarimi kim gorsun</Text>
      <Text style={stiller.ipucu}>
        Bu secim butun anilarina uygulanir, ama gizli check-in'den donusen anilar bu ayardan
        etkilenmez ve kapali kalir.
      </Text>
      <View style={stiller.butonSatiri}>
        {ANI_GORUNURLUK_SECENEKLERI.map((secenek) => (
          <Pressable
            key={secenek.deger}
            accessibilityLabel={`Ani gorunurlugu: ${secenek.deger}${
              aniGorunurluk === secenek.deger ? ', secili' : ''
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
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
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
