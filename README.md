# DermaLab — dermatoloģijas zināšanu trenažieris

Mobile-first React + TypeScript lietotne, ko var izvietot Vercel bez datubāzes, API vai maksas servisiem.

## Saturs

- **225 individuāli uzrakstīti jautājumi**, tieši 15 katrā no 15 tēmām.
- **15 jautājumi katrā testā**: viens nejauši izvēlēts no katras tēmas, nejaušā secībā.
- Visām četrām atbildēm pozīcijas tiek sajauktas katrā jaunajā testā.
- **Kļūdas gadījumā**: pareizā atbilde, 3 teikumu teorijas skaidrojums, galvenā atziņa un lekcijas avota norāde.
- Pareizas atbildes gadījumā skaidrojumu var atvērt pēc izvēles.
- Kļūdaino jautājumu atkārtošanas režīms, rezultātu vēsture un progress pārlūkā.
- Testa stāvoklis saglabājas arī pēc lapas pārlādēšanas.
- Bez servera un autentifikācijas; mācību dati glabājas `localStorage` konkrētajā pārlūkā.

## Palaist lokāli

Nepieciešams Node.js 20 vai jaunāks.

```bash
npm install
npm run dev
```

Atver `http://localhost:5173`.

Pārbaudīt produkcijas būvi:

```bash
npm run build
npm run preview
```

## Izvietot Vercel

**Variants A — GitHub:**

1. Izveido jaunu GitHub repozitoriju un ievieto tajā projekta failus.
2. Vercel → **Add New → Project** → importē repozitoriju.
3. Framework: **Vite** (Vercel to parasti atpazīst automātiski).
4. Build Command: `npm run build`; Output Directory: `dist`.
5. Klikšķini **Deploy**. Vides mainīgie nav nepieciešami.

**Variants B — Vercel CLI:**

```bash
npm install
npx vercel
# Produkcijā: npx vercel --prod
```

Pirms izvietošanas pārbaudi pareizo Vercel kontu un projektu.

## Pielāgot jautājumus

Jautājumi atrodas `src/data/questions.json`. Katram ir:

- `topicId` un `topic`;
- `question` un četri `options`;
- `correctIndex` — sākotnējās pareizās atbildes indekss;
- `theory` — skaidrojums pēc iesniegšanas;
- `takeaway` — viena atziņa iegaumēšanai;
- `source` — saistīto lekciju slaidu atsauce.

Lai mainītu jautājumu skaitu vienā testā, jāpielāgo arī algoritms `src/lib/quiz.ts` (pašlaik 15 tēmas × 1 jautājums).

## Avoti un atrunas

Pamats ir lietotāja piecas lekciju prezentācijas:

1. `2. nod_kosmetologi.pptx` — ādas morfoloģija.
2. `2.1 nod_kosmetologi.pptx` — labdabīgie un ļaundabīgie veidojumi.
3. `2.2_kosmetologi.pptx` — destrukcijas metodes.
4. `3_lupsk.pptx` — ādas pH un ķīmiskie pīlingi.
5. `LUPSK_4nod_kosm.pptx` — lāzeri, botulīntoksīns, PN/PDRN, eksosomas, HA.

Hialuronskābes fizioloģija, pildvielu komplikācijas un atsevišķi ādas barjeras mehānismi papildināti no vispārīgām medicīnas zināšanām, jo šajās prezentācijās tie aprakstīti īsi. Šis ir **mācību materiāls**, nevis diagnostikas vai ārstēšanas protokols. Reālu procedūru indikācijas un kontrindikācijas jāvērtē atbilstoši aktuālajām medicīniskajām vadlīnijām un konkrētu preparātu oficiālajiem aprakstiem.

## Tehnoloģijas

- React 19 + TypeScript
- Vite 6
- Lucide ikonas
- Pielāgots mobile-first CSS
- `localStorage` (bez datubāzes)
