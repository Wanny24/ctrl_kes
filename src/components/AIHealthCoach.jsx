import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Award, HelpCircle, Dumbbell, Apple, Activity, Ban } from 'lucide-react';

export default function AIHealthCoach({ rawData, prediction }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeChipTab, setActiveChipTab] = useState('semua');
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
    setInputMessage(chipText);
  };

  // SMARTER RULE ENGINE WITH TDEE/BMR CALCS, OBAT DIRECTORY, MEAL PLANS, ETC
  const generateBotResponse = (query) => {
    const data = rawData || {
      height: 170,
      weight: 70,
      age: 35,
      gender: 'Umum',
      activity: 'Sedang',
      systolic: 120,
      diastolic: 80,
      cholesterol: 180,
      sugar: 90,
      smoke: 'Tidak',
      heartRate: 72
    };

    const getAnswer = () => {
      const heightM = data.height / 100;
      const weight = data.weight;
      const age = data.age;
      const gender = data.gender;
      const activity = data.activity;

      // Calculate BMR using Harris-Benedict Equation
      let bmr = 0;
      if (gender === 'Laki-laki' || gender === 'Pria') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * data.height) - (5.677 * age);
      } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * data.height) - (4.330 * age);
      }

      // Activity multiplier
      let activityMultiplier = 1.2; // Jarang
      if (activity === 'Sedang') activityMultiplier = 1.55;
      else if (activity === 'Sering') activityMultiplier = 1.725;

      const tdee = Math.round(bmr * activityMultiplier);
      const weightLossTargetCal = Math.round(tdee - 500);
      const targetW = Math.round(22 * heightM * heightM);

      // Context flags
      const hasHighChol = data.cholesterol >= 200;
      const hasHighBP = data.systolic >= 140 || data.diastolic >= 90;
      const hasHighSugar = data.sugar >= 126;

      // A. Hipertensi Specific Questions
      if (query.includes('gejala') && (query.includes('hipertensi') || query.includes('tensi') || query.includes('darah tinggi'))) {
        return `🩺 **Gejala & Ciri-ciri Hipertensi (Tekanan Darah Tinggi)**
        
Hipertensi sering disebut sebagai **"Silent Killer"** karena sebagian besar penderita tidak menunjukkan gejala apa pun hingga terjadi komplikasi organ serius. Namun, pada kondisi tensi yang sangat tinggi (krisis hipertensi) atau kondisi kronis, berikut ciri-ciri yang sering dirasakan:

1. **Sakit Kepala Hebat:** Terutama di bagian belakang kepala (tengkuk), sering muncul di pagi hari.
2. **Pusing atau Vertigo:** Perasaan melayang atau ruangan terasa berputar.
3. **Kelelahan & Lemas:** Rasa lelah yang tidak wajar meski tidak melakukan aktivitas berat.
4. **Masalah Penglihatan:** Pandangan menjadi kabur atau berbayang akibat tekanan pada pembuluh darah retina.
5. **Nyeri Dada & Sesak Napas:** Jantung harus bekerja lebih keras memompa darah melawan tekanan yang tinggi.
6. **Jantung Berdebar-debar (Palpitasi):** Sensasi detak jantung yang cepat atau tidak teratur.
7. **Mimisan (Nosebleeds):** Pembuluh darah halus di dalam hidung pecah akibat tekanan darah tinggi.

⚠️ *Catatan:* Satu-satunya cara mendeteksi hipertensi secara akurat adalah melakukan **pengukuran berkala menggunakan Tensimeter**. ${rawData ? `Tekanan darah Anda saat ini adalah **${data.systolic}/${data.diastolic} mmHg**` : 'Tekanan darah normal rata-rata adalah di bawah 120/80 mmHg'}.`;
      }

      if (query.includes('pengobatan') && (query.includes('hipertensi') || query.includes('tensi') || query.includes('darah tinggi'))) {
        return `💊 **Pengobatan & Manajemen Kontrol Hipertensi**

Mengontrol tekanan darah memerlukan kombinasi terapi gaya hidup sehat dan obat-obatan medis jangka panjang:

1. **Terapi Gaya Hidup (Paling Utama):**
   * **Diet DASH (Dietary Approaches to Stop Hypertension):** Pola makan tinggi serat (sayur, buah, gandum) dan protein rendah lemak.
   * **Restriksi Garam/Natrium:** Batasi garam maksimal 1 sendok teh per hari (kurang dari 2.000 mg natrium). Hindari makanan olahan/kalengan.
   * **Menurunkan Berat Badan:** Setiap penurunan 1 kg berat badan dapat menurunkan tekanan darah sekitar 1 mmHg.
   * **Olahraga Teratur:** Latihan kardio sedang (jalan cepat, sepeda) minimal 150 menit seminggu.

2. **Terapi Obat-obatan Medis (Umum Diresepkan):**
   * **ACE Inhibitor / ARB (contoh: Captopril, Candesartan):** Melebarkan pembuluh darah.
   * **Beta-Blockers (contoh: Bisoprolol):** Memperlambat detak jantung dan menurunkan kekuatan pompa jantung.
   * **Diuretik (contoh: Furosemide):** Membuang kelebihan garam dan air lewat urine.

⚠️ *Penting:* Jangan pernah mengonsumsi atau menghentikan obat tensi tanpa resep dari dokter Anda!`;
      }

      if (query.includes('pencegahan') && (query.includes('hipertensi') || query.includes('tensi') || query.includes('darah tinggi'))) {
        return `🥦 **Pencegahan & Pola Makan Sehat Hipertensi**

Mencegah kenaikan tekanan darah berfokus pada asupan nutrisi yang melancarkan aliran darah:

1. **Konsumsi Kalium Tinggi:** Kalium membantu ginjal membuang kelebihan natrium melalui urine dan melemaskan dinding pembuluh darah. Makanan kaya kalium meliputi **pisang, alpukat, kentang kukus, melon, dan sayuran hijau (bayam)**.
2. **Asupan Magnesium & Kalsium:** Membantu regulasi kontraksi pembuluh darah. Dapatkan dari **kacang almond, biji chia, dan yogurt rendah lemak**.
3. **Batasi Natrium secara Ketat:** Hindari garam dapur berlebih, penyedap rasa (MSG), kecap asin, saus kemasan, mentega asin, makanan kaleng, dan keripik asin.
4. **Hindari Kafein & Alkohol:** Kafein dapat memicu kenaikan denyut jantung dan tensi secara mendadak.`;
      }

      if (query.includes('bahaya') && (query.includes('hipertensi') || query.includes('tensi') || query.includes('darah tinggi'))) {
        return `⚠️ **Bahaya & Komplikasi Hipertensi Jangka Panjang**

Hipertensi kronis yang tidak terkontrol akan merusak sistem pembuluh darah dan organ vital secara perlahan:

1. **Stroke (Pecahnya Pembuluh Darah Otak):** Tekanan darah tinggi melemahkan pembuluh darah arteri otak hingga berisiko pecah atau tersumbat, memicu kelumpuhan.
2. **Serangan Jantung & Gagal Jantung:** Jantung dipaksa memompa lebih keras melawan tekanan tinggi, menyebabkan penebalan otot jantung (*hipertrofi*) yang berakhir pada gagal jantung.
3. **Gagal Ginjal Kronis (Nefropati):** Pembuluh darah halus di ginjal rusak, sehingga ginjal kehilangan kemampuan menyaring racun dari darah.
4. **Kebutaan (Retinopati Hipertensi):** Pembuluh darah retina mata pecah atau menyempit, memicu gangguan penglihatan permanen.
5. **Penurunan Kognitif & Demensia:** Aliran darah ke otak yang terhambat mempercepat penuaan otak dan pikun.`;
      }

      if (query.includes('klasifikasi') && (query.includes('tekanan') || query.includes('tensi'))) {
        return `📊 **Klasifikasi Tekanan Darah (Standar AHA/Kemenkes)**

Pengukuran tekanan darah dibagi menjadi beberapa kategori untuk dewasa (dalam mmHg):

1. **Normal:** Sistolik **< 120** DAN Diastolik **< 80**
2. **Prehipertensi (Elevated):** Sistolik **120 - 129** DAN Diastolik **< 80**
3. **Hipertensi Derajat 1:** Sistolik **130 - 139** ATAU Diastolik **80 - 89**
4. **Hipertensi Derajat 2:** Sistolik **>= 140** ATAU Diastolik **>= 90**
5. **Krisis Hipertensi:** Sistolik **> 180** dan/atau Diastolik **> 120** *(Memerlukan penanganan IGD segera)*

💡 *Tensi Anda:* ${rawData ? `Tensi Anda saat ini tercatat **${data.systolic}/${data.diastolic} mmHg**, yang masuk dalam kategori **${data.systolic >= 140 || data.diastolic >= 90 ? "Hipertensi Derajat 2" : data.systolic >= 130 || data.diastolic >= 80 ? "Hipertensi Derajat 1" : "Normal/Prehipertensi"}**.` : 'Batas tekanan darah normal rata-rata adalah di bawah 120/80 mmHg.'}`;
      }

      // B. Diabetes Specific Questions
      if (query.includes('gejala') && (query.includes('diabetes') || query.includes('gula') || query.includes('kencing manis'))) {
        return `🍭 **Gejala & Ciri-ciri Diabetes (Kencing Manis)**

Diabetes Mellitus terjadi akibat kurangnya produksi insulin atau tidak sensitifnya sel terhadap insulin. Gejala klasiknya dikenal dengan istilah **3P**:

1. **Poliuria (Sering Kencing):** Terutama di malam hari karena ginjal mencoba membuang kelebihan glukosa melalui urine.
2. **Polidipsia (Sering Haus):** Akibat cairan tubuh banyak terbuang lewat urine, tubuh mengalami dehidrasi konstan.
3. **Polifagia (Sering Lapar):** Sel-sel tubuh kelaparan karena glukosa dalam darah tidak bisa masuk ke dalam sel tanpa insulin yang cukup.

**Ciri-ciri Pendukung Lainnya:**
* **Penurunan Berat Badan Drastis:** Tubuh membakar cadangan lemak dan otot untuk energi karena tidak bisa memakai gula.
* **Luka Lambat Sembuh:** Kadar gula tinggi menghambat sirkulasi darah dan merusak saraf sel imun.
* **Kesemutan atau Mati Rasa:** Mati rasa di telapak kaki/tangan akibat kerusakan saraf tepi (*Neuropati Diabetik*).
* **Pandangan Kabur:** Lensa mata membengkak akibat fluktuasi kadar cairan tubuh.

💡 *Kondisi Anda:* ${rawData ? `Gula darah Anda saat ini adalah **${data.sugar} mg/dL** (Gula Darah Puasa normal: < 100 mg/dL).` : 'Gula Darah Puasa normal adalah di bawah 100 mg/dL.'}`;
      }

      if (query.includes('pengobatan') && (query.includes('diabetes') || query.includes('gula') || query.includes('kencing manis'))) {
        return `💊 **Pengobatan & Manajemen Kontrol Diabetes**

Diabetes adalah kondisi kronis yang tidak bisa disembuhkan secara total tetapi dapat **dikontrol secara optimal** agar tidak memicu komplikasi ginjal atau kebutaan:

1. **Pilar Gaya Hidup:**
   * **Pengaturan Karbohidrat:** Fokus pada makanan ber-Indeks Glikemik rendah (nasi merah dingin, oat gandum, ubi). Hindari gula pasir, sirup, tepung terigu.
   * **Olahraga Setelah Makan:** Berjalan kaki 15 menit setelah makan malam merangsang otot untuk langsung membakar gula darah tanpa butuh insulin.
   * **Manajemen Berat Badan:** Menurunkan lemak perut (lemak viseral) sangat membantu mengurangi resistensi insulin.

2. **Pilar Medis:**
   * **Obat Oral (contoh: Metformin, Glimepiride):** Membantu menurunkan produksi gula oleh hati dan memicu sel menyerap gula lebih baik.
   * **Terapi Insulin:** Suntikan insulin buatan langsung ke jaringan lemak bawah kulit untuk menggantikan peran insulin tubuh.

⚠️ *Penting:* Selalu konsultasikan dosis obat oral dan insulin dengan dokter penyakit dalam.`;
      }

      if (query.includes('pencegahan') && (query.includes('diabetes') || query.includes('gula') || query.includes('kencing manis'))) {
        return `🥦 **Pencegahan & Pola Makan Sehat Diabetes**

Mencegah diabetes (terutama Tipe 2) berfokus pada menjaga stabilitas kadar insulin dan sensitivitas sel tubuh:

1. **Pilih Karbohidrat Kompleks:** Utamakan makanan dengan **Indeks Glikemik (IG) Rendah** seperti **nasi merah dingin, ubi jalar kukus, oat gandum utuh, brokoli, dan kacang edamame**. Serat tinggi memperlambat pemecahan gula ke dalam darah.
2. **Hindari Gula Sederhana:** Jauhi sirup, soda, jus buah saring dengan gula tambahan, kue manis, roti putih, dan tepung terigu.
3. **Kontrol Porsi (Plate Method):** Isi piring makan Anda dengan 1/2 sayuran hijau non-tepung, 1/4 protein rendah lemak (tempe, tahu, dada ayam), dan 1/4 karbohidrat kompleks.
4. **Peka Terhadap Sinyal Kenyang:** Hindari makan berlebih yang memaksa pankreas memproduksi insulin dalam jumlah besar secara terus menerus.`;
      }

      if (query.includes('bahaya') && (query.includes('diabetes') || query.includes('gula') || query.includes('kencing manis'))) {
        return `⚠️ **Bahaya & Komplikasi Kronis Diabetes**

Kadar gula darah yang tinggi secara terus-menerus dapat merusak saraf, pembuluh darah, dan organ vital:

1. **Neuropati Diabetik (Kerusakan Saraf):** Kerusakan saraf tepi menyebabkan kesemutan, mati rasa, atau rasa terbakar di kaki. Luka kecil di kaki bisa tidak terasa dan berkembang menjadi infeksi parah hingga memerlukan **amputasi**.
2. **Penyakit Kardiovaskular:** Diabetes melipatgandakan risiko serangan jantung dan stroke akibat rusaknya dinding pembuluh darah besar.
3. **Nefropati Diabetik (Gagal Ginjal):** Gula darah tinggi merusak sistem penyaringan halus ginjal, memicu kebutuhan cuci darah (hemodialisis).
4. **Retinopati Diabetik (Kebutaan):** Pembuluh darah retina mata membengkak dan bocor, memicu hilangnya penglihatan secara permanen.
5. **Disfungsi Saraf Otonom:** Menyebabkan masalah pencernaan lambat (*gastroparesis*) atau disfungsi ereksi.`;
      }

      if (query.includes('perbedaan') && query.includes('tipe') && (query.includes('diabetes') || query.includes('kencing manis'))) {
        return `🔬 **Perbedaan Diabetes Tipe 1 dan Tipe 2**

Meskipun sama-sama menyebabkan gula darah tinggi, keduanya memiliki penyebab dan penanganan yang sangat berbeda:

1. **Diabetes Tipe 1 (Autoimun):**
   * **Penyebab:** Sistem imun menyerang dan merusak sel beta penghasil insulin di pankreas. Tubuh **sama sekali tidak bisa memproduksi insulin**.
   * **Onset:** Biasanya terdeteksi pada usia anak-anak, remaja, atau dewasa muda.
   * **Penanganan:** Pasien **wajib menggunakan suntikan insulin seumur hidup** untuk bertahan hidup.

2. **Diabetes Tipe 2 (Resistensi Insulin):**
   * **Penyebab:** Pankreas memproduksi insulin, tetapi sel-sel tubuh **resisten (tidak merespons)** terhadap insulin tersebut. Sangat terkait dengan gaya hidup, obesitas, dan kurang gerak.
   * **Onset:** Biasanya terdeteksi pada usia dewasa (>30 tahun), namun kini mulai menyerang usia muda akibat obesitas.
   * **Penanganan:** Modifikasi gaya hidup (diet & olahraga), obat-obatan oral (Metformin), dan kadang insulin jika kondisi memburuk.`;
      }

      // C. Penyakit Jantung Specific Questions
      if (query.includes('gejala') && (query.includes('jantung') || query.includes('koroner') || query.includes('kardio'))) {
        return `❤️ **Gejala & Ciri-ciri Penyakit Jantung (Jantung Koroner & Gagal Jantung)**

Penyakit jantung umumnya terjadi akibat penyempitan pembuluh darah arteri koroner atau melemahnya otot pompa jantung. Berikut ciri-ciri pentingnya:

1. **Angina (Nyeri Dada Khas Jantung):** 
     * Sensasi dada seperti tertekan benda berat, diremas, atau terbakar.
     * Nyeri sering kali **menjalar** ke lengan kiri, pundak, leher, rahang, atau punggung.
     * Biasanya dipicu oleh aktivitas fisik atau stres emosional dan membaik saat istirahat.
2. **Sesak Napas (Dispnea):** Nafas terasa pendek karena jantung tidak optimal mengalirkan darah kaya oksigen dari paru-paru.
3. **Mudah Lelah:** Rasa lelah yang ekstrem setelah melakukan aktivitas ringan (seperti menaiki tangga).
4. **Jantung Berdebar (Aritmia):** Sensasi jantung berdetak terlalu cepat, lambat, atau melompat-lompat.
5. **Pembengkakan Kaki (Edema):** Penumpukan cairan di pergelangan kaki akibat gagal jantung kanan yang melemah.
6. **Keringat Dingin & Mual:** Sering muncul tiba-tiba bersamaan dengan nyeri dada.

🚨 **TINDAKAN DARURAT:** Jika Anda mengalami nyeri dada hebat yang menjalar selama lebih dari 15 menit disertai keringat dingin, segera hubungi ambulans (119) or pergi ke IGD terdekat karena itu adalah tanda **Serangan Jantung Koroner Akut (STEMI)**.`;
      }

      if (query.includes('pengobatan') && (query.includes('jantung') || query.includes('koroner') || query.includes('kardio'))) {
        return `💊 **Pengobatan & Manajemen Kontrol Penyakit Jantung**

Penanganan penyakit jantung ditujukan untuk memperbaiki aliran darah vaskular ke otot jantung dan memperkuat daya pompa jantung:

1. **Manajemen Gaya Hidup:**
   * **Stop Merokok Secara Mutlak:** Asap rokok mengandung racun pembentuk kerak pembuluh darah (*aterosklerosis*).
   * **Batasi Lemak Jenuh & Kolesterol:** Hindari gorengan, jeroan, daging merah berlemak, mentega. ${rawData ? `Kolesterol Anda saat ini adalah **${data.cholesterol} mg/dL** (target: < 200 mg/dL).` : 'Batas kolesterol total normal adalah di bawah 200 mg/dL.'}
   * **Latihan Kardio Terbimbing:** Olahraga aerobik ringan yang aman (jalan santai) untuk menguatkan kolateral pembuluh darah jantung.

2. **Manajemen Medis & Bedah:**
   * **Obat Pengencer Darah (contoh: Aspirin, Clopidogrel):** Mencegah pembekuan darah yang menyumbat arteri koroner.
   * **Obat Penurun Kolesterol (contoh: Atorvastatin):** Menstabilkan plak kolesterol di dinding arteri agar tidak pecah.
   * **Pemasangan Ring Jantung (Angioplasti/Stent):** Membuka sumbatan pembuluh darah jantung menggunakan balon khusus.
   * **Operasi Bypass Jantung (CABG):** Membuat rute sirkulasi darah baru melewati pembuluh darah yang tersumbat.`;
      }

      if (query.includes('pertolongan') && (query.includes('jantung') || query.includes('serangan'))) {
        return `🚨 **Pertolongan Pertama Serangan Jantung (Emergency Protocol)**

Jika Anda atau orang di sekitar Anda mengalami gejala serangan jantung (nyeri dada menjalar, sesak napas, keringat dingin), segera lakukan langkah darurat ini:

1. **Hentikan Aktivitas:** Segera dudukkan pasien dalam posisi setengah bersandar untuk mengurangi beban kerja jantung. Jangan biarkan pasien berjalan atau panik.
2. **Hubungi Nomor Darurat:** Telepon Ambulans/Layanan Darurat medis di nomor **119** (atau bawa langsung ke IGD rumah sakit terdekat menggunakan kendaraan jika ambulans lama datang).
3. **Longgarkan Pakaian:** Buka kancing kerah baju atau sabuk agar pasien dapat bernapas dengan lebih lega.
4. **Kunyah Aspirin:** Jika pasien sadar penuh dan tidak memiliki riwayat alergi aspirin, berikan **1 tablet Aspirin (80-325 mg) untuk dikunyah** (membantu menghambat pembekuan darah di arteri koroner).
5. **Lakukan CPR jika Hilang Kesadaran:** Jika pasien pingsan dan tidak bernapas/nadi tidak teraba, segera lakukan Resusitasi Jantung Paru (kompresi dada sedalam 5-6 cm dengan kecepatan 100-120x per menit) hingga tim medis tiba.`;
      }

      if (query.includes('faktor') && query.includes('risiko') && (query.includes('jantung') || query.includes('kardio'))) {
        return `📊 **Faktor Risiko Penyakit Jantung**

Faktor risiko penyakit jantung koroner dibagi menjadi dua kategori utama:

1. **Faktor Risiko yang Bisa Diubah (Modifiable):**
   * **Merokok:** Kandungan rokok mempercepat kerusakan dinding pembuluh darah (*aterosklerosis*).
   * **Kolesterol Tinggi (LDL):** Menyebabkan plak lemak menyumbat arteri jantung${rawData ? ` (LDL Anda: ${data.cholesterol} mg/dL)` : ''}.
   * **Hipertensi:** Tekanan tinggi merusak elastisitas dinding pembuluh darah${rawData ? ` (Tensi Anda: ${data.systolic}/${data.diastolic} mmHg)` : ''}.
   * **Diabetes:** Gula darah merusak sel-sel pelapis pembuluh darah${rawData ? ` (Gula Anda: ${data.sugar} mg/dL)` : ''}.
   * **Kurang Aktivitas Fisik & Obesitas:** Mempercepat penumpukan plak kolesterol dan meningkatkan beban kerja jantung.

2. **Faktor Risiko yang Tidak Bisa Diubah (Non-modifiable):**
   * **Riwayat Keluarga (Genetika):** Memiliki keluarga dengan serangan jantung di usia muda meningkatkan risiko Anda.
   * **Usia:** Risiko meningkat seiring bertambahnya usia akibat penurunan kelenturan arteri.
   * **Jenis Kelamin:** Pria secara statistik memiliki risiko serangan jantung lebih awal dibanding wanita.`;
      }

      if (query.includes('pencegahan') && (query.includes('jantung') || query.includes('kardio'))) {
        return `🥦 **Pencegahan & Pola Hidup Sehat untuk Jantung**

Menjaga kesehatan jantung jangka panjang berfokus pada pencegahan pembentukan plak lemak (*aterosklerosis*):

1. **Pola Makan Ramah Jantung:**
   * **Asam Lemak Omega-3:** Konsumsi ikan laut (kembung, tuna, salmon) dua kali seminggu untuk menstabilkan detak jantung dan meredakan inflamasi.
   * **Serat Larut Air:** Serat oat, buah apel, dan jeruk mengikat kolesterol jahat di pencernaan untuk dibuang.
   * **Ganti Lemak Jenuh dengan Lemak Baik:** Gunakan minyak zaitun/jagung untuk memasak, batasi konsumsi daging berlemak, santan, dan mentega.
2. **Olahraga Aerobik Teratur:** Lakukan olahraga intensitas sedang seperti jalan cepat, bersepeda, atau berenang selama **30 menit sehari** (minimal 150 menit seminggu).
3. **Kelola Stres & Tidur Cukup:** Stres kronis memicu pelepasan adrenalin yang membuat pembuluh darah menyempit dan meningkatkan tensi darah.`;
      }

      // D. Pola Hidup / Umum
      if (query.includes('tidur') || query.includes('stres') || query.includes('istirahat') || query.includes('kortisol')) {
        return `💤 **Pengaruh Stres, Tidur, dan Hormon Kortisol terhadap Kesehatan**

Gaya hidup tidak hanya tentang makan dan olahraga, tetapi juga mencakup kualitas istirahat dan kesehatan mental yang memengaruhi jantung & gula darah:

1. **Dampak Kurang Tidur (< 7 Jam Sehari):**
   * Memicu pelepasan **Kortisol** (hormon stres) secara berlebihan. Kortisol memaksa hati melepas glukosa cadangan ke darah, sehingga kadar gula darah Anda meningkat.
   * Meningkatkan nafsu makan makanan manis dan berlemak tinggi akibat terganggunya hormon kenyang (*leptin* dan *ghrelin*).
2. **Dampak Stres Kronis terhadap Kardiovaskular:**
   * Stres memicu hormon **Adrenalin** yang meningkatkan denyut nadi${rawData ? ` (sekarang: **${data.heartRate} bpm**)` : ''} dan memaksa pembuluh darah menyempit secara mendadak (menaikkan tensi darah).
   * Meningkatkan risiko robeknya plak kolesterol di pembuluh darah, memicu penyumbatan mendadak (serangan jantung).
3. **Tips Relaksasi:**
   * **Teknik Pernapasan 4-7-8:** Tarik napas 4 detik, tahan 7 detik, buang perlahan 8 detik untuk merangsang saraf parasimpatis menurunkan tensi secara instan.
   * **Kualitas Tidur:** Jaga jadwal tidur yang konsisten dan hindari layar handphone 1 jam sebelum tidur.`;
      }

      // 1. TDEE & BMR METABOLIC CALCULATION
      if (query.includes('kalori') || query.includes('bmr') || query.includes('tdee') || query.includes('metabolisme')) {
        return `📊 **Laporan Metabolisme & Energi Kustom Anda**
        
Berdasarkan profil fisik Anda (Umur: ${age} thn, Berat: ${weight} kg, Tinggi: ${data.height} cm, Gender: ${gender}, Aktivitas: ${activity === 'Jarang' ? 'Jarang Berolahraga' : activity === 'Sedang' ? 'Aktif Sedang' : 'Sangat Aktif'}):

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
        const activeSmoker = data.smoke === 'Ya';
        return `🚭 **Dampak Nikotin & Rokok pada Jantung & Pembuluh Darah**
        
${activeSmoker ? "⚠️ *Karena Anda menjawab YA untuk merokok, harap perhatikan efek langsungnya pada parameter Anda saat ini:* " : "✓ *Anda tidak merokok, pertahankan kebiasaan baik ini untuk melindungi jantung Anda:*"}

1. **Penyempitan Pembuluh Darah (Vasokonstriksi):** Nikotin merangsang kelenjar adrenal melepaskan hormon adrenalin. Ini mempersempit pembuluh darah secara instan, memicu kenaikan tekanan darah Anda${rawData ? ` (sekarang berada di angka **${data.systolic}/${data.diastolic} mmHg**)` : ''}.
2. **Kerusakan Dinding Pembuluh Darah (Endotel):** Karbon monoksida dan tar dalam asap rokok melukai dinding arteri bagian dalam, mempermudah kolesterol LDL${rawData ? ` (sekarang **${data.cholesterol} mg/dL**)` : ''} menempel dan membentuk plak yang menyumbat pembuluh darah (*Aterosklerosis*).
3. **Penyumbatan Pembuluh Jantung:** Merokok mengencerkan kadar oksigen dalam darah dan meningkatkan risiko pembekuan darah secara mendadap, memicu serangan jantung koroner.

💡 *Tips Berhenti:* Mulailah metode *Nicotine Replacement Therapy* (NRT) atau ganti kebiasaan memegang rokok dengan mengunyah permen karet rendah gula ketika keinginan merokok datang.`;
      }

      // 5. RESTING HEART RATE ANALYSIS
      if (query.includes('nadi') || query.includes('denyut') || query.includes('jantung') || query.includes('detak')) {
        const hr = data.heartRate;
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
        return `🥦 **Tips Mengontrol Kolesterol${rawData ? ` (Aktual: ${data.cholesterol} mg/dL)` : ''}**
        
Batas kolesterol total normal adalah di bawah **200 mg/dL**. Kolesterol Anda berada pada level tinggi, berikut strategi menurunkannya:

1. **Konsumsi Fitosterol & Beta-Glukan:** Zat aktif di oatmeal, bekatul, dan apel membantu memblokir penyerapan kolesterol makanan di usus halus.
2. **Hindari Lemak Trans:** Hindari margarin, krim kue, mentega putih, dan minyak goreng bekas pakai berulang (minyak jelantah).
3. **Tingkatkan HDL (Kolesterol Baik):** Lemak baik dari alpukat, kacang almond, minyak zaitun, dan ikan laut membantu menyapu kolesterol LDL kembali ke hati untuk dibuang.
4. **Olahraga Kardio:** 30 menit jalan cepat atau sepeda statis sehari mendorong produksi enzim yang membersihkan LDL dari dinding pembuluh darah.`;
      }

      // 7. BLOOD PRESSURE DETAILED TIPS
      if (query.includes('darah') || query.includes('tensi') || query.includes('hipertensi')) {
        return `🧂 **Panduan Tekanan Darah${rawData ? ` (Aktual: ${data.systolic}/${data.diastolic} mmHg)` : ''}**
        
Kondisi tensi Anda menunjukkan adanya peningkatan. Ikuti protokol medis berikut:

1. **Restriksi Natrium (Sodium):** Kurangi asupan garam dapur, penyedap rasa (MSG), saus botolan, kecap asin, serta makanan asin (ikan asin, keripik).
2. **Pola Makan DASH:** Diet kaya buah, sayur, gandum utuh, dan produk susu rendah lemak terbukti klinis menurunkan tekanan darah.
3. **Minyak Ikan Omega-3:** Membantu menekan inflamasi vaskular dan membuat pembuluh darah lebih lentur.
4. **Relaksasi Otot Progresif:** Luangkan waktu 10 menit sehari untuk berbaring dan merilekskan otot seluruh tubuh guna menstabilkan sistem saraf simpatis.`;
      }

      // 8. DIABETES & SUGAR DETAILED TIPS
      if (query.includes('gula') || query.includes('diabetes') || query.includes('glukosa')) {
        return `🍭 **Manajemen Kadar Gula Darah${rawData ? ` (Aktual: ${data.sugar} mg/dL)` : ''}**
        
Target gula darah puasa adalah < 100 mg/dL, dan gula darah acak adalah < 140 mg/dL. Kiat menjaga kestabilannya:

1. **Kendali Porsi Karbohidrat (Carb Counting):** Ganti nasi putih hangat dengan nasi merah dingin, oat merah, quinoa, atau shirataki karena seratnya memperlambat pelepasan glukosa.
2. **Jeda Makan Konsisten:** Hindari mengemil di luar jam makan utama. Berikan jeda agar pankreas Anda beristirahat memproduksi insulin.
3. **Aktivitas Pasca Makan:** Berjalan kaki ringan selama 10-15 menit setelah makan membantu otot langsung menyerap glukosa darah tanpa membutuhkan banyak insulin.`;
      }

      if (query.includes('olahraga') || query.includes('aktivitas')) {
        return `🏃 **Panduan Latihan Fisik Kustom**
        
Status olahraga Anda saat ini: **${data.activity === 'Jarang' ? 'Jarang Berolahraga' : 'Aktif'}**.

1. **Tahap Awal:** Jika jarang berolahraga, mulailah dengan **jalan kaki cepat 15 menit sehari**. Hindari langsung melakukan angkat beban berat karena memicu kenaikan tekanan darah mendadak.
2. **Jenis Latihan Terbaik:** Latihan aerobik kardiovaskular (Jalan cepat, sepeda statis, senam aerobik ringan).
3. **Frekuensi:** Lakukan 3-5 kali seminggu dengan target total 150 menit.
4. **Pemantauan Detak Jantung:** Usahakan detak jantung berada di zona aerobik saat latihan (sekitar 100-120 bpm untuk umur Anda).`;
      }

      // Fallback general advice
      return `Sebagai AI Health Coach Anda, saya menyarankan untuk fokus pada perbaikan gaya hidup. 
      
Berdasarkan profil Anda:
- Usahakan menurunkan berat badan menuju target **${targetW} kg** (Tinggi: ${data.height} cm, Berat: ${weight} kg).
- ${data.smoke === 'Ya' ? 'Sangat disarankan untuk mulai mengurangi atau menghentikan kebiasaan merokok.' : 'Pertahankan untuk tidak merokok.'}
- Lakukan aktivitas fisik minimal **30 menit sehari**.
- Batasi konsumsi makanan olahan, garam berlebih, dan gorengan.
      
Apakah ada pertanyaan spesifik tentang diet, olahraga, kolesterol, obat-obatan, atau tensi darah yang ingin Anda tanyakan?`;
    };

    const response = getAnswer();
    if (!rawData) {
      return response + "\n\n💡 *Catatan: Karena Anda belum mengisi data kesehatan pribadi pada tab Dashboard, asisten menjawab menggunakan rujukan medis umum.*";
    }
    return response;
  };

  const suggestionGroups = {
    hipertensi: {
      chips: [
        { text: "Gejala & Ciri-ciri Hipertensi", icon: HelpCircle },
        { text: "Pengobatan & Kontrol Hipertensi", icon: Activity },
        { text: "Pencegahan & Pola Makan Hipertensi", icon: Apple },
        { text: "Bahaya & Komplikasi Hipertensi", icon: Ban },
        { text: "Klasifikasi Tekanan Darah", icon: Activity }
      ]
    },
    diabetes: {
      chips: [
        { text: "Gejala & Ciri-ciri Diabetes", icon: HelpCircle },
        { text: "Pengobatan & Kontrol Diabetes", icon: Activity },
        { text: "Pencegahan & Pola Makan Diabetes", icon: Apple },
        { text: "Bahaya & Komplikasi Diabetes", icon: Ban },
        { text: "Perbedaan Diabetes Tipe 1 & 2", icon: HelpCircle }
      ]
    },
    jantung: {
      chips: [
        { text: "Gejala & Ciri-ciri Penyakit Jantung", icon: HelpCircle },
        { text: "Pengobatan & Kontrol Penyakit Jantung", icon: Activity },
        { text: "Pertolongan Pertama Serangan Jantung", icon: Ban },
        { text: "Faktor Risiko Penyakit Jantung", icon: HelpCircle },
        { text: "Pencegahan & Pola Hidup Sehat Jantung", icon: Apple }
      ]
    },
    umum: {
      chips: [
        { text: "🥗 Menu Makanan 1 Hari", icon: Apple },
        { text: "🔥 Hitung Kalori Harian (TDEE)", icon: Activity },
        { text: "🏃 Panduan Olahraga Aman", icon: Dumbbell },
        { text: "🚭 Bahaya Nikotin bagi Jantung", icon: Ban },
        { text: "💤 Pentingnya Tidur & Stres", icon: HelpCircle }
      ]
    }
  };

  const getRenderedChips = () => {
    if (activeChipTab === 'semua') {
      return [
        ...suggestionGroups.hipertensi.chips,
        ...suggestionGroups.diabetes.chips,
        ...suggestionGroups.jantung.chips,
        ...suggestionGroups.umum.chips
      ];
    }
    return suggestionGroups[activeChipTab].chips;
  };

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

      {/* Category Tabs for suggestion chips */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '12px', 
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '10px'
        }}
      >
        {[
          { id: 'semua', label: 'Semua Kategori' },
          { id: 'hipertensi', label: '🩺 Hipertensi' },
          { id: 'diabetes', label: '🍭 Diabetes' },
          { id: 'jantung', label: '❤️ Jantung' },
          { id: 'umum', label: '🥗 Pola Hidup' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveChipTab(tab.id)}
            style={{
              background: activeChipTab === tab.id ? 'var(--accent-purple)' : 'rgba(255,255,255,0.02)',
              border: '1px solid',
              borderColor: activeChipTab === tab.id ? 'var(--accent-purple)' : 'var(--border-light)',
              borderRadius: '16px',
              padding: '5px 12px',
              fontSize: '11.5px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: activeChipTab === tab.id ? '600' : 'normal',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
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
        {getRenderedChips().map((chip, idx) => {
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
