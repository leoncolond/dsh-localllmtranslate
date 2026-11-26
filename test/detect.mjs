/**
 * Language-detection regression suite.
 *
 * Run with: node test/detect.mjs   (or `npm test`)
 *
 * The cases that matter most are the mixed ones: a long English document that
 * quotes a Chinese sentence must stay English, and a Chinese document with
 * English identifiers must stay Chinese.
 */
import { detectLanguage, defaultTargetFor } from '../lib/shared.js'

const englishParagraph = 'The host process may still hold a file handle to the plugin directory after the '
  + 'uninstall, because the module was loaded earlier in the session. A restart of the application '
  + 'releases those handles, but we should not restart while the user is working. Instead, inspect '
  + 'the log first and look for the package manager error code.'

const englishCot = `We need to diagnose the failure of plugin installation:
"Plugin installation failed - no write permissions, thus unable to install."

Installation location: C:\\Users\\qiang\\.dsh\\profiles\\desktop
pnpm add dsh-localllmtranslate exit code 1
Warnings: "Lockfile complies with supply-chain policies", ERR_PNPM_EPERM
[importPackage] C:\\Users\\qiang\\.dsh\\profiles\\desktop\\node_modules...

Read-only attribute more likely. The error text in the screenshot is cut.
Let's read log and inspect. Use pwsh with paths; no modifications.`

const chineseParagraph = '这个插件用本机运行的模型做翻译，文本不会离开本机。左侧栏可以打开翻译面板，'
  + '支持术语本和历史记录。如果本机没有运行时，会给出三步向导，按提示安装即可。'

const cases = [
  ['pure english', englishParagraph, 'en'],
  ['english chain-of-thought', englishCot, 'en'],
  ['english with a quoted chinese sentence', 'We need to diagnose this. The screenshot says 「插件安装失败」. Windows file locks are the likely cause.', 'en'],
  ['english with a chinese chinese-terminated sentence', 'The run failed again. 注意：这里的问题在于目录被占用，需要重启。 Restart may be required.', 'en'],
  ['chinese with english identifiers', '插件用 llama-server 启动本地模型，端口 18081，配置文件在 settings.json 里，文本不会上传。', 'zh'],
  ['chinese with a long english code block', `${chineseParagraph}\n\n\`\`\`bash\nnpm install dsh-localllmtranslate --no-audit --no-fund\npnpm add git+https://gitee.com/leoncolond/dsh-localllmtranslate.git\n\`\`\``, 'zh'],
  ['simplified chinese', chineseParagraph, 'zh'],
  ['traditional chinese', '這個外掛用本機執行的模型做翻譯，文字不會離開本機。左側欄可以開啟翻譯面板，支援術語本和歷史記錄。', 'zh-Hant'],
  ['cantonese', '我哋今日去睇戲啦，你哋有冇興趣？佢話唔得閒，咁我哋就自己去。', 'yue'],
  ['japanese', '今日は良い天気ですね。散歩に行きましょうか？', 'ja'],
  ['japanese kanji heavy', '日本語の文章です。漢字が多いですが、ひらがなも含まれます。', 'ja'],
  ['korean', '오늘 날씨가 정말 좋네요. 산책하러 갈까요?', 'ko'],
  ['russian', 'Сегодня отличная погода. Пойдём гулять?', 'ru'],
  ['ukrainian', 'Сьогодні чудова погода. Підемо гуляти?', 'uk'],
  ['arabic', 'الطقس جميل اليوم. هل نذهب في نزهة؟', 'ar'],
  ['persian', 'امروز هوا عالی است. برویم قدم بزنیم؟', 'fa'],
  ['urdu', 'آج موسم بہت اچھا ہے۔ ہم چہل قدمی کریں؟', 'ur'],
  ['hebrew', 'מזג האוויר נהדר היום. נלך לטייל?', 'he'],
  ['thai', 'วันนี้อากาศดีมาก ไปเดินเล่นกันไหม', 'th'],
  ['hindi', 'आज मौसम बहुत अच्छा है। चलो टहलने चलें।', 'hi'],
  ['bengali', 'আজ আবহাওয়া খুব ভালো। চলুন হাঁটতে যাই।', 'bn'],
  ['tamil', 'இன்று வானிலை மிகவும் நன்றாக உள்ளது. நாம் நடக்க செல்லலாம்.', 'ta'],
  ['telugu', 'ఈరోజు వాతావరణం చాలా బాగుంది. మనం నడవడానికి వెళ్దాం.', 'te'],
  ['vietnamese', 'Hôm nay thời tiết rất đẹp. Chúng ta đi dạo nhé?', 'vi'],
  ['turkish', 'Bugün hava çok güzel. Yürüyüşe çıkalım mı?', 'tr'],
  ['polish', 'Dzisiaj jest bardzo ładna pogoda. Pójdziemy na spacer?', 'pl'],
  ['czech', 'Dnes je velmi hezké počasí. Půjdeme se projít?', 'cs'],
  ['german', 'Heute ist das Wetter sehr schön. Gehen wir spazieren?', 'de'],
  ['french', "Aujourd'hui, il fait très beau. Allons nous promener ?", 'fr'],
  ['spanish', 'Hoy hace muy buen tiempo. ¿Vamos a pasear?', 'es'],
  ['portuguese', 'Hoje o tempo está muito bom. Vamos passear?', 'pt'],
  ['italian', 'Oggi il tempo è molto bello. Andiamo a fare una passeggiata?', 'it'],
  ['dutch', 'Vandaag is het weer erg mooi. Gaan we wandelen?', 'nl'],
  ['indonesian', 'Hari ini cuacanya sangat bagus. Ayo kita jalan-jalan?', ['id', 'ms']],
  ['malay', 'Hari ini cuaca sangat baik. Mari kita berjalan-jalan?', ['id', 'ms']],
  ['filipino', 'Ngayon ay napakaganda ng panahon. Tara na, maglakad tayo?', 'tl'],
  ['short english', 'Hello world', 'en'],
  ['empty', '   ', 'en'],
  ['english plus short chinese prefix', '插件目录可能被锁定了。 The host process may lock the plugin directory and a restart may be required.', 'en'],
]

let failed = 0
for (const [name, text, expected] of cases) {
  const actual = detectLanguage(text)
  const accepted = Array.isArray(expected) ? expected : [expected]
  if (accepted.includes(actual)) {
    console.log(`ok   ${name} -> ${actual}`)
  } else {
    failed += 1
    console.log(`FAIL ${name}: expected ${accepted.join('/')}, got ${actual}`)
  }
}

// `auto` target: CJK sources translate to English, everything else to Chinese.
const targetCases = [
  ['zh', 'en'], ['zh-Hant', 'en'], ['yue', 'en'], ['en', 'zh'],
  ['ja', 'zh'], ['ko', 'zh'], ['fr', 'zh'], ['ru', 'zh'],
]
for (const [source, expected] of targetCases) {
  const actual = defaultTargetFor(source)
  if (actual === expected) {
    console.log(`ok   target(${source}) -> ${actual}`)
  } else {
    failed += 1
    console.log(`FAIL target(${source}): expected ${expected}, got ${actual}`)
  }
}

console.log(failed === 0 ? `\nall ${cases.length + targetCases.length} checks passed` : `\n${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
