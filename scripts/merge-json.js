const fs = require('fs');
const path = require('path');

// Dosya yolları
const OLD_DATA_PATH = process.argv[2]; // Eski JSON dosyasının yolu
const NEW_DATA_PATH = process.argv[3]; // Yeni JSON dosyasının yolu
const OUTPUT_PATH = process.argv[4]; // Çıktı dosyasının yolu

// JSON dosyasını oku
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Hata: ${filePath} dosyası okunamadı:`, error.message);
    return [];
  }
}

// JSON dosyasına yaz
function writeJsonFile(filePath, data) {
  try {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Başarılı: ${filePath} dosyası oluşturuldu`);
  } catch (error) {
    console.error(`Hata: ${filePath} dosyası yazılamadı:`, error.message);
  }
}

// Ana fonksiyon
function mergeJsonFiles() {
  // Parametreleri kontrol et
  if (process.argv.length !== 5) {
    console.error('Kullanım: node merge-json.js <eski_json_yolu> <yeni_json_yolu> <çıktı_yolu>');
    process.exit(1);
  }

  // Dosyaları oku
  const oldData = readJsonFile(OLD_DATA_PATH);
  const newData = readJsonFile(NEW_DATA_PATH);

  // ID'leri kontrol et ve birleştir
  const mergedData = [...oldData];
  const existingIds = new Set(oldData.map(item => item.id));

  for (const item of newData) {
    if (!existingIds.has(item.id)) {
      mergedData.push(item);
      existingIds.add(item.id);
    }
  }

  // Tarihe göre sırala (varsa)
  if (mergedData[0]?.createdAt) {
    mergedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Sonucu kaydet
  writeJsonFile(OUTPUT_PATH, mergedData);
  
  // İstatistikleri göster
  console.log('\nBirleştirme İstatistikleri:');
  console.log(`Eski dosyadaki öğe sayısı: ${oldData.length}`);
  console.log(`Yeni dosyadaki öğe sayısı: ${newData.length}`);
  console.log(`Birleştirilmiş dosyadaki toplam öğe sayısı: ${mergedData.length}`);
  console.log(`Eklenen yeni öğe sayısı: ${mergedData.length - oldData.length}`);
}

// Scripti çalıştır
mergeJsonFiles(); 