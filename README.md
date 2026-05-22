# Furniture Profitability Dashboard | Insight Bisnis 📊

Dashboard analitik interaktif berbasis *Data Storytelling* yang dirancang khusus untuk menganalisis performa bisnis kategori **Furniture** menggunakan dataset Sample Superstore. 

Fokus utama dari dashboard ini adalah menggeser paradigma manajemen dari sekadar *Sales Growth* menuju **Profitable Growth** dengan menelusuri titik kebocoran margin mulai dari sub-category, diskon, hingga performa region.

---

## 🎯 Core Message & Pendekatan Analisis
Dashboard ini dibangun menggunakan prinsip **Minto Pyramid** (top-down approach) di mana audiens disuguhkan kesimpulan dan angka utama (Executive Summary) terlebih dahulu, baru diikuti dengan pembuktian visual (Root Cause).

### Alur Storytelling:
1. **Hero & Mini Insight**: "Revenue Furniture besar, tapi di mana profitnya bocor?" beserta indikator ringkas status margin.
2. **Executive Summary**: Ringkasan utama mengenai margin, sub-category kritis, dan wilayah berisiko tinggi.
3. **KPIs**: Metrik utama (Sales, Profit, Profit Margin) yang dibandingkan dengan target *Break-even*.
4. **Context & Conflict**: Visualisasi tren yang membuktikan bahwa meskipun sales tumbuh, margin tetap tertekan.
5. **Root Cause 1 (Sub-Category)**: Analisis horizontal bar chart yang secara tajam memisahkan penyumbang profit tertinggi dengan titik rugi utama (seperti Tables & Bookcases).
6. **Root Cause 2 (Discount vs Profit)**: Identifikasi risiko kebijakan diskon yang terlalu tinggi terhadap margin, lengkap dengan *Bubble Scatter Plot*.
7. **Regional Insight**: Pemetaan region dengan margin terburuk.
8. **Call to Action (CTA)**: Rekomendasi taktis untuk tim manajemen dengan metrik yang terukur.

---

## ✨ Fitur Utama
- **Fully Dynamic Narrative:** Semua teks *insight*, "So What", dan rekomendasi CTA di-generate secara otomatis via JavaScript berdasarkan periode Tahun dan Kuartal yang dipilih.
- **No Dummy Data:** Aplikasi murni membaca dan me-*parsing* file dataset CSV (`data/sample_superstore.csv`) secara dinamis.
- **Smart Chart Annotations:** Garis *Break-even*, label diskon tertinggi, dan peringatan *margin negatif* digambar secara otomatis pada Chart.js menggunakan *custom plugins*.
- **Glassmorphism UI:** Tampilan desain premium dan elegan yang siap dipresentasikan di tingkat eksekutif (C-Level).
- **Print / PDF Ready:** Dilengkapi dengan fitur "Export PDF" yang pintar, mengubah kanvas grafik menjadi gambar resolusi tinggi sesaat sebelum dicetak agar tidak *blank* atau terpotong di halaman PDF.

---

## 🛠️ Tech Stack
- **HTML5 & CSS3** (Vanilla / No framework, custom variables)
- **JavaScript ES6+** (Vanilla / No dependencies framework)
- **Chart.js (v4)** untuk visualisasi data
- **PapaParse** untuk parsing CSV

---

## 🚀 Cara Menjalankan secara Lokal

Karena aplikasi ini membaca file lokal CSV (`fetch`), Anda membutuhkan Local HTTP Server.

1. **Clone Repository:**
   ```bash
   git clone https://github.com/deakusuma05/DashboardStorytelling.git
   cd DashboardStorytelling
   ```

2. **Jalankan HTTP Server (via Node.js/npx):**
   ```bash
   npx -y http-server . -p 8080 -c-1 --cors
   ```
   *(Atau Anda bisa menggunakan ekstensi Live Server di VS Code)*

3. **Buka di Browser:**
   Akses `http://127.0.0.1:8080` pada browser Anda.

---
*Dibuat untuk analisis bisnis mendalam dan presentasi strategis tingkat lanjut.*
