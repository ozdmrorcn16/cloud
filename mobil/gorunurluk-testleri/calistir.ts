import { ikiKullaniciIleBaglan } from './yardimcilar'

async function main() {
  const { aId, bId } = await ikiKullaniciIleBaglan()
  console.log('A:', aId)
  console.log('B:', bId)
}

main()
