# 🎹 Emochord v2 – Piyano & MIDI Pratik Stüdyosu

**Emochord v2**, "düşen nota" (falling notes) akışıyla piyano çalmayı, görselleştirmeyi ve MIDI pratiği yapmayı kolaylaştıran modern bir stüdyodur. Tamamen çevrimdışı çalışır; hiçbir dış servise veri göndermez.

---

## 🌟 v2 Yenilikleri & Özellikleri

1. **Sade Ekran Boyu İlerleme Çubuğu (Full-Width Timeline)**:
   - Ekranın en üstünde boydan boya uzanan şık ve sade ilerleme çubuğu.
   - Çubuğun üzerine tıkladığınız veya sürüklediğiniz herhangi bir saniyeye anında geçiş (seek) yapar.
   - Fare ile üzerine gelindiğinde anlık zaman önizleme göstergesi sunar.

2. **3 Çizgi (Hamburger) Ayarlar Çekmecesi**:
   - Üst ilerleme çubuğunun hemen sol altında yer alan modern 3 çizgi (☰) menü butonu (`M` kısayolu).
   - Tıklandığında sahneyi kapatmadan soldan kayarak açılan düzenli ayarlar çekmecesi.
   - Parça seçimi, MIDI dosyası açma, kayıt, tempo, el seçimi, tuş boyutu (88/61/49/37), enstrüman, renk teması ve ses kontrolleri tek bir düzenli panelde toplanmıştır.
   - Sahneye tam odaklanma için ekranın %98'i nota akışına ve klavyeye ayrılmıştır.

3. **Tuş Aydınlatması**:
   - Ateşli patlama ve kıvılcım efektleri kaldırılarak tuş basımları sadeleştirildi.
   - Tuşa basıldığı an (MIDI org veya klavye ile) tuş doğrudan notanın rengine bürünür (sağ el notası yeşilse tuş yeşil, sol el mavisiyse mavi olur).

4. **Kapsamlı Pratik & MIDI Desteği**:
   - **Tuş Beklemeli Pratik (Wait Mode):** Notalar tuşa gelince şarkı duraklar, doğru tuşa basınca devam eder.
   - **Ritim Pratiği & İzle-Dinle.**
   - **A-B Döngüsü:** Zor pasajları tekrar tekrar çalışma.
   - **USB/MIDI Org & Klavye:** Tak-çalıştır otomatik algılama.

---

## 🚀 Çalıştırma

```bash
cd emochord-v2

# Masaüstü uygulaması (Electron):
npm start

# Tarayıcıda çalıştırmak için (http://127.0.0.1:3030):
npm run web

# Birim testlerini çalıştırmak için:
npm test
```

---

## 📁 MIDI Örnekleri Hakkında

`assets/midi/` klasöründeki eserlerin **besteleri** kamu malıdır (Bach, Beethoven, Mozart ve geleneksel "Twinkle Twinkle Little Star"). Dosyalar uygulamayla birlikte gelen eğitim amaçlı örneklerdir. Eğer bu dosyaları kendi aranjmanlarınızla değiştirmek isterseniz, klasöre istediğiniz `.mid` dosyasını ekleyip arayüzden açabilirsiniz.

---

## 📄 Lisans

Bu proje **MIT Lisansı** altında yayınlanmıştır. Ayrıntılar için [LICENSE](./LICENSE) dosyasına bakın.

**Not:** Emochord, bağımsız bir açık kaynak projedir. Adı geçen üçüncü taraf ticari ürün ve markalarla bağlantılı değildir.
