# 🎹 Emochord v2 – Piyano & MIDI Pratik Stüdyosu

<p align="center">
  <a href="README.md">English</a> •
  <a href="README.tr.md"><strong>Türkçe</strong></a>
</p>

**Emochord v2**, "düşen nota" (falling notes) akışıyla piyano çalmayı, müzik parçalarını görselleştirmeyi ve etkileşimli MIDI pratiği yapmayı sağlayan modern bir müzik stüdyosudur. USB/MIDI org, bilgisayar klavyesi veya fare ile tam uyumlu çalışır.

Uygulama **%100 çevrimdışı (offline)** çalışır; üyelik gerektirmez, internet bağlantısı aramaz ve hiçbir telemetri/kullanıcı verisi toplamaz.

---

## ✨ Emochord Ne Yapar? (Özellikler & Modlar)

Emochord, standart `.mid` / `.midi` dosyalarını yukarıdan piyano tuşlarına doğru akan görsel bir nota şeridine dönüştürür. Pasif dinleme yerine kas hafızasını geliştiren 4 farklı çalışma modu sunar:

### 1. 🎯 4 Farklı Çalışma Modu
* **Tuş Beklemeli Pratik (Wait Mode):** Notalar tuş hizasına geldiğinde şarkı duraklar ve siz piyano/MIDI klavyenizden **doğru tuşa basana kadar bekler**. Yanlış tuşa basarsanız ilerlemez; eşlik eden diğer el notalarıyla senkronu asla kaybetmez. Kendi hızınızda parça öğrenmek için idealdir.
* **Ritim Pratiği:** Notalar seçtiğiniz tempoda sürekli akar. Vuruş zamanlamanız anlık olarak ölçülür (Mükemmel, İyi, Kaçırdı) ve kombo çarpanlarıyla skorunuz hesaplanır.
* **Serbest Çalma Modu:** Tıpkı gerçek bir piyano gibi özgürce çalın. Bastığınız notalar yukarı doğru akar ve çaldığınız tüm performans tek tıkla standart MIDI (`.mid`) dosyası olarak kaydedilebilir.
* **İzle & Dinle Modu:** Seçtiğiniz veya yüklediğiniz eseri arkanıza yaslanıp yüksek çözünürlüklü nota akışı ve tuş aydınlatmaları eşliğinde dinleyin.

### 2. 🎼 Anlık Müzik Analizi & HUD Göstergeleri
* **Canlı Akor Algılama:** Çaldığınız veya dinlediğiniz notaların harmonik akor karşılığını (ör. *Do Majör, Am7, F#dim*) üstteki yüzen HUD panelinde anlık olarak gösterir.
* **El Ayrımı (Sağ / Sol El):** MIDI parçalarını akıllıca sağ el (yeşil) ve sol el (mavi) olarak ayırır. İsterseniz sadece sağ eli, sadece sol eli veya iki eli birlikte çalışabilirsiniz.
* **A-B Döngüsü (Loop):** Zorlandığınız bir ölçü veya pasajı A ve B noktaları belirleyerek siz öğrenene kadar otomatik döngüde tekrar eder.
* **Sustain Pedalı Desteği:** Fiziksel USB MIDI sustain pedallarını ve bilgisayar klavyesindeki Boşluk (Space) tuşunu doğal tel rezonans sönümlemesiyle destekler.

### 3. 🎨 Dikkat Dağıtmayan Sade Arayüz
* **Ekran Boyu İlerleme Çubuğu:** Parçanın herhangi bir saniyesine tıklayarak veya sürükleyerek anında atlayın (seek); üzerine geldiğinizde zaman önizlemesini görün.
* **Sade Tuş Aydınlatması:** Basılan tuş, notanın rengine bürünür (sağ el yeşil, sol el mavi). Gözü yoran patlama/kıvılcım efektlerinden arındırılmıştır.
* **Farklı Klavye Boyutları:** 88 tuş (tam piyano), 61 tuş (standart org), 49 tuş (stüdyo) veya 37 tuş (kompakt) görünümleri arasında tek tıkla geçiş.
* **3 Çizgi Ayarlar Çekmecesi (`M` Tuşu):** Ekranın %98'ini nota akışına bırakır; tempo (%25 - %200), enstrüman ve parça seçimi soldan açılan çekmecede toplanmıştır.

### 4. 🔊 Dahili Web Audio Ses Motoru
* Hiçbir harici ses bankası (GB'larca sample) indirmeye gerek kalmadan 4 dahili enstrüman:
  * 🎹 **Konser Piyanosu (Grand Piano)**
  * ✨ **Elektrik Piyano (Rhodes EP)**
  * 🎛️ **Neon Synth**
  * ⛪ **Kilise / Hammond Orgu**

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
* [Node.js](https://nodejs.org/) (Sürüm 18 veya üzeri tavsiye edilir)
* npm (Node.js ile birlikte gelir)

### Kurulum

```bash
git clone https://github.com/<KULLANICI_ADINIZ>/emochord-v2.git
cd emochord-v2
npm install
```

### Uygulamayı Başlatma

```bash
# 1. Masaüstü Uygulaması (Electron):
npm start

# 2. Tarayıcı Modu (http://127.0.0.1:3030 adresinde açılır):
npm run web

# 3. Otomatik Birim Testlerini Çalıştırma:
npm test
```

### Kurulum Paketleri (Binary) Oluşturma

```bash
# Linux AppImage derlemek için:
npm run dist

# Windows Portable (.exe) derlemek için:
npm run dist:win

# Her ikisini derlemek için:
npm run dist:all
```
Çıktılar `dist/` klasörüne aktarılır.

---

## 📁 Dahili Örnek Eserler

Uygulama içinde hemen pratik yapabileceğiniz kamu malı (Public Domain) klasik eserler yer almaktadır:
* **Ludwig van Beethoven:** *Für Elise*
* **Ludwig van Beethoven:** *Neşeye Övgü (Ode to Joy)*
* **Wolfgang Amadeus Mozart:** *Türk Marşı (Alla Turca)*
* **Johann Sebastian Bach:** *Do Majör Prelüd (BWV 846)*
* **Geleneksel:** *Twinkle, Twinkle, Little Star (Daha Kolay Pratik)*

Kendi istediğiniz herhangi bir `.mid` veya `.midi` dosyasını arayüzdeki **MIDI Dosyası Aç** düğmesiyle yükleyebilirsiniz.

---

## 🔒 Gizlilik ve Çevrimdışı Güvencesi

* **Tamamen Çevrimdışı:** İnternet erişimi, dış CDN bağlantısı, analitik veya izleme çerezleri bulunmaz.
* **Veri Toplanmaz:** Çaldıklarınız ve kaydettiğiniz MIDI'ler yalnızca sizin bilgisayarınızda kalır.

---

## 📄 Lisans

Bu proje **MIT Lisansı** altında yayınlanmıştır. Ayrıntılar için [LICENSE](./LICENSE) dosyasına bakın.

*Not: Emochord, bağımsız bir açık kaynak projedir. Adı geçen üçüncü taraf ticari donanım veya yazılım markalarıyla bağlantılı değildir.*
