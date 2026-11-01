// thaiproof: ตรวจภาษาไทย คำสะกดผิด คำทับศัพท์ สำนวนแปล และคำที่ฟ้องว่า AI เขียน
//
//   node thaiproof.mjs README.md docs/*.md
//   cat draft.txt | node thaiproof.mjs
//   node thaiproof.mjs --json --no-royin --no-hints --strict file.md
//
// Works in Node and in the browser: import { lint } from "./thaiproof.mjs"
// No dependencies.

const ERROR = "error", WARNING = "warning", HINT = "hint"
const THAI = "\\u0E00-\\u0E7F"

// [wrong (regex source), right]. Only forms that are never correct words in their own right.
const SPELLING = [
  ["กระทันหัน", "กะทันหัน"], ["กระทัดรัด", "กะทัดรัด"], ["กระพริบ", "กะพริบ"], ["กระเพรา|กะเพา", "กะเพรา"],
  ["กาละเทศะ", "กาลเทศะ"], ["กำหนดการณ์", "กำหนดการ"], ["กิติมศักดิ์", "กิตติมศักดิ์"], ["กังวาล", "กังวาน"],
  ["กำเหนิด", "กำเนิด"], ["อนุญาติ", "อนุญาต"], ["สังเกตุ", "สังเกต"], ["ปรากฎ", "ปรากฏ"],
  ["(?<!รา)กฏ", "กฎ"], ["ปฎิ", "ปฏิ"], ["ผลลัพท์|ผลลัพธ(?!์)", "ผลลัพธ์"], ["คลีนิก|คลีนิค|คลินิค", "คลินิก"],
  ["ลายเซ็นต์", "ลายเซ็น"], ["เซ็นต์ชื่อ", "เซ็นชื่อ"], ["คำนวน", "คำนวณ"], ["รสชาด", "รสชาติ"],
  ["ลำใย", "ลำไย"], ["ไอศครีม", "ไอศกรีม"], ["อนุเสาวรีย์", "อนุสาวรีย์"], ["ศรีษะ", "ศีรษะ"],
  ["จราจล", "จลาจล"], ["เวทย์มนต์|เวทย์มนตร์|เวทมนต์", "เวทมนตร์"], ["ผาสุข", "ผาสุก"], ["ทะเลสาป", "ทะเลสาบ"],
  ["ภาพยนต์", "ภาพยนตร์"], ["ขมักเขม้น", "ขะมักเขม้น"], ["ปราณีต", "ประณีต"], ["ไวยกรณ์", "ไวยากรณ์"],
  ["อุโบสถ์", "อุโบสถ"], ["บรรได", "บันได"], ["บรรเทิง", "บันเทิง"], ["บรรทึก", "บันทึก"],
  ["สังสรร(?!ค์)", "สังสรรค์"], ["โอกาศ", "โอกาส"], ["ประสพการณ์", "ประสบการณ์"], ["ประสพความสำเร็จ", "ประสบความสำเร็จ"],
  ["ผูกพันธ์", "ผูกพัน"], ["สมดุลย์", "สมดุล"], ["ฉนั้น", "ฉะนั้น"], ["ลูกเกตุ", "ลูกเกด"],
  ["รื่นรมณ์", "รื่นรมย์"], ["อาเจียร", "อาเจียน"], ["เครื่องสำอางค์", "เครื่องสำอาง"], ["บิณฑบาตร", "บิณฑบาต"],
  ["อานิสงฆ์", "อานิสงส์"], ["กงศุล", "กงสุล"], ["พิสดาล", "พิสดาร"], ["ดาดดื่น", "ดาษดื่น"],
  ["ทนุถนอม", "ทะนุถนอม"], ["มาตราการ", "มาตรการ"], ["เกล็ดความรู้", "เกร็ดความรู้"], ["อัฒจรรย์|อัธจันทร์", "อัฒจันทร์"],
]

