# Barza Menu | قائمة برزة الرقمية

**قائمة طعام رقمية (QR) ثنائية اللغة مع سلة وطلب مباشر عبر واتساب — بدون خوادم ولا اشتراكات.**
**A bilingual (Arabic / English) QR menu with a cart and one-tap WhatsApp ordering — no server, no subscriptions.**

🔗 **Live demo:** https://muhanadsaadi.github.io/barza-menu/
📦 **Repo:** https://github.com/muhanadsaadi/barza-menu

> ⚠️ «مقهى نخلة الرمل | Sand Palm Café» مقهى **خيالي** لأغراض العرض فقط — ليس نشاطاً تجارياً حقيقياً.
> "Sand Palm Café" is a **fictional** café used for demo purposes only.

---

## العربية

### المميزات
- **ثنائي اللغة:** العربية (من اليمين لليسار) افتراضياً، وزر للتبديل إلى الإنجليزية. يُحفظ اختيار اللغة، ويمكن فتح الإنجليزية مباشرة بالرابط `?lang=en`.
- **أقسام وبحث:** تبويبات للأقسام وبحث فوري يفهم العربية حتى بدون همزات أو تشكيل (أ/ا، ة/ه).
- **بطاقات الأصناف:** اسم، وصف، سعر بالريال العُماني (٣ خانات عشرية)، صورة اختيارية، شارة «الأكثر طلباً»، وإظهار الأصناف غير المتوفرة بشكل باهت.
- **سلة كاملة:** إضافة/إزالة، تعديل الكمية، المجموع، وتبقى محفوظة عند تحديث الصفحة.
- **الطلب عبر واتساب:** يبني رسالة طلب ثنائية اللغة (الأصناف، الكميات، المجموع، الاسم، رقم الطاولة، الملاحظات) ويفتح واتساب على رقم المطعم.
- **حالة الدوام:** «مفتوح الآن / مغلق الآن» حسب ساعات العمل (يدعم الإغلاق بعد منتصف الليل).
- **سهل الوصول وسريع:** تصميم للجوال أولاً، أزرار كبيرة، دعم لوحة المفاتيح، نافذة سلة `<dialog>`، احترام إعداد «تقليل الحركة»، وبدون أي مكتبات خارجية.

### التخصيص
كل شيء يتم من ملفين فقط — لا تحتاج تعديل الكود:

**`config.json` — بيانات المطعم**

| الحقل | الوصف |
|---|---|
| `name_ar` / `name_en` | اسم المطعم |
| `tagline_ar` / `tagline_en` | سطر تعريفي قصير |
| `logo` | مسار الشعار (مثلاً `assets/logo.svg` أو `.png`) |
| `whatsapp` | رقم واتساب المطعم بالصيغة الدولية بدون + (مثال `9689XXXXXXX`) |
| `currency_ar` / `currency_en` | رمز العملة |
| `location_ar` / `location_en` | الموقع (يظهر في التذييل) |
| `hours.open` / `hours.close` | ساعات العمل بصيغة 24 ساعة `"07:00"` — `"00:00"` |
| `hours.label_ar` / `hours.label_en` | نص الساعات المعروض |
| `colors` | `primary`، `accent`، `background`، `surface`، `text` |
| `demo` | `true` لإظهار شريط «قائمة تجريبية» — اجعله `false` للمطعم الحقيقي |

> في النسخة التجريبية رقم واتساب هو رقم **برزة** (+968 7663 2622) حتى تصلنا طلبات التجربة. **غيّره لرقم المطعم.**

**`menu.json` — الأقسام والأصناف**

```json
{
  "categories": [
    { "id": "hot", "name_ar": "مشروبات ساخنة", "name_en": "Hot Drinks", "icon": "☕" }
  ],
  "items": [
    {
      "id": "karak", "category": "hot",
      "name_ar": "شاي كرك", "name_en": "Karak Tea",
      "desc_ar": "شاي بالحليب والهيل", "desc_en": "Milk tea with cardamom",
      "price": 0.300,
      "image": "assets/images/karak.svg",
      "available": true,
      "popular": true
    }
  ]
}
```
- `id` يجب أن يكون فريداً، و`category` يطابق `id` أحد الأقسام.
- `image` اختياري — اتركه `""` لتظهر أيقونة القسم بدلاً منه.
- `available: false` يُبقي الصنف ظاهراً لكن لا يمكن طلبه.
- ترتيب الأقسام والأصناف في الملف = ترتيبها في الصفحة.

