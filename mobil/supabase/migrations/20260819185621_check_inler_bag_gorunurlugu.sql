drop policy "check-in gorunurlugu" on public.check_inler;

create policy "check-in gorunurlugu"
  on public.check_inler for select to authenticated
  using (
    -- Sahibi her zaman kendi satirini gorur; kalan kurallarin hicbiri
    -- onun icin degerlendirilmez.
    kullanici_id = auth.uid()
    or (
      -- Engelleme her seyin onunde: iki yonden biri varsa hicbir sey
      -- gorunmez. Dogrudan alt sorgu kullanilamaz, cunku engellemeler
      -- tablosunun RLS'i "beni kim engelledi" yonunu gostermiyor.
      not gizli.engelli_mi(check_inler.kullanici_id)
      and case
        -- Ani (konum bos): ani ekseni karar verir.
        when konum is null then
          gorunurluk = 'herkese_acik'
          or (
            gorunurluk = 'takipcilerim'
            and bag.takip_ediyor_mu(auth.uid(), check_inler.kullanici_id)
          )
        -- Canli check-in: bulunurluk ekseni karar verir.
        else
          (
            bulunurluk = 'herkese_acik'
            and (
              gizli.ayni_mekanda_canli_mi(check_inler.mekan_id)
              or bag.takip_ediyor_mu(auth.uid(), check_inler.kullanici_id)
            )
          )
          or (
            bulunurluk = 'takipcilerim'
            and bag.takip_ediyor_mu(auth.uid(), check_inler.kullanici_id)
          )
        -- bulunurluk = 'gizli' hicbir kola girmez: yalnizca sahibi gorur.
      end
    )
  );