// Loanwords: the Royal Institute's spelling. Common usage differs, so these are warnings.
const ROYIN = [
  ["แอพพลิเคชั่น|แอปพลิเคชั่น|แอพพลิเคชัน|แอพพลิเคชั้น", "แอปพลิเคชัน"], ["แอพ(?!พลิ)", "แอป"],
  ["อัพเดท|อัพเดต|อัปเดท|อัพเด้ท", "อัปเดต"], ["อัพโหลด", "อัปโหลด"], ["อัพเกรด", "อัปเกรด"], ["ดาวโหลด", "ดาวน์โหลด"],
  ["ฟังก์ชั่น|ฟังค์ชั่น|ฟังค์ชัน", "ฟังก์ชัน"], ["สมาร์ท", "สมาร์ต"], ["กราฟฟิก|กราฟฟิค|กราฟิค", "กราฟิก"],
  ["คลิ้ก|คลิ๊ก|คลิค", "คลิก"], ["ลิ้งค์|ลิงค์|ลิ้งก์", "ลิงก์"], ["แล็ป", "แล็บ"], ["อีเมล์|อีเมลล์|อีเมว", "อีเมล"],
  ["เว็บไซท์|เว็ปไซต์|เว็ปไซท์|เวบไซต์|เวปไซต์", "เว็บไซต์"], ["เว็ป(?!ไซ)", "เว็บ"], ["ซอฟท์แวร์|ซอฟแวร์|ซอฟต์แว(?!ร์)", "ซอฟต์แวร์"],
  ["อินเตอร์เน็ต|อินเตอร์เน็ท|อินเทอร์เน็ท", "อินเทอร์เน็ต"], ["เซิฟเวอร์|เซิร์ฟเวอ(?!ร์)|เซิร์ฟเว่อร์", "เซิร์ฟเวอร์"],
  ["ล็อคอิน", "ล็อกอิน"], ["ล็อค(?!อิน)", "ล็อก"], ["บล็อค", "บล็อก"], ["เฟสบุ๊ค|เฟซบุ๊ค|เฟสบุ๊ก|เฟสบุค", "เฟซบุ๊ก"],
  ["ไลค์", "ไลก์"], ["แชท", "แชต"], ["โพสท์", "โพสต์"], ["คอมเม้นท์|คอมเมนท์|คอมเม้นต์|คอมเม้น(?![ต])", "คอมเมนต์"],
  ["เทมเพลท|เทมเพล็ต", "เทมเพลต"], ["แพลทฟอร์ม", "แพลตฟอร์ม"], ["สตาร์ทอัพ|สตาร์ทอัป|สตาร์ตอัพ", "สตาร์ตอัป"],
  ["โปรเจค(?!ต์|เตอร์)|โปรเจ็ค|โปรเจ็กต์|โปรเจคต์", "โปรเจกต์"], ["อัลกอริธึม|อัลกอริทึ่ม|อัลกอรึทึม", "อัลกอริทึม"],
  ["แท็ค", "แท็ก"], ["คอนเทนท์|คอนเท้นต์|คอนเท้นท์", "คอนเทนต์"], ["อีเว้นท์|อีเวนท์|อีเว้นต์", "อีเวนต์"],
  ["โน้ตบุ๊ค|โน๊ตบุ๊ค|โน๊ตบุ๊ก", "โน้ตบุ๊ก"], ["สเปค|สเป็ค|สเป็ก", "สเปก"], ["วีดีโอ|วีดิโอ|วิดิโอ", "วิดีโอ"],
  ["ยูทูป|ยูทู้บ", "ยูทูบ"], ["กูเกิ้ล|กู้เกิล", "กูเกิล"], ["แอนดรอย(?!ด์)", "แอนดรอยด์"], ["ซีรี่ส์|ซีรี่ย์|ซีรีย์", "ซีรีส์"],
  ["โปรโมชั่น", "โปรโมชัน"], ["เปอร์เซนต์|เปอร์เซ็น(?!ต์)", "เปอร์เซ็นต์"], ["ออฟฟิส", "ออฟฟิศ"], ["โควต้า", "โควตา"],
  ["ช็อคโกแลต|ช๊อคโกแลต|ช็อกโกแลท", "ช็อกโกแลต"], ["แซนวิช|แซนด์วิซ", "แซนด์วิช"], ["ปิคนิค|ปิกนิค|ปิคนิก", "ปิกนิก"],
  ["(?<!ซี|เอเชียน|ปิก|พาราลิม)เกมส์", "เกม"],
]

