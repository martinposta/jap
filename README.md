# 日本語 — Japanese From Zero! Digitální kurz

Kompletní webová aplikace pokrývající sérii **Japanese From Zero!** knih 1–5.
Aktuálně plně zpracována: **Book 1** (Pre-lekce A–D + Lekce 1–10).

**Žádný build krok, žádné závislosti, žádný server** — jen statické soubory pro GitHub Pages.

---

## Struktura souborů

```
index.html               — HTML kostra, načítá vše ostatní
css/
  style.css              — veškerý design a layout
js/
  data-helpers.js        — kana tabulky a sdílené funkce (NAČÍST JAKO PRVNÍ)
  data-book1.js          — obsah Book 1: pre-lekce A–D + lekce 1–10
  data.js                — COURSE export a metadata knih 2–5
  app.js                 — logika appky: rendering, quiz, kartičky, progress
```

### Jak přidat obsah Book 2 v budoucnu

1. Vytvoř soubor `js/data-book2.js` stejnou strukturou jako `data-book1.js`
2. Přidej `<script src="js/data-book2.js"></script>` do `index.html` (za data-book1.js)
3. V `data.js` nastav `locked: false` u Book 2 a přidej `pages: BOOK2_PAGES`
4. Hotovo — menu se automaticky odemkne

---

## Nasazení na GitHub Pages

### Varianta A — přes web (nejjednodušší)

1. Vytvoř nové GitHub repo (např. `japonsky-kurz`)
2. **Add file → Upload files** — přetáhni celý obsah této složky (ne složku samotnou, ale její obsah)
3. **Commit changes**
4. **Settings → Pages → Branch: main, / (root) → Save**
5. Za chvíli běží na `https://tvoje-jmeno.github.io/japonsky-kurz/`

### Varianta B — git

```bash
git init
git add .
git commit -m "JFZ digitalni kurz v2.0.0"
git branch -M main
git remote add origin https://github.com/JMENO/REPO.git
git push -u origin main
```

Pak totéž Pages nastavení jako výše.

### Aktualizace (přidání obsahu)

Uprav soubor(y) v `js/`, pak:
```bash
git add js/
git commit -m "Přidána Lekce X / Book 2"
git push
```
GitHub Pages se automaticky přenačte do ~60 sekund.

---

## Progress (postup učení)

Postup se ukládá v **localStorage** prohlížeče pod klíčem `jfz2:`. Data zůstanou i po zavření okna — ale zmizí při vymazání dat prohlížeče nebo v anonymním okně.

Každá lekce se označí jako hotová buď:
- ručně tlačítkem „Označit lekci jako hotovou"
- automaticky po zodpovězení všech quiz otázek správně

---

## Verze

| Verze | Datum | Co je nové |
|-------|-------|-----------|
| 2.0.0 | 2026-06-29 | Kompletní přepis: Book 1 z JFZ knih, menu pro B1–B5, nový design |
| 1.1.0 | 2026-06-25 | Opravy, tréninkové sekce, anime slovník |
| 1.0.0 | 2026-06-22 | První vydání |

---

## Plán do budoucna

- [ ] Book 2 — Katakana, slovesné skupiny, te-forma základy
- [ ] Book 3 — Te-forma kompletně, plain form, podmínky
- [ ] Book 4 — Kauzace, pasivum, potenciál
- [ ] Book 5 — Kanji systém, JLPT N4
- [ ] Google přihlášení + cloud sync (Firebase) — progress přenositelný mezi zařízeními

---

*Digitalizováno z: Japanese From Zero! Books 1–5, George Trombley & Yukari Takenaka*
