const fs = require('fs');
const path = require('path');

// Kuzatish uchun fayl yo'li
const styleFilePath = path.join(__dirname, 'css', 'styles.css');
// HTML fayllar ro'yxati
const htmlFiles = [
  path.join(__dirname, 'index.html'),
  path.join(__dirname, 'telegram.html')
];

// Style tagini yangilash funksiyasi
function updateStyleTags(cssContent) {
  htmlFiles.forEach(htmlFile => {
    // HTML faylni o'qish
    fs.readFile(htmlFile, 'utf8', (err, htmlContent) => {
      if (err) {
        console.error(`${htmlFile} faylini o'qishda xatolik:`, err);
        return;
      }

      // Style tagini topish va yangilash
      const styleRegex = /(<style>)[\s\S]*?(<\/style>)/;

      if (styleRegex.test(htmlContent)) {
        // Agar style tegi mavjud bo'lsa, uni yangilash
        const updatedHtml = htmlContent.replace(styleRegex, `$1\n${cssContent}\n$2`);

        // Yangilangan HTML faylini saqlash
        fs.writeFile(htmlFile, updatedHtml, 'utf8', (err) => {
          if (err) {
            console.error(`${htmlFile} faylini yozishda xatolik:`, err);
            return;
          }
          console.log(`${htmlFile} faylidagi style tegi yangilandi.`);
        });
      } else {
        // Agar style tegi mavjud bo'lmasa, head tagiga qo'shish
        const headEndRegex = /<\/head>/;
        if (headEndRegex.test(htmlContent)) {
          const updatedHtml = htmlContent.replace(
            headEndRegex,
            `<style>\n${cssContent}\n</style>\n</head>`
          );

          fs.writeFile(htmlFile, updatedHtml, 'utf8', (err) => {
            if (err) {
              console.error(`${htmlFile} faylini yozishda xatolik:`, err);
              return;
            }
            console.log(`${htmlFile} fayliga style tegi qo'shildi.`);
          });
        } else {
          console.error(`${htmlFile} faylida head tegi topilmadi.`);
        }
      }
    });
  });
}

// CSS faylini o'qish va style taglarini yangilash
function updateStylesInHtmlFiles() {
  fs.readFile(styleFilePath, 'utf8', (err, cssContent) => {
    if (err) {
      console.error('CSS faylini o\'qishda xatolik:', err);
      return;
    }

    updateStyleTags(cssContent);
  });
}

// CSS faylini dastlab bir marta yangilash
updateStylesInHtmlFiles();

// CSS faylini kuzatish
console.log(`${styleFilePath} faylini kuzatish boshlandi...`);
fs.watch(styleFilePath, (eventType) => {
  if (eventType === 'change') {
    console.log('change')
    console.log('CSS fayli o\'zgartirildi, HTML fayllarni yangilash...');
    // O'zgartirish sodir bo'lgandan so'ng ozgina kutish (fayl to'liq yozilishi uchun)
    setTimeout(updateStylesInHtmlFiles, 100);
  }
});