// [pattern, label, advice]. Hints: style, not mistakes.
const STYLE = [
  ["ทำการ(?=[" + THAI + "])", "สำนวนแปล", "ใช้กริยาตรงๆ: \"ทำการติดตั้ง\" เป็น \"ติดตั้ง\""],
  ["ในการที่จะ", "สำนวนแปล", "ใช้ \"เพื่อ\" หรือตัดทิ้ง"],
  ["คุณสามารถ", "สำนวนแปล", "ภาษาไทยละประธานได้: \"คุณสามารถดาวน์โหลดได้ที่\" เป็น \"ดาวน์โหลดได้ที่\""],
  ["ถูก(สร้าง|ออกแบบ|พัฒนา|เขียน|นำมาใช้|นำไปใช้|ใช้งาน|ใช้ใน|ติดตั้ง|เพิ่ม|อัปเดต|กำหนด|ตั้งค่า|แสดง|จัดเก็บ|เก็บไว้|เรียกใช้|เผยแพร่|ปรับปรุง)",
    "สำนวนแปล", "\"ถูก\" ในภาษาไทยมักใช้กับเรื่องไม่ดี: \"ถูกออกแบบมาเพื่อ\" เป็น \"ออกแบบมาเพื่อ\""],
  ["เพื่อให้มั่นใจว่า", "สำนวนแปล", "แปลตรงจาก \"to ensure\" ลองใช้ \"ให้แน่ใจว่า\" หรือเขียนใหม่"],
  ["ในแง่ของ|ในส่วนของ", "สำนวนแปล", "มักตัดได้ เช่น \"ในแง่ของความเร็ว ระบบ...\" เป็น \"ระบบเร็วขึ้น...\""],
  ["เป็นที่น่าสังเกตว่า|เป็นสิ่งที่", "สำนวนแปล", "ตัดทิ้งแล้วพูดเรื่องนั้นเลย"],
  ["ไม่ใช่แค่[^\\n]{1,40}?แต่(ยัง|เป็น)", "สำนวนแปล", "โครง \"not only... but also\" ลองแยกเป็นสองประโยค"],
  ["มีความ(ยืดหยุ่น|ปลอดภัย|เสถียร|รวดเร็ว|ง่าย|ทันสมัย|น่าเชื่อถือ|แม่นยำ|สะดวก)", "สำนวนแปล", "ตัด \"มีความ\" ได้: \"มีความยืดหยุ่น\" เป็น \"ยืดหยุ่น\""],
  ["อย่างมีประสิทธิภาพ", "คำที่ AI ชอบใช้", "บอกให้ชัดว่าดีขึ้นยังไง เช่น เร็วขึ้นกี่เท่า ประหยัดกี่บาท"],
  ["ไร้รอยต่อ|อย่างไร้รอยต่อ", "คำที่ AI ชอบใช้", "แปลจาก \"seamless\" คนไทยไม่ค่อยพูดแบบนี้"],
  ["ยกระดับ|ปลดล็อก|ปลดล็อค|ขับเคลื่อนด้วย|ทรงพลัง|ครบวงจร|เจาะลึก|ก้าวข้ามขีดจำกัด|ปฏิวัติวงการ|เปลี่ยนเกม|โลกแห่ง", "คำที่ AI ชอบใช้",
    "คำโฆษณาที่ AI ใช้บ่อย บอกสิ่งที่ทำได้จริงแทน"],
  ["ในยุคดิจิทัล|ในยุคปัจจุบัน|ในโลกที่[^\\n]{0,20}เปลี่ยนแปลง", "คำที่ AI ชอบใช้", "ประโยคเปิดแบบ AI ตัดทิ้งแล้วเริ่มที่เรื่องเลย"],
  ["ไม่ว่าจะเป็น", "คำที่ AI ชอบใช้", "AI ชอบใช้ไล่รายการ ลองเขียนรายการตรงๆ"],
  ["นอกจากนี้ยัง|นอกจากนี้|สิ่งสำคัญคือ|ที่สำคัญที่สุดคือ|มาดูกัน|ในบทความนี้|โดยสรุป|สรุปได้ว่า", "คำที่ AI ชอบใช้",
    "คำเชื่อมแบบเรียงความ ตัดออกแล้วอ่านดูว่ายังรู้เรื่องไหม"],
  ["เป็นอย่างมาก|อย่างแท้จริง|อย่างยิ่ง", "คำที่ AI ชอบใช้", "คำขยายที่ไม่เพิ่มข้อมูล ตัดได้"],
]

