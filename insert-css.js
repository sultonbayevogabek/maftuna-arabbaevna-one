const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const chokidar = require('chokidar'); // Bu npm paketni o'rnatish kerak: npm install chokidar

// Kerakli fayl yo'llari
const INPUT_CSS_PATH = './css/input.css';
const OUTPUT_CSS_PATH = './css/styles.css';
const HTML_FILES = ['./index.html', './telegram.html']; // Ikkala HTML fayl ham

// Tailwind chiqishlarini boshqarish uchun flag
let tailwindRunning = false;

// HTML fayllarini yangilash jarayonini boshqarish uchun flag
let updatingHtml = false;

// Tailwind buyrug'ini ishga tushirish
function runTailwind() {
  if (tailwindRunning) {
    console.log('Tailwind CSS allaqachon ishlayapti, kutilmoqda...');
    return;
  }

  tailwindRunning = true;
  console.log('Tailwind CSS kompilyatsiya qilinmoqda...');

  exec(`npx tailwindcss -i ${INPUT_CSS_PATH} -o ${OUTPUT_CSS_PATH} --minify`, (error, stdout, stderr) => {
    tailwindRunning = false;

    if (error) {
      console.error(`Tailwind xatosi: ${error.message}`);
      return;
    }

    // stderr ni xato deb emas, balki ma'lumot sifatida ko'ramiz
    if (stderr) {
      console.log(`Tailwind ma'lumoti: ${stderr}`);
    }

    if (stdout) {
      console.log(`Tailwind natijasi: ${stdout}`);
    }

    // CSS fayldan kontent olish va barcha HTML fayllarga yozish
    setTimeout(() => {
      injectCssToAllHtmlFiles();
    }, 300); // CSS fayli yozilishini kutish uchun kichik kechikish
  });
}

// CSS kodni barcha HTML fayllarga qo'shish
function injectCssToAllHtmlFiles() {
  if (updatingHtml) {
    console.log('HTML fayllar allaqachon yangilanmoqda, keyingisi kutilmoqda...');
    return;
  }

  updatingHtml = true;

  try {
    // CSS faylni o'qish
    if (!fs.existsSync(OUTPUT_CSS_PATH)) {
      console.error(`CSS fayli mavjud emas: ${OUTPUT_CSS_PATH}`);
      updatingHtml = false;
      return;
    }

    const cssContent = fs.readFileSync(OUTPUT_CSS_PATH, 'utf8');
    if (!cssContent || cssContent.trim() === '') {
      console.warn('CSS fayli bo\'sh');
      updatingHtml = false;
      return;
    }

    // Har bir HTML fayl uchun amallar
    let successCount = 0;
    HTML_FILES.forEach(htmlFilePath => {
      if (injectCssToHtmlFile(htmlFilePath, cssContent)) {
        successCount++;
      }
    });

    console.log(`${successCount}/${HTML_FILES.length} HTML fayllar muvaffaqiyatli yangilandi`);
  } catch (err) {
    console.error(`CSS ni HTML fayllarga yozishda xatolik yuz berdi: ${err.message}`);
  } finally {
    updatingHtml = false;
  }
}

