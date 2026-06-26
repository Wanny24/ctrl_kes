import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Award, HelpCircle, Dumbbell, Apple, Activity, Ban } from 'lucide-react';

export default function AIHealthCoach({ rawData, prediction }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Initial welcome message based on health stats
  useEffect(() => {
    let welcomeText = "Halo! Saya adalah AI Health Coach Anda. Silakan isi data kesehatan Anda terlebih dahulu agar saya dapat menganalisis dan membimbing kondisi Anda.";

    if (rawData && prediction) {
      const [hRisk, dRisk, hDiseaseRisk] = prediction;
      const bpString = `${rawData.systolic}/${rawData.diastolic} mmHg`;
      const isHigh = Math.max(hRisk, dRisk, hDiseaseRisk) >= 0.6;
      
      welcomeText = `Halo! Saya telah meninjau profil kesehatan Anda. Anda saat ini memiliki Tekanan Darah ${bpString}, Kolesterol ${rawData.cholesterol} mg/dL, dan Gula Darah ${rawData.sugar} mg/dL. 
      
Model Deep Learning mendeteksi risiko Hipertensi sebesar ${Math.round(hRisk * 100)}% dan Diabetes sebesar ${Math.round(dRisk * 100)}%. ${isHigh ? 'Karena Anda berada dalam kategori Risiko Tinggi, mari kita fokus menurunkan berat badan Anda dan memperbaiki pola konsumsi.' : 'Mari kita pertahankan status kesehatan Anda agar tetap prima.'} 

Saya dapat membantu Anda menghitung kalori harian (BMR & TDEE), merancang menu makanan, menjelaskan tentang obat-obatan umum, serta memandu pola olahraga yang aman.

Apa yang ingin Anda tanyakan hari ini? Pilih tombol rekomendasi di bawah atau ketik pertanyaan Anda.`;
    }

    setMessages([
      { id: '1', sender: 'bot', text: welcomeText }
    ]);
  }, [rawData, prediction]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    const newUserMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend
    };

    setMessages((prev) => [...prev, newUserMessage]);

    // Generate responsive feedback
    setTimeout(() => {
      const botResponseText = generateBotResponse(textToSend.toLowerCase());
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botResponseText
        }
      ]);
    }, 800);
  };

  const onSubmitForm = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    handleSendMessage(inputMessage);
    setInputMessage('');
  };

  const handleChipClick = (chipText) => {
    handleSendMessage(chipText);
  };

  // SMARTER RULE ENGINE WITH TDEE/BMR CALCS, OBAT DIRECTORY, MEAL PLANS, ETC
  const generateBotResponse = (query) => {
    if (!rawData) {
      return "Silakan isi data kesehatan Anda terlebih dahulu pada tab input sehingga saya dapat memberikan saran yang akurat.";
    }

    const heightM = rawData.height / 100;
    const weight = rawData.weight;
    const age = rawData.age;
    const gender = rawData.gender;
    const activity = rawData.activity;

    // Calculate BMR using Harris-Benedict Equation
    let bmr = 0;
    if (gender === 'Laki-laki' || gender === 'Pria') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * rawData.height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * rawData.height) - (4.330 * age);
    }

    // Activity multiplier
    let activityMultiplier = 1.2; // Jarang
    if (activity === 'Sedang') activityMultiplier = 1.55;
    else if (activity === 'Sering') activityMultiplier = 1.725;

    const tdee = Math.round(bmr * activityMultiplier);
    const weightLossTargetCal = Math.round(tdee - 500);
    const targetW = Math.round(22 * heightM * heightM);

    // Context flags
    const hasHighChol = rawData.cholesterol >= 200;
    const hasHighBP = rawData.systolic >= 140 || rawData.diastolic >= 90;
    const hasHighSugar = rawData.sugar >= 126;

    // 1. TDEE & BMR METABOLIC CALCULATION
    if (query.includes('kalori') || query.includes('bmr') || query.includes('tdee') || query.includes('metabolisme')) {
      return `📊 **Laporan Metabolisme & Energi Kustom Anda**
      
Berdasarkan profil fisik Anda (Umur: ${age} thn, Berat: ${weight} kg, Tinggi: ${rawData.height} cm, Gender: ${gender}, Aktivitas: ${activity === 'Jarang' ? 'Jarang Berolahraga' : activity === 'Sedang' ? 'Aktif Sedang' : 'Sangat Aktif'}):

1. **BMR (Basal Metabolic Rate)**: **${Math.round(bmr)} kkal/hari**
   *Jumlah energi minimum yang dibutuhkan tubuh Anda untuk bertahan hidup saat istirahat total.*
   
2. **TDEE (Total Daily Energy Expenditure)**: **${tdee} kkal/hari**
   *Kebutuhan kalori harian total Anda untuk menjaga berat badan saat ini berdasarkan level aktivitas fisik Anda.*

3. **Target Penurunan Berat Badan (Defisit Kalori)**: **${weightLossTargetCal} kkal/hari**
   *Untuk menurunkan berat badan sekitar 0.5 kg per minggu secara sehat menuju berat badan ideal Anda (**${targetW} kg**), batasi konsumsi hingga angka ini.*

💡 *Saran Pelatih:* Catat makanan Anda menggunakan aplikasi calorie tracker dan pastikan asupan protein tercukupi agar massa otot tidak menyusut selama defisit kalori.`;
    }

    // 2. DETAILED 1-DAY MEAL PLAN BASED ON PATHOLOGIES
    if (query.includes('menu') || query.includes('1 hari') || query.includes('sarapan') || query.includes('resep')) {
      let dietType = "Seimbang";
      let focus = "Menjaga kebugaran umum.";
      let menuDetails = "";

      if (hasHighChol || hasHighBP) {
        dietType = "DASH & Rendah Lemak Jenuh (Rendah Sodium)";
        focus = "Menurunkan kolesterol total dan ketegangan pembuluh darah.";
        menuDetails = `🍳 **Sarapan (Pukul 07.00 - 08.00):**
* Oatmeal gandum utuh (40g) dimasak dengan susu low-fat/kedelai + 1 sendok makan chia seeds dan irisan pisang (sumber kalium).
* 1 cangkir teh hijau tanpa gula.

🍎 **Camilan Pagi (Pukul 10.00):**
* 1 buah apel merah atau pir sedang.

🍛 **Makan Siang (Pukul 12.00 - 13.00):**
* Nasi merah (100g) + Dada ayam panggang tanpa kulit (120g) dibumbui bawang putih dan sedikit minyak zaitun.
* Sayur bayam bening tanpa garam berlebih (1 mangkuk).
* Tempe kukus (2 potong).

🥝 **Camilan Sore (Pukul 16.00):**
* 10 butir kacang almond panggang (tanpa garam).

🥗 **Makan Malam (Pukul 18.30 - 19.30):**
* Pepes ikan kembung/salmon (sumber Omega-3 tinggi) dibumbui rempah kunyit.
* Tumis brokoli dan wortel menggunakan sedikit minyak jagung (1 porsi).
* 1 potong pepaya matang.`;
      } else if (hasHighSugar) {
        dietType = "Rendah Indeks Glikemik & Karbohidrat Terkontrol";
        focus = "Mencegah lonjakan kadar gula darah secara drastis.";
        menuDetails = `🍳 **Sarapan (Pukul 07.00 - 08.00):**
* Orak-arik telur (2 butir) menggunakan sedikit mentega kelapa + Tumis sayur bayam dan tomat ceri.
* Setengah buah alpukat mentega.

🍎 **Camilan Pagi (Pukul 10.00):**
* Yogurt plain/Greek tanpa rasa (100g) + sedikit buah beri segar.

🍛 **Makan Siang (Pukul 12.00 - 13.00):**
* Nasi merah atau ubi kukus (80g) + Pepes tahu (2 potong) + Pepes ikan salmon/nila (120g).
* Sayuran kukus campur (buncis, wortel, brokoli).

🥝 **Camilan Sore (Pukul 16.00):**
* 1 buah mentimun iris dengan celupan saus hummus atau kacang edamame rebus.

🥗 **Makan Malam (Pukul 18.30 - 19.30):**
* Sup kaldu ayam bening dengan sayuran kol, seledri, dan wortel + Dada ayam rebus suwir (100g).
* Tempe panggang tanpa tepung (2 potong).`;
      } else {
        menuDetails = `🍳 **Sarapan:** Oatmeal dengan pisang dan susu rendah lemak.
🍛 **Makan Siang:** Nasi merah, pepes ikan nila, tempe, dan tumis kangkung.
🥗 **Makan Malam:** Dada ayam panggang, tahu, dan sup sayuran bening.`;
      }

      return `🥗 **Rencana Menu Makanan Sehat Harian Kustom Anda**
**Jenis Diet:** ${dietType}
**Fokus Utama:** ${focus}

${menuDetails}

⚠️ *Penting:* Minum air putih minimal **2.5 liter per hari** dan hindari minuman manis kemasan, sirup, atau jus buah saring manis.`;
    }

    // 3. COMMON MEDICATIONS DIRECTORY WITH STRICT DISCLAIMER
    if (query.includes('obat') || query.includes('minum obat') || query.includes('statin') || query.includes('metformin') || query.includes('pil')) {
      let recMeds = [];
      if (hasHighChol) recMeds.push("- **Golongan Statin (Atorvastatin, Simvastatin):** Menghambat enzim HMG-CoA reduktase di hati untuk menurunkan kolesterol jahat (LDL) dan meningkatkan HDL.");
      if (hasHighBP) recMeds.push("- **ACE Inhibitor (Captopril, Lisinopril) atau ARB (Valsartan, Candesartan):** Melebarkan pembuluh darah dengan menghalangi senyawa kimia alami penyempit pembuluh darah.");
      if (hasHighSugar) recMeds.push("- **Biguanid (Metformin):** Meningkatkan sensitivitas sel tubuh terhadap insulin dan mengurangi produksi glukosa oleh hati.");

      return `💊 **Informasi Farmakologi & Obat-obatan Umum**
      
Berdasarkan parameter kesehatan Anda, berikut obat-obatan yang umumnya diresepkan oleh dokter untuk menangani kondisi tersebut:

${recMeds.length > 0 ? recMeds.join('\n') : '- Belum ada indikasi obat resep wajib berdasarkan profil kesehatan umum Anda.'}

⚠️ **DISCLAIMER MEDIS KRUSIAL:**
Informasi obat di atas murni untuk tujuan edukasi. **Jangan pernah mengonsumsi, membeli, atau mengubah dosis obat resep tanpa pemeriksaan tatap muka langsung oleh dokter.** Dokter harus memeriksa fungsi ginjal (ureum/kreatinin) dan fungsi hati (SGOT/SGPT) Anda terlebih dahulu sebelum meresepkan terapi obat jangka panjang.`;
    }

    // 4. SMOKING & NICOTINE IMPACT ON CARDIO SYSTEM
    if (query.includes('rokok') || query.includes('merokok') || query.includes('nikotin') || query.includes('vape')) {
      const activeSmoker = rawData.smoke === 'Ya';
      return `🚭 **Dampak Nikotin & Rokok pada Jantung & Pembuluh Darah**
      
${activeSmoker ? "⚠️ *Karena Anda menjawab YA untuk merokok, harap perhatikan efek langsungnya pada parameter Anda saat ini:* " : "✓ *Anda tidak merokok, pertahankan kebiasaan baik ini untuk melindungi jantung Anda:*"}

1. **Penyempitan Pembuluh Darah (Vasokonstriksi):** Nikotin merangsang kelenjar adrenal melepaskan hormon adrenalin. Ini mempersempit pembuluh darah secara instan, memicu kenaikan tekanan darah Anda (sekarang berada di angka **${rawData.systolic}/${rawData.diastolic} mmHg**).
2. **Kerusakan Dinding Pembuluh Darah (Endotel):** Karbon monoksida dan tar dalam asap rokok melukai dinding arteri bagian dalam, mempermudah kolesterol LDL (sekarang **${rawData.cholesterol} mg/dL**) menempel dan membentuk plak yang menyumbat pembuluh darah (*Aterosklerosis*).
3. **Penyumbatan Pembuluh Jantung:** Merokok mengencerkan kadar oksigen dalam darah dan meningkatkan risiko pembekuan darah secara mendadap, memicu serangan jantung koroner.

💡 *Tips Berhenti:* Mulailah metode *Nicotine Replacement Therapy* (NRT) atau ganti kebiasaan memegang rokok dengan mengunyah permen karet rendah gula ketika keinginan merokok datang.`;
    }

    // 5. RESTING HEART RATE ANALYSIS
    if (query.includes('nadi') || query.includes('denyut') || query.includes('jantung') || query.includes('detak')) {
      const hr = rawData.heartRate;
      let hrStatus = "Normal (Istirahat)";
      let hrAdvice = "Denyut jantung Anda berada pada kisaran optimal orang dewasa sehat saat istirahat (60 - 100 bpm).";

      if (hr > 100) {
        hrStatus = "Takikardia (Terlalu Cepat)";
        hrAdvice = "Denyut nadi istirahat di atas 100 bpm dapat disebabkan oleh dehidrasi, stres, kurang tidur, konsumsi kafein berlebih, atau kurangnya kebugaran kardiovaskular.";
      } else if (hr < 60) {
        hrStatus = "Bradikardia (Lambat)";
        hrAdvice = "Denyut nadi di bawah 60 bpm normal bagi atlet terlatih. Jika Anda bukan atlet dan merasa pusing/lemas, segera lakukan cek medis.";
      }

      return `💓 **Analisis Denyut Nadi / Heart Rate**
      
Denyut nadi Anda tercatat **${hr} bpm** dengan Kategori: **${hrStatus}**.

*Analisis & Rekomendasi:*
- ${hrAdvice}
- Denyut nadi istirahat dapat diturunkan secara sehat dan stabil dengan melakukan olahraga kardio rutin secara teratur (seperti berjalan kaki atau bersepeda) yang melatih efisiensi otot jantung memompa darah.
- Lakukan latihan pernapasan dalam (Deep Breathing) dengan teknik 4-7-8 untuk menenangkan sistem saraf otonom Anda secara langsung jika denyut jantung meningkat akibat stres.`;
    }

    // 6. CHOLESTEROL DETAILED TIPS
    if (query.includes('kolesterol')) {
      return `🥦 **Tips Mengontrol Kolesterol (Aktual: ${rawData.cholesterol} mg/dL)**
      
Batas kolesterol total normal adalah di bawah **200 mg/dL**. Kolesterol Anda berada pada level tinggi, berikut strategi menurunkannya:

1. **Konsumsi Fitosterol & Beta-Glukan:** Zat aktif di oatmeal, bekatul, dan apel membantu memblokir penyerapan kolesterol makanan di usus halus.
2. **Hindari Lemak Trans:** Hindari margarin, krim kue, mentega putih, dan minyak goreng bekas pakai berulang (minyak jelantah).
3. **Tingkatkan HDL (Kolesterol Baik):** Lemak baik dari alpukat, kacang almond, minyak zaitun, dan ikan laut membantu menyapu kolesterol LDL kembali ke hati untuk dibuang.
4. **Olahraga Kardio:** 30 menit jalan cepat atau sepeda statis sehari mendorong produksi enzim yang membersihkan LDL dari dinding pembuluh darah.`;
    }

    // 7. BLOOD PRESSURE DETAILED TIPS
    if (query.includes('darah') || query.includes('tensi') || query.includes('hipertensi')) {
      return `🧂 **Panduan Tekanan Darah (Aktual: ${rawData.systolic}/${rawData.diastolic} mmHg)**
      
Kondisi tensi Anda menunjukkan adanya peningkatan. Ikuti protokol medis berikut:

1. **Restriksi Natrium (Sodium):** Kurangi asupan garam dapur, penyedap rasa (MSG), saus botolan, kecap asin, serta makanan asin (ikan asin, keripik).
2. **Pola Makan DASH:** Diet kaya buah, sayur, gandum utuh, dan produk susu rendah lemak terbukti klinis menurunkan tekanan darah.
3. **Minyak Ikan Omega-3:** Membantu menekan inflamasi vaskular dan membuat pembuluh darah lebih lentur.
4. **Relaksasi Otot Progresif:** Luangkan waktu 10 menit sehari untuk berbaring dan merilekskan otot seluruh tubuh guna menstabilkan sistem saraf simpatis.`;
    }

    // 8. DIABETES & SUGAR DETAILED TIPS
    if (query.includes('gula') || query.includes('diabetes') || query.includes('glukosa')) {
      return `🍭 **Manajemen Kadar Gula Darah (Aktual: ${rawData.sugar} mg/dL)**
      
Target gula darah puasa adalah < 100 mg/dL, dan gula darah acak adalah < 140 mg/dL. Kiat menjaga kestabilannya:

1. **Kendali Porsi Karbohidrat (Carb Counting):** Ganti nasi putih hangat dengan nasi merah dingin, oat merah, quinoa, atau shirataki karena seratnya memperlambat pelepasan glukosa.
2. **Jeda Makan Konsisten:** Hindari mengemil di luar jam makan utama. Berikan jeda agar pankreas Anda beristirahat memproduksi insulin.
3. **Aktivitas Pasca Makan:** Berjalan kaki ringan selama 10-15 menit setelah makan membantu otot langsung menyerap glukosa darah tanpa membutuhkan banyak insulin.`;
    }

    if (query.includes('olahraga') || query.includes('aktivitas')) {
      return `🏃 **Panduan Latihan Fisik Kustom**
      
Status olahraga Anda saat ini: **${rawData.activity === 'Jarang' ? 'Jarang Berolahraga' : 'Aktif'}**.

1. **Tahap Awal:** Jika jarang berolahraga, mulailah dengan **jalan kaki cepat 15 menit sehari**. Hindari langsung melakukan angkat beban berat karena memicu kenaikan tekanan darah mendadak.
2. **Jenis Latihan Terbaik:** Latihan aerobik kardiovaskular (Jalan cepat, sepeda statis, senam aerobik ringan).
3. **Frekuensi:** Lakukan 3-5 kali seminggu dengan target total 150 menit.
4. **Pemantauan Detak Jantung:** Usahakan detak jantung berada di zona aerobik saat latihan (sekitar 100-120 bpm untuk umur Anda).`;
    }

    // Fallback general advice
    return `Sebagai AI Health Coach Anda, saya menyarankan untuk fokus pada perbaikan gaya hidup. 
    
Berdasarkan profil Anda:
- Usahakan menurunkan berat badan menuju target **${targetW} kg** (Tinggi: ${rawData.height} cm, Berat: ${weight} kg).
- ${rawData.smoke === 'Ya' ? 'Sangat disarankan untuk mulai mengurangi atau menghentikan kebiasaan merokok.' : 'Pertahankan untuk tidak merokok.'}
- Lakukan aktivitas fisik minimal **30 menit sehari**.
- Batasi konsumsi makanan olahan, garam berlebih, dan gorengan.
    
Apakah ada pertanyaan spesifik tentang diet, olahraga, kolesterol, obat-obatan, atau tensi darah yang ingin Anda tanyakan?`;
  };

  const suggestionChips = [
    { text: "🥗 Menu Makanan 1 Hari", icon: Apple },
    { text: "🔥 Hitung Kalori Harian (TDEE)", icon: Activity },
    { text: "💊 Kapan Harus Minum Obat?", icon: HelpCircle },
    { text: "🏃 Panduan Olahraga Aman", icon: Dumbbell },
    { text: "🚭 Bahaya Nikotin bagi Jantung", icon: Ban }
  ];

  return (
    <div className="glass-panel chat-container-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Bot size={24} color="var(--accent-purple)" />
        <div>
          <h3 style={{ fontSize: '18px' }}>AI Health Coach</h3>
          <span style={{ fontSize: '11px', color: 'var(--color-healthy)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Award size={12} /> Konsultan Gaya Hidup AI Medis
          </span>
        </div>
      </div>

      {/* Message Feed */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble ${msg.sender}`}
            style={{
              whiteSpace: 'pre-line' // respects newlines in strings
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              {msg.sender === 'bot' ? <Bot size={12} /> : <User size={12} />}
              {msg.sender === 'bot' ? 'Coach AI' : 'Anda'}
            </div>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto', 
          paddingBottom: '12px',
          marginBottom: '8px',
          scrollbarWidth: 'none'
        }}
        className="chips-scroll-container"
      >
        {suggestionChips.map((chip, idx) => {
          const ChipIcon = chip.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip.text)}
              style={{
                background: 'rgba(157, 78, 221, 0.08)',
                border: '1px solid rgba(157, 78, 221, 0.25)',
                borderRadius: '20px',
                padding: '8px 14px',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(157, 78, 221, 0.15)';
                e.currentTarget.style.borderColor = 'var(--accent-purple)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(157, 78, 221, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(157, 78, 221, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(157, 78, 221, 0.25)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <ChipIcon size={14} color="var(--accent-purple)" />
              {chip.text}
            </button>
          );
        })}
      </div>

      {/* Input row */}
      <form onSubmit={onSubmitForm} className="chat-input-row">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Tanyakan sesuatu... (contoh: 'Berapa BMR & TDEE kalori harian saya?')"
          className="form-input"
        />
        <button type="submit" className="btn-send">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