// question words that need คะ, and statements that need ค่ะ
const QUESTION_KA = new RegExp("(ไหม|มั้ย|มั๊ย|หรือเปล่า|หรือยัง|หรือไม่|อะไร|ที่ไหน|เมื่อไร|เมื่อไหร่|ยังไง|อย่างไร|ทำไม|เท่าไร|เท่าไหร่|ใคร)\\s*ค่ะ", "g")
const STATEMENT_KA = new RegExp("(ขอบคุณ|สวัสดี|ยินดี|ได้เลย|เรียบร้อยแล้ว|เรียบร้อย|รับทราบ|ขอโทษ|ไม่เป็นไร)\\s*คะ(?![" + THAI + "])", "g")

const compile = (rows, level, rule, message) =>
  rows.map(([wrong, right]) => ({ re: new RegExp(wrong, "g"), level, rule, fix: right, message }))
const WORD_RULES = [
  ...compile(SPELLING, ERROR, "สะกดผิด", "ที่ถูกเขียนว่า"),
  ...compile(ROYIN, WARNING, "ทับศัพท์", "ราชบัณฑิตยสภาเขียนว่า"),
]
const STYLE_RULES = STYLE.map(([p, label, advice]) => ({ re: new RegExp(p, "g"), level: HINT, rule: label, advice }))

