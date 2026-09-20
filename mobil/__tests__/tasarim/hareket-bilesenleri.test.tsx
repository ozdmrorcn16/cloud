import { useState } from 'react'
import { Pressable, Text } from 'react-native'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { KademeliGiris, BosDurumGirisi } from '../../src/tasarim/KademeliGiris'
import { DurumGecisi } from '../../src/tasarim/DurumGecisi'
import { BasariDugmesi } from '../../src/tasarim/BasariDugmesi'
import { BegeniKalbi } from '../../src/tasarim/BegeniKalbi'

/**
 * Hareket bilesenleri (2026-09-20). Animasyonun KENDISI jest'te
 * olculmuyor (deger tablolari native driver'da); olculen sey davranis:
 * icerik dogru zamanda degisiyor mu, cocuk durumu korunuyor mu,
 * geri cagrilar dogru anda geliyor mu.
 */

function SayacliCocuk() {
  const [sayi, setSayi] = useState(0)
  return (
    <Pressable testID="artir" onPress={() => setSayi((s) => s + 1)}>
      <Text>sayi:{sayi}</Text>
    </Pressable>
  )
}

describe('KademeliGiris', () => {
  it('ebeveyn yeniden cizilince cocugu YENIDEN MOUNT ETMEZ (durum korunur)', async () => {
    // Yasanan hata: kume dolunca sarmal Fragment'a donuyor, kart yeniden
    // mount oluyor ve acik yorum sayfasi kayboluyordu.
    const kume = new Set<string>()
    function Ebeveyn() {
      const [, setTik] = useState(0)
      return (
        <>
          <Pressable testID="yeniden-ciz" onPress={() => setTik((t) => t + 1)}>
            <Text>ciz</Text>
          </Pressable>
          <KademeliGiris anahtar="a" sira={0} oynatilanlar={kume}>
            <SayacliCocuk />
          </KademeliGiris>
        </>
      )
    }
    await render(<Ebeveyn />)
    await fireEvent.press(screen.getByTestId('artir'))
    expect(screen.getByText('sayi:1')).toBeTruthy()
    expect(kume.has('a')).toBe(true)

    await fireEvent.press(screen.getByTestId('yeniden-ciz'))
    await fireEvent.press(screen.getByTestId('artir'))
    expect(screen.getByText('sayi:2')).toBeTruthy()
  })

  it('ayni kimlik ikinci mount\'ta kumeye tekrar eklenmez ama cocugu cizer', async () => {
    const kume = new Set<string>(['a'])
    await render(
      <KademeliGiris anahtar="a" sira={0} oynatilanlar={kume}>
        <Text>icerik</Text>
      </KademeliGiris>
    )
    expect(screen.getByText('icerik')).toBeTruthy()
    expect(kume.size).toBe(1)
  })

  it('BosDurumGirisi butun cocuklari cizer', async () => {
    await render(
      <BosDurumGirisi>
        <Text>baslik</Text>
        <Text>aciklama</Text>
        <Text>eylem</Text>
      </BosDurumGirisi>
    )
    expect(screen.getByText('baslik')).toBeTruthy()
    expect(screen.getByText('aciklama')).toBeTruthy()
    expect(screen.getByText('eylem')).toBeTruthy()
  })
})

describe('DurumGecisi', () => {
  it('anahtar degisince icerigi gecisle degistirir; ayni anahtarda aninda gunceller', async () => {
    function Ebeveyn() {
      const [hal, setHal] = useState<'ekle' | 'beklemede'>('ekle')
      const [sayi, setSayi] = useState(0)
      return (
        <>
          <Pressable testID="degistir" onPress={() => setHal('beklemede')}><Text>d</Text></Pressable>
          <Pressable testID="guncelle" onPress={() => setSayi((s) => s + 1)}><Text>g</Text></Pressable>
          <DurumGecisi anahtar={hal}>
            <Text>{hal === 'ekle' ? `Arkadaş ekle ${sayi}` : 'Beklemede'}</Text>
          </DurumGecisi>
        </>
      )
    }
    await render(<Ebeveyn />)
    expect(screen.getByText('Arkadaş ekle 0')).toBeTruthy()

    // Ayni hal, icerik degisti: gecis yok, aninda.
    await fireEvent.press(screen.getByTestId('guncelle'))
    expect(screen.getByText('Arkadaş ekle 1')).toBeTruthy()

    // Hal degisti: 110 ms cikis, sonra yeni icerik.
    await fireEvent.press(screen.getByTestId('degistir'))
    expect(await screen.findByText('Beklemede')).toBeTruthy()
    expect(screen.queryByText(/Arkadaş ekle/)).toBeNull()
  })
})

describe('BasariDugmesi', () => {
  const ortak = { etiket: 'Check-in yap', mesgulEtiketi: 'Gönderiliyor…', basariEtiketi: 'Şu an buradasın' }

  it('normal halde etiketi gosterir ve basilinca onPress calisir', async () => {
    const onPress = jest.fn()
    await render(<BasariDugmesi {...ortak} mesgul={false} basarili={false} onPress={onPress} onBasariBitti={jest.fn()} testID="dugme" />)
    expect(screen.getByText('Check-in yap')).toBeTruthy()
    expect(screen.queryByText('Şu an buradasın')).toBeNull()
    await fireEvent.press(screen.getByTestId('dugme'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('mesgulken basilamaz ve mesgul etiketi yazar', async () => {
    const onPress = jest.fn()
    await render(<BasariDugmesi {...ortak} mesgul basarili={false} onPress={onPress} onBasariBitti={jest.fn()} testID="dugme" />)
    expect(screen.getByText('Gönderiliyor…')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('dugme'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('basarili olunca durum satirini gosterir ve sure dolunca onBasariBitti cagirir', async () => {
    const bitti = jest.fn()
    await render(<BasariDugmesi {...ortak} mesgul={false} basarili onPress={jest.fn()} onBasariBitti={bitti} basariSuresi={200} testID="dugme" />)
    expect(screen.getByText('Şu an buradasın')).toBeTruthy()
    expect(screen.getByTestId('dugme-basari')).toBeTruthy()
    expect(bitti).not.toHaveBeenCalled()
    await waitFor(() => expect(bitti).toHaveBeenCalledTimes(1))
  })
})

describe('BegeniKalbi', () => {
  it('dolu ve bos halde cizilir', async () => {
    const { rerender } = await render(<BegeniKalbi dolu={false} />)
    expect(screen.getByTestId('begeni-kalbi')).toBeTruthy()
    await rerender(<BegeniKalbi dolu />)
    expect(screen.getByTestId('begeni-kalbi')).toBeTruthy()
  })
})
