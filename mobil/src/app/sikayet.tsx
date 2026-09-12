import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { sikayetGonder, SIKAYET_SEBEPLERI, type SikayetHedefTuru } from '../../lib/sikayet'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../tasarim/tema'
import { useRenk, useStiller } from '../tasarim/tema-baglami'
import { UstCubuk } from '../tasarim/UstCubuk'
import { useDil } from '../../lib/dil'

export default function SikayetEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const { hedefTur, hedefId } = useLocalSearchParams<{
    hedefTur: SikayetHedefTuru
    hedefId: string
  }>()
  const [secilenSebep, setSecilenSebep] = useState<string | null>(null)
  const [aciklama, setAciklama] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [gonderildi, setGonderildi] = useState(false)

  async function gonder() {
    if (!secilenSebep) {
      setHata(t('sikayet.sebepSec'))
      return
    }
    setHata(null)
    setGonderiliyor(true)
    try {
      await sikayetGonder(hedefTur, hedefId, secilenSebep, aciklama.trim() || undefined)
      setGonderildi(true)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setGonderiliyor(false)
    }
  }

  if (gonderildi) {
    return (
      <View style={stiller.kapsayici}>
        <Text style={stiller.baslik}>{t('sikayet.alindi')}</Text>
        <Text style={stiller.teyitMetni}>{t('sikayet.tesekkur')}</Text>
        <Pressable style={stiller.buton} onPress={() => router.back()}>
          <Text style={stiller.butonYazi}>{t('ortak.kapat')}</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={stiller.kapsayici}>
      <UstCubuk baslik={t('sikayet.baslik')} geriEtiketi={t('ortak.geri')} />

      {/* Karar 76: kademe 1 baglami sikayet edenin kendi konusmasindan
          da mesaj tasir, bu yuzden bildirilir. Ayri bir onay kutusu YOK -
          sikayeti gondermek zaten iradi bir eylem ve ek surtunme sikayet
          etmeyi caydirir. */}
      {hedefTur === 'mesaj' && (
        <Text style={stiller.baglamBildirimi}>
          {t('sikayet.mesajBaglami')}
        </Text>
      )}

      {SIKAYET_SEBEPLERI.map((sebep) => (
        <Pressable
          key={sebep.anahtar}
          style={[
            stiller.sebepSatiri,
            secilenSebep === sebep.anahtar && stiller.sebepSatiriSecili,
          ]}
          onPress={() => setSecilenSebep(sebep.anahtar)}
        >
          <Text style={stiller.sebepYazi}>{t(`sikayet.sebepler.${sebep.anahtar}`)}</Text>
        </Pressable>
      ))}

      <TextInput
        style={[stiller.girdi, stiller.cokSatirli]}
        placeholder={t('sikayet.aciklamaYerTutucu')}
        value={aciklama}
        onChangeText={setAciklama}
        multiline
      />

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Pressable style={stiller.buton} onPress={gonder} disabled={gonderiliyor}>
        <Text style={stiller.butonYazi}>{gonderiliyor ? t('ortak.gonderiliyor') : t('ortak.gonder')}</Text>
      </Pressable>
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.sayfa,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginBottom: bosluk.m,
  },
  baglamBildirimi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginBottom: bosluk.m,
  },

  sebepSatiri: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    padding: bosluk.l,
    marginBottom: bosluk.s,
  },
  sebepSatiriSecili: { borderColor: renk.turuncu, backgroundColor: renk.turuncuZemin },
  sebepYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
  },

  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    padding: bosluk.l,
    marginTop: bosluk.s,
    marginBottom: bosluk.m,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  cokSatirli: { minHeight: 90, textAlignVertical: 'top' },

  teyitMetni: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginBottom: bosluk.xl,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    marginBottom: bosluk.m,
  },

  buton: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: bosluk.m,
  },
  butonYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
})
