import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { lint, RULES } from "./thaiproof.mjs"

const found = (text, opts) => lint(text, opts).problems.map((p) => `${p.rule}:${p.found}->${p.suggestion ?? ""}`)

test("common misspellings are caught with the right fix", () => {
  for (const [wrong, right] of [["อนุญาติ", "อนุญาต"], ["สังเกตุ", "สังเกต"], ["ปรากฎ", "ปรากฏ"], ["กระทันหัน", "กะทันหัน"],
    ["กระเพรา", "กะเพรา"], ["กฏหมาย", "กฎ"], ["ปฎิบัติ", "ปฏิ"], ["คำนวน", "คำนวณ"], ["สังสรร", "สังสรรค์"], ["ลายเซ็นต์", "ลายเซ็น"]]) {
    const p = lint(`เรื่อง${wrong}นี้`).problems.find((x) => x.level === "error")
    assert.ok(p, wrong)
    assert.equal(p.suggestion, right, wrong)
  }
})

test("every correct form, and words that contain a wrong form, stay clean", () => {
  const rights = [...RULES.SPELLING, ...RULES.ROYIN].map(([, r]) => r)
  const tricky = ["ปรากฏการณ์", "กบฏ", "กฎหมาย", "เปอร์เซ็นต์", "สังสรรค์", "ภาพยนตร์", "การจราจร", "ได้คะแนนดี", "คุณภาพ",
    "ไม่มีอะไรค่ะ", "ไม่ไปที่ไหนค่ะ", "ซีเกมส์", "เอเชียนเกมส์", "โอลิมปิกเกมส์", "ดุลยภาพ", "บรรเทา", "ผลลัพธ์", "เกล็ดปลา",
    "กระเพาะอาหาร", "ล็อกอิน", "โปรเจกเตอร์", "เว็บไซต์", "คอมเมนต์", "อุโบสถ", "สวัสดีค่ะ", "ขอบคุณค่ะ", "ใช่ไหมคะ"]
  for (const word of [...rights, ...tricky]) {
    const bad = lint(`คำว่า ${word} ในประโยค`).problems.filter((p) => p.level !== "hint")
    assert.deepEqual(bad, [], word)
  }
})

test("loanwords follow the Royal Institute, and can be switched off", () => {
  assert.deepEqual(found("ดาวน์โหลดแอพพลิเคชั่นแล้วคลิ๊กลิ้งค์", { hints: false }),
    ["ทับศัพท์:แอพพลิเคชั่น->แอปพลิเคชัน", "ทับศัพท์:คลิ๊ก->คลิก", "ทับศัพท์:ลิ้งค์->ลิงก์"])
  assert.deepEqual(found("แอพพลิเคชั่น", { royin: false, hints: false }), [])
})

test("คะ and ค่ะ", () => {
  assert.deepEqual(found("ใช่ไหมค่ะ", { hints: false }), ["คะ/ค่ะ:ไหมค่ะ->ไหมคะ"])
  assert.deepEqual(found("ขอบคุณคะ", { hints: false }), ["คะ/ค่ะ:ขอบคุณคะ->ขอบคุณค่ะ"])
  assert.deepEqual(found("ไว้คุยกันนะค่ะ", { hints: false }), ["คะ/ค่ะ:นะค่ะ->นะคะ"])
})

test("code, URLs and HTML comments are skipped, positions are kept", () => {
  const md = "ข้อความ `อนุญาติ` ปกติ\n\n```\nสังเกตุ\n```\n\nดู https://example.com/อนุญาติ <!-- ปรากฎ -->\nแล้วก็อนุญาติ\n"
  const r = lint(md, { hints: false })
  assert.equal(r.problems.length, 1)
  assert.equal(r.problems[0].line, 8)
  assert.equal(r.problems[0].column, 7)
  assert.equal(lint("ใช้ `a` `b` ได้").problems.length, 0, "masked code mustn't look like a double space")
})

test("style hints and the AI score", () => {
  const ai = "🚀 ในยุคดิจิทัลปัจจุบัน แอปของเราถูกออกแบบมาเพื่อช่วยให้คุณสามารถทำการจัดการงานได้อย่างมีประสิทธิภาพและไร้รอยต่อ ✨ " +
    "นอกจากนี้ยังมีฟีเจอร์ที่ทรงพลังที่จะยกระดับการทำงานของคุณ 🔥 เพื่อให้มั่นใจว่าข้อมูลของคุณปลอดภัย 🔒"
  const human = "แอปนี้ไว้จัดการงานของทีม อัปเดตสถานะงาน แชร์ไฟล์ และดูว่าใครทำอะไรอยู่ได้ในที่เดียว ข้อมูลเข้ารหัสทั้งตอนส่งและตอนเก็บ"
  const a = lint(ai).stats, h = lint(human).stats
  assert.equal(a.aiLevel, "สูง", JSON.stringify(a))
  assert.equal(h.aiLevel, "ต่ำ", JSON.stringify(h))
  assert.equal(h.hints, 0)
  for (const rule of ["ทำการ", "คุณสามารถ", "ถูกออกแบบ", "อย่างมีประสิทธิภาพ", "ไร้รอยต่อ", "ในยุคดิจิทัล", "🚀"])
    assert.ok(lint(ai).problems.some((p) => p.found.startsWith(rule)), rule)
  assert.ok(found("ใช้ได้เลย  ไม่ต้องตั้งค่า").includes("เว้นวรรค:  -> "))
  assert.ok(found("ทักครับ ส่วนเราตอบค่ะ").some((x) => x.startsWith("ระดับภาษา")))
})

test("command line: reads stdin, exits 1 on errors", () => {
  const cli = fileURLToPath(new URL("./thaiproof.mjs", import.meta.url))
  const bad = spawnSync(process.execPath, [cli], { input: "ขออนุญาติครับ\n", encoding: "utf8" })
  assert.equal(bad.status, 1)
  assert.match(bad.stdout, /stdin:1:3 +error +สะกดผิด +อนุญาติ → อนุญาต/)
  assert.match(bad.stdout, /1 error/)
  const ok = execFileSync(process.execPath, [cli, "--json"], { input: "สวัสดีครับ\n", encoding: "utf8" })
  assert.equal(JSON.parse(ok)[0].stats.errors, 0)
})