### التشغيل محلياً
المتصفح يمنع قراءة ملفات JSON عند فتح `index.html` مباشرة، لذا شغّل خادماً بسيطاً:
```bash
python -m http.server 8000
# ثم افتح http://localhost:8000
```
أو استخدم إضافة **Live Server** في VS Code.

### النشر على GitHub Pages
1. ارفع الملفات إلى مستودع عام على GitHub.
2. **Settings → Pages → Deploy from a branch → `main` / `(root)` → Save**.
3. بعد دقيقة يصبح الرابط: `https://<اسم-المستخدم>.github.io/<اسم-المستودع>/`.
4. حوّل الرابط إلى رمز QR (من أي مولّد مجاني) واطبعه على الطاولات.

---

## English

### Features
- **Bilingual:** Arabic (RTL) by default with an English toggle; the choice is remembered, and `?lang=en` opens English directly.
- **Categories & search:** category tabs plus instant search that is forgiving with Arabic spelling (أ/ا, ة/ه, diacritics).
- **Item cards:** name, description, OMR price (3 decimals), optional image, "Popular" badge, greyed-out unavailable items.
- **Cart:** add/remove, quantity stepper, live total, persisted in `localStorage`.
- **Order on WhatsApp:** builds a bilingual order message (items, quantities, total, name, table, notes) and opens `wa.me/<number>`.
- **Open/closed status** from opening hours (handles closing after midnight).
- **Fast & accessible:** mobile-first, large tap targets, keyboard support, native `<dialog>`, `prefers-reduced-motion`, zero dependencies.

### Customise
Edit only two files — no code changes needed:
- **`config.json`** — restaurant name, tagline, logo, WhatsApp number (international format, digits only), currency, location, hours, brand colours, and `demo` flag (see the table above).
- **`menu.json`** — `categories` and `items` (see the example above). `image` is optional; `available: false` shows the item but disables ordering.

> The demo uses **Barza's** WhatsApp number (+968 7663 2622). **Replace it with the restaurant's number.**

### Run locally
Browsers block `fetch()` of JSON from `file://`, so serve the folder: `python -m http.server 8000` → open `http://localhost:8000` (or use VS Code Live Server).

### Deploy to GitHub Pages
Push to a public repo → **Settings → Pages → Deploy from a branch → `main` / `(root)`** → your site is at `https://<user>.github.io/<repo>/`. Turn that URL into a QR code and place it on tables.

### Project structure
```
barza-menu/
├── index.html        ← page skeleton (no content hard-coded)
├── config.json       ← restaurant settings
├── menu.json         ← categories + items
├── css/style.css     ← mobile-first styles, colours as CSS variables
├── js/app.js         ← all logic: load → render → cart → WhatsApp
└── assets/           ← logo + item images (SVG)
```

---

## How it was built | آلية التنفيذ

- **Tech:** plain HTML5, CSS3 (CSS variables, grid, logical properties for RTL/LTR) and vanilla JavaScript (ES2020). No frameworks, no build step, no backend — hosted free on GitHub Pages.
- **Architecture:** data-driven. `app.js` keeps one `state` object (language, category, search, cart) and re-renders from it. Content lives in JSON so non-developers can update the menu.
- **Safety:** all text is inserted with `textContent` (no `innerHTML` with data) to avoid HTML injection; `localStorage` access is wrapped in `try/catch`.
- **AI-assisted development:** the project was planned and built with the help of an AI coding assistant (Claude), then reviewed, tested on desktop and mobile widths, and customised by me. AI was used for scaffolding, code review and documentation; design decisions, testing and final edits are mine.

- **التقنيات:** HTML وCSS وJavaScript خالص بدون أطر عمل ولا خادم، واستضافة مجانية على GitHub Pages.
- **البنية:** التطبيق يعتمد على البيانات؛ كائن `state` واحد يحمل اللغة والقسم والبحث والسلة، وكل المحتوى في ملفات JSON.
- **تطوير بمساعدة الذكاء الاصطناعي:** تم التخطيط والبناء بمساعدة مساعد برمجة ذكي (Claude)، ثم راجعتُ الكود واختبرته على الحاسوب والجوال وخصّصته بنفسي.

---

## License
[MIT](LICENSE) © 2026 Muhanad — **برزة | Barza** · WhatsApp: [+968 7663 2622](https://wa.me/96876632622)