// CSS kodni bitta HTML faylga qo'shish
function injectCssToHtmlFile(htmlFilePath, cssContent) {
  try {
    // HTML fayl mavjudligini tekshirish
    if (!fs.existsSync(htmlFilePath)) {
      console.error(`HTML fayli mavjud emas: ${htmlFilePath}`);
      return false;
    }

    // HTML faylni o'qish
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

    // <style> tegida mavjud bo'lgan kodni yangilaymiz
    let updatedHtml;
    if (htmlContent.includes('<style>') && htmlContent.includes('</style>')) {
      // <style> tegini yangilaymiz
      updatedHtml = htmlContent.replace(/<style>[\s\S]*?<\/style>/, `<style>${cssContent}</style>`);
    } else {
      // <head> tegi ichiga <style> qo'shamiz
      if (!htmlContent.includes('</head>')) {
        console.warn(`${htmlFilePath} faylida </head> tegi topilmadi`);
        // Agar <html> tegi mavjud bo'lsa, uning ichiga qo'shamiz
        if (htmlContent.includes('<html>') || htmlContent.includes('<html ')) {
          updatedHtml = htmlContent.replace(/<html([^>]*)>/, `<html$1>\n<head>\n<style>${cssContent}</style>\n</head>\n`);
        } else {
          // Fayl boshiga qo'shamiz
          updatedHtml = `<html>\n<head>\n<style>${cssContent}</style>\n</head>\n${htmlContent}\n</html>`;
        }
      } else {
        updatedHtml = htmlContent.replace('</head>', `<style>${cssContent}</style>\n</head>`);
      }
    }

    // Yangilangan HTML faylni yozamiz
    if (updatedHtml !== htmlContent) {
      fs.writeFileSync(htmlFilePath, updatedHtml);
      console.log(`✅ CSS kodi ${htmlFilePath} fayliga muvaffaqiyatli qo'shildi`);
      return true;
    } else {
      console.log(`⚠️ ${htmlFilePath} faylida o'zgarish qilinmadi`);
      return false;
    }
  } catch (err) {
    console.error(`❌ ${htmlFilePath} bilan ishlashda xatolik yuz berdi: ${err.message}`);
    return false;
  }
}

// Watcherlar o'rnatish
function setupWatchers() {
  // input.css faylini kuzatish - bu o'zgarsa Tailwind ishga tushadi
  console.log(`${INPUT_CSS_PATH} fayli kuzatilmoqda...`);
  const inputWatcher = chokidar.watch(INPUT_CSS_PATH, {
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  inputWatcher.on('change', (path) => {
    console.log(`\n📝 Input CSS o'zgarishi aniqlandi: ${path}`);
    runTailwind();
  });

  // output.css faylini kuzatish - agar boshqa dastur tomonidan o'zgartirilsa
  console.log(`${OUTPUT_CSS_PATH} fayli kuzatilmoqda...`);
  const outputWatcher = chokidar.watch(OUTPUT_CSS_PATH, {
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  outputWatcher.on('change', (path) => {
    // Agar bu o'zgarish Tailwind tomonidan bo'lmasa
    if (!tailwindRunning) {
      console.log(`\n📝 Output CSS o'zgarishi aniqlandi: ${path}`);
      injectCssToAllHtmlFiles();
    }
  });

  // HTML fayllarni kuzatish - teglarni qayta qo'yish uchun
  console.log(`HTML fayllar kuzatilmoqda: ${HTML_FILES.join(', ')}`);
  const htmlWatcher = chokidar.watch(HTML_FILES, {
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  htmlWatcher.on('change', (path) => {
    // Agar bu o'zgarish bizning injektor tomonidan bo'lmasa
    if (!updatingHtml) {
      console.log(`\n📝 HTML o'zgarishi aniqlandi: ${path}`);
      // CSS fayli mavjud bo'lsa, uni shu HTML faylga injektor qilamiz
      if (fs.existsSync(OUTPUT_CSS_PATH)) {
        try {
          const cssContent = fs.readFileSync(OUTPUT_CSS_PATH, 'utf8');
          injectCssToHtmlFile(path, cssContent);
        } catch (err) {
          console.error(`HTML o'zgarishini qayta ishlashda xatolik: ${err.message}`);
        }
      }
    }
  });
}

// Dastlab barcha watcherlarni o'rnatish
setupWatchers();

// Dastlab bir marta ishga tushirish
console.log('\n🚀 Dastlabki Tailwind CSS kompilyatsiyasi boshlanmoqda...');
runTailwind();

console.log(`📄 CSS kodi quyidagi fayllarga yoziladi: ${HTML_FILES.join(', ')}`);