// Blank out code, URLs and HTML comments, keeping every character's position. The filler isn't a
// space, so `a` `b` doesn't turn into a double space.
export function mask(text) {
  const blank = (m) => m.replace(/[^\n]/g, "\u0000")
  return text
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/`[^`\n]+`/g, blank)
    .replace(/https?:\/\/[^\s)>\]]+/g, blank)
}

export function lint(text, { royin = true, hints = true } = {}) {
  const src = mask(text.replace(/\r\n?/g, "\n"))
  const starts = [0]
  for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1)
  const where = (index) => {
    let lo = 0, hi = starts.length - 1
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= index) lo = mid; else hi = mid - 1 }
    return { line: lo + 1, column: index - starts[lo] + 1 }
  }
  const out = []
  const push = (level, rule, index, found, suggestion, message) =>
    out.push({ level, rule, index, length: found.length, ...where(index), found, suggestion, message })

  // words: keep the longest match where rules overlap
  const words = []
  for (const r of WORD_RULES) {
    if (r.level === WARNING && !royin) continue
    for (const m of src.matchAll(r.re)) words.push({ r, index: m.index, found: m[0] })
  }
  words.sort((a, b) => a.index - b.index || b.found.length - a.found.length)
  let end = -1
  for (const w of words) {
    if (w.index < end) continue
    end = w.index + w.found.length
    push(w.r.level, w.r.rule, w.index, w.found, w.r.fix, `${w.r.message} "${w.r.fix}"`)
  }

  for (const m of src.matchAll(QUESTION_KA)) {
    if (new RegExp("ไม่[" + THAI + "]{0,4}\\s*$").test(src.slice(Math.max(0, m.index - 6), m.index))) continue  // ไม่มีอะไรค่ะ is a statement
    push(ERROR, "คะ/ค่ะ", m.index, m[0], m[0].replace(/ค่ะ$/, "คะ"), "ประโยคคำถามใช้ \"คะ\"")
  }
  for (const m of src.matchAll(/นะค่ะ/g)) push(ERROR, "คะ/ค่ะ", m.index, m[0], "นะคะ", "\"นะ\" ตามด้วย \"คะ\"")
  for (const m of src.matchAll(STATEMENT_KA)) push(ERROR, "คะ/ค่ะ", m.index, m[0], m[0].replace(/คะ$/, "ค่ะ"), "ประโยคบอกเล่าใช้ \"ค่ะ\"")

  const thaiChars = (src.match(new RegExp("[" + THAI + "]", "g")) || []).length
  if (hints) {
    for (const r of STYLE_RULES) for (const m of src.matchAll(r.re)) push(HINT, r.rule, m.index, m[0], null, r.advice)
    for (const m of src.matchAll(new RegExp("[" + THAI + "]( {2,})(?=[" + THAI + "])", "g")))
      push(HINT, "เว้นวรรค", m.index + 1, m[1], " ", "เว้นวรรคซ้อน")

    const doc = (rule, re, minCount, advice) => {
      const all = [...src.matchAll(re)]
      if (all.length >= minCount) push(HINT, rule, all[0].index, all[0][0], null, advice(all.length))
    }
    doc("คำที่ AI ชอบใช้", /\p{Extended_Pictographic}/gu, 4, (n) => `ใช้อีโมจิ ${n} ตัว ข้อความที่อีโมจิเยอะมักอ่านแล้วเหมือน AI เขียน`)
    doc("สำนวนแปล", /คุณ(?!ภาพ|สมบัติ|ค่า|ประโยชน์|ธรรม|ลักษณะ|ูปการ|วุฒิ|หญิง|นาย|พ่อ|แม่|ครู|ป้า|ลุง|ยาย|ตา)/g,
      Math.max(3, Math.ceil(thaiChars / 300)), (n) => `ใช้ "คุณ" ${n} ครั้ง ภาษาไทยไม่ต้องมีประธานทุกประโยค`)
    doc("คำที่ AI ชอบใช้", new RegExp("[" + THAI + "]\\s*!", "g"), 3, (n) => `ใช้ ! ${n} ครั้ง ลองลดลง`)
    if (/ครับ/.test(src) && new RegExp("ค่ะ|คะ(?![" + THAI + "])").test(src))
      doc("ระดับภาษา", /ครับ/g, 1, () => "มีทั้ง \"ครับ\" และ \"ค่ะ/คะ\" ในข้อความเดียว เลือกแบบเดียว (ยกเว้นเป็นบทสนทนา)")
    if (/\b25\d\d\b/.test(src) && /\b(19|20)\d\d\b/.test(src) && !/พ\.ศ\.|ค\.ศ\./.test(src))
      doc("ตัวเลข", /\b25\d\d\b/g, 1, () => "มีทั้งปี พ.ศ. และ ค.ศ. ระบุให้ชัดว่าเป็น พ.ศ. หรือ ค.ศ.")
  }

  const order = { error: 0, warning: 1, hint: 2 }
  out.sort((a, b) => a.index - b.index || order[a.level] - order[b.level])
  const ai = out.filter((p) => p.rule === "คำที่ AI ชอบใช้" || p.rule === "สำนวนแปล").length
  const score = thaiChars ? Math.round((ai * 1000 / thaiChars) * 10) / 10 : 0
  return {
    problems: out,
    stats: {
      errors: out.filter((p) => p.level === ERROR).length,
      warnings: out.filter((p) => p.level === WARNING).length,
      hints: out.filter((p) => p.level === HINT).length,
      thaiChars,
      aiScore: score,                                      // AI-style phrases per 1,000 Thai characters
      aiLevel: !thaiChars ? "-" : score < 3 ? "ต่ำ" : score < 8 ? "กลาง" : "สูง",
    },
  }
}

export const RULES = { SPELLING, ROYIN, STYLE }

async function main(argv) {
  const { readFileSync } = await import("node:fs")
  const flags = new Set(argv.filter((a) => a.startsWith("--")))
  const files = argv.filter((a) => !a.startsWith("--"))
  if (flags.has("--help")) {
    console.log("usage: node thaiproof.mjs [--json] [--no-royin] [--no-hints] [--strict] [file ...]   (no file: read stdin)")
    return 0
  }
  const opts = { royin: !flags.has("--no-royin"), hints: !flags.has("--no-hints") }
  const inputs = files.length ? files.map((f) => [f, readFileSync(f, "utf8")]) : [["stdin", readFileSync(0, "utf8")]]
  let errors = 0, warnings = 0
  const report = []
  for (const [name, text] of inputs) {
    const r = lint(text, opts)
    errors += r.stats.errors
    warnings += r.stats.warnings
    report.push({ file: name, ...r })
    if (flags.has("--json")) continue
    for (const p of r.problems) {
      const fix = p.suggestion && p.suggestion !== " " ? `${p.found} → ${p.suggestion}` : p.found.trim() || "␠"
      console.log(`${name}:${p.line}:${p.column}  ${p.level.padEnd(7)}  ${p.rule}  ${fix}  (${p.message})`)
    }
    const s = r.stats
    console.log(`${name}: ${s.errors} error, ${s.warnings} warning, ${s.hints} hint · กลิ่น AI: ${s.aiLevel} (${s.aiScore} ต่อ 1,000 ตัวอักษร)`)
  }
  if (flags.has("--json")) console.log(JSON.stringify(report, null, 2))
  return errors || (flags.has("--strict") && warnings) ? 1 : 0
}

if (typeof process !== "undefined" && process.argv?.[1]) {
  const { pathToFileURL } = await import("node:url")
  const { realpathSync } = await import("node:fs")
  let me = process.argv[1]
  try { me = realpathSync(me) } catch {}
  if (import.meta.url === pathToFileURL(me).href) process.exitCode = await main(process.argv.slice(2))
}
