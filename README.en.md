# thaiproof

[ภาษาไทย](README.md) · **[Try it in the browser](https://nuttakulsv.github.io/thaiproof/)**

Thai written by AI is easy to spot. It reads like a translation: "you" in every sentence (Thai drops pronouns), "ทำการ" ("perform the action of") in front of verbs, marketing words nobody actually says ("seamless", "powerful", "unlock"), emoji everywhere, and often the wrong polite particle (นะค่ะ instead of นะคะ).

thaiproof is two things:

1. **A Thai text checker** for the browser, the terminal and CI. It flags common misspellings, loanwords that don't follow the Royal Institute's spelling, คะ/ค่ะ mistakes, translationese and AI-style phrasing, and gives the text an "AI smell" score.
2. **A skill for coding agents** (Claude Code, Codex, Cursor, anything that reads SKILL.md) that teaches the agent to write Thai the way Thai people write, and to check its own work before sending it.

## What it checks

| Level | Category | Examples |
|---|---|---|
| error | **Misspellings** | อนุญาติ → อนุญาต, สังเกตุ → สังเกต, ปรากฎ → ปรากฏ, กระทันหัน → กะทันหัน, ปฎิบัติ → ปฏิบัติ, about 50 more |
| error | **คะ/ค่ะ** | question with ค่ะ, นะค่ะ, statements with คะ |
| warning | **Loanwords** (Royal Institute spelling) | แอพพลิเคชั่น → แอปพลิเคชัน, อัพเดท → อัปเดต, ลิงค์ → ลิงก์, about 45 more |
| hint | **Translationese** | ทำการ..., คุณสามารถ..., passive ถูก for neutral things, "to ensure", "in terms of", too many "คุณ" |
| hint | **AI-style words** | "in the digital age", "elevate", "unlock", "powerful", "seamless", "efficiently", lots of emoji or ! |
| hint | **Other** | double spaces, mixing ครับ and ค่ะ, Buddhist and Gregorian years without saying which |

Markdown code (fenced and inline), URLs and HTML comments are skipped, so it works on READMEs as they are.

The **AI smell** score is the number of translationese and AI-style hits per 1,000 Thai characters: under 3 is low, 8 or more is high. It's a nudge to reread, not an AI detector.

## Use it

**Browser:** [nuttakulsv.github.io/thaiproof](https://nuttakulsv.github.io/thaiproof/). Everything runs locally in the page.

**Terminal** (Node.js 18+, no install):

```
curl -O https://raw.githubusercontent.com/nuttakulsv/thaiproof/main/skills/thaiproof/thaiproof.mjs
node thaiproof.mjs README.md docs/*.md
node thaiproof.mjs --no-royin --no-hints --json --strict draft.md
```

Exits 1 on errors (and on warnings with `--strict`), so it drops into CI.

**Code:** one file, no dependencies, Node or browser:

```js
import { lint } from "./thaiproof.mjs"
const { problems, stats } = lint("ขออนุญาติแชร์ลิ้งค์นะค่ะ")
```

**Agents:**

```
/plugin marketplace add nuttakulsv/thaiproof      # Claude Code
/plugin install thaiproof@thaiproof

npx skills add nuttakulsv/thaiproof               # Codex, Cursor and others
```

## Limits

- Pattern-based: no word segmentation, no understanding of meaning. Misspellings not on the list get through.
- The misspelling list only includes wrong forms that aren't valid words with another meaning.
- Loanword spellings are warnings, since everyday usage often differs from the Royal Institute's.
- Hints are suggestions. Read and decide.

## Sources

The Royal Institute's [online dictionary](https://dictionary.orst.go.th/) and [transliteration database](https://transliteration.orst.go.th/search), NECTEC SchoolNet's [common misspellings](https://www.nectec.or.th/schoolnet/library/create-web/10000/language/10000-4136.html), and [a summary of IT loanword spellings](https://ditc.co.th/knowledge/it-vocabulary/). Where this list disagrees with the Royal Institute, the Royal Institute wins. Please open an issue.

## Tests

```
node --test skills/thaiproof/thaiproof.test.mjs
```

## License

MIT
