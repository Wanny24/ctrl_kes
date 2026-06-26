import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Award } from 'lucide-react';

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
      
      Apa yang ingin Anda tanyakan hari ini? (Misal: "Bagaimana cara menurunkan kolesterol?" atau "Olahraga apa yang cocok untuk saya?")`;
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    const newUserMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage('');

    // Generate responsive feedback
    setTimeout(() => {
      const botResponseText = generateBotResponse(userText.toLowerCase());
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

  const generateBotResponse = (query) => {
    if (!rawData) {
      return "Silakan isi data kesehatan Anda terlebih dahulu pada tab input sehingga saya dapat memberikan saran yang akurat.";
    }

    const heightM = rawData.height / 100;
    const targetW = Math.round(22 * heightM * heightM);

    // Contextual answer triggers
    if (query.includes('kolesterol')) {
      return `Kolesterol Anda saat ini adalah ${rawData.cholesterol} mg/dL (batas aman adalah < 200 mg/dL).
      
Langkah konkret menurunkan kolesterol:
1. 🥦 **Serat Larut**: Konsumsi oatmeal, kacang-kacangan, dan apel yang mengikat kolesterol di usus.
2. 🥑 **Lemak Sehat**: Ganti margarin/minyak goreng dengan minyak zaitun. Batasi konsumsi gorengan, kuning telur, dan jeroan.
3. 🐠 **Omega-3**: Konsumsi ikan salmon, tuna, atau suplemen minyak ikan untuk meningkatkan kolesterol baik (HDL).
4. 🚶 **Olahraga**: Lakukan kardio ringan 30 menit sehari untuk membantu metabolisme lemak.`;
    }

    if (query.includes('tekanan darah') || query.includes('hipertensi') || query.includes('tensi')) {
      return `Tekanan darah Anda tercatat ${rawData.systolic}/${rawData.diastolic} mmHg (normal adalah 120/80 mmHg).
      
Saran untuk mengontrol tekanan darah:
1. 🧂 **Diet DASH**: Batasi garam maksimal 1 sendok teh per hari. Hindari makanan kaleng, mi instan, dan asin.
2. 🍌 **Asupan Kalium**: Perbanyak makan pisang, kentang, dan alpukat yang membantu menurunkan ketegangan dinding pembuluh darah.
3. 🧘 **Kelola Stres**: Kurang tidur dan stres dapat memicu pelepasan hormon kortisol yang meningkatkan tekanan darah. Lakukan meditasi atau tidur 7-8 jam per hari.
4. 🚭 **Hentikan Rokok**: ${rawData.smoke === 'Ya' ? 'Karena Anda merokok, nikotin di dalam rokok mempersempit pembuluh darah Anda secara instan. Menghentikan rokok adalah langkah krusial untuk menurunkan tekanan darah Anda.' : 'Pertahankan kebiasaan untuk tidak merokok.'}`;
    }

    if (query.includes('gula darah') || query.includes('diabetes') || query.includes('kencing manis')) {
      return `Gula darah Anda tercatat ${rawData.sugar} mg/dL.
      
Rencana kontrol gula darah:
1. 🍚 **Karbohidrat Kompleks**: Ganti nasi putih dengan nasi merah, oat, atau ubi jalar yang memiliki indeks glikemik rendah (tidak menaikkan gula secara drastis).
2. 🥤 **Hindari Gula Cair**: Stop konsumsi teh manis, boba, soda, dan sirup. Perbanyak air putih.
3. 🏃 **Sensitivitas Insulin**: Olahraga membuat otot menyerap glukosa darah menjadi energi, membantu menyeimbangkan kadar insulin Anda secara alami.`;
    }

    if (query.includes('olahraga') || query.includes('aktivitas')) {
      return `Berdasarkan kebiasaan Anda yang ${rawData.activity === 'Jarang' ? 'jarang berolahraga' : 'sudah aktif'}, berikut rekomendasi aktivitas fisik:
      
1. **Jenis**: Olahraga kardio seperti Jalan Cepat, Jogging Santai, Bersepeda, atau Berenang.
2. **Durasi**: Mulai dari 15-20 menit per hari, tingkatkan bertahap hingga 30-45 menit.
3. **Frekuensi**: Minimal 5 kali seminggu. 
4. **Keuntungan**: Ini akan memperkuat jantung, meningkatkan kapasitas paru-paru, dan membantu pembakaran kolesterol berlebih.`;
    }

    if (query.includes('makanan') || query.includes('diet') || query.includes('makan')) {
      return `Rekomendasi diet sehat untuk profil Anda (Berat: ${rawData.weight} kg, Tinggi: ${rawData.height} cm):
      
1. **Kurangi**: Gorengan, santan, daging merah berlemak, makanan cepat saji, dan camilan asin/manis.
2. **Perbanyak**: Sayuran hijau (bayam, brokoli), buah segar (apel, pir, pepaya), dan sumber protein rendah lemak (dada ayam tanpa kulit, tempe, tahu).
3. **Porsi**: Gunakan metode "Piring T" (setengah piring sayur/buah, seperempat protein, seperempat karbohidrat kompleks).`;
    }

    if (query.includes('berat badan') || query.includes('bmi') || query.includes('gemuk')) {
      return `Berat badan Anda saat ini adalah ${rawData.weight} kg dengan tinggi ${rawData.height} cm. Target berat badan ideal Anda adalah ${targetW} kg.
      
Tips mencapai target berat badan:
1. Defisit kalori secara sehat sebesar 300-500 kalori per hari.
2. Hindari makan larut malam (usahakan makan malam sebelum jam 7).
3. Kombinasikan latihan kekuatan otot (push up, plank) dengan kardio agar massa otot tetap terjaga sementara lemak tubuh terbakar.`;
    }

    // Default general advice
    return `Sebagai AI Health Coach Anda, saya menyarankan untuk fokus pada perbaikan gaya hidup. 
    
Berdasarkan profil Anda:
- Usahakan menurunkan berat badan menuju target **${targetW} kg**.
- ${rawData.smoke === 'Ya' ? 'Sangat disarankan untuk mulai mengurangi atau menghentikan kebiasaan merokok.' : 'Pertahankan untuk tidak merokok.'}
- Lakukan aktivitas fisik minimal **30 menit sehari**.
- Batasi konsumsi makanan olahan, garam berlebih, dan gorengan.
    
Apakah ada pertanyaan spesifik tentang diet, olahraga, kolesterol, atau tensi darah yang ingin Anda diskusikan lebih lanjut?`;
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

      {/* Input row */}
      <form onSubmit={handleSendMessage} className="chat-input-row">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Tanyakan sesuatu... (contoh: 'Bagaimana cara menurunkan kolesterol?')"
          className="form-input"
        />
        <button type="submit" className="btn-send">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
