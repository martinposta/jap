# 日本語 — Japonština pro fanoušky anime

Webová aplikace s kurzem základů japonštiny: 13 lekcí, 4 přílohy, kartičky na
opakování, kvízy a hanko razítka za dokončené lekce (postup se ukládá v
prohlížeči, vydrží i po zavření okna).

Žádný build krok, žádné závislosti — jen statické soubory. Přesně pro GitHub
Pages.

## Soubory

```
index.html       — kostra stránky
css/style.css     — veškerý vzhled
js/data.js        — VEŠKERÝ OBSAH KURZU (lekce, slovíčka, kvízy, kartičky)
js/app.js         — vykreslování, navigace, kvízy, kartičky, ukládání postupu
```

## Nasazení na GitHub Pages

### Varianta A — bez gitu, přes web (nejjednodušší)

1. Na GitHub.com si vytvoř nový repozitář (např. `japonsky-kurz`).
2. V repozitáři klikni na **Add file → Upload files**.
3. Přetáhni do něj **celý obsah téhle složky** (soubor `index.html` a složky
   `css` a `js` — ne samotnou složku `japanese-course`, ale to, co je v ní).
4. Commitni (tlačítko **Commit changes**).
5. Jdi do **Settings → Pages**.
6. U "Branch" vyber `main` a složku `/ (root)`, ulož.
7. Za pár desítek vteřin bude appka na `https://tvoje-jméno.github.io/japonsky-kurz/`.

### Varianta B — přes git

```bash
cd japanese-course
git init
git add .
git commit -m "Japonský kurz pro anime fans"
git branch -M main
git remote add origin https://github.com/TVOJE-JMENO/NAZEV-REPA.git
git push -u origin main
```

Pak stejně jako výše: **Settings → Pages → Branch: main, / (root)**.

## Jak přidat novou lekci / cvičení / kartičku

Veškerý obsah je v `js/data.js`. Stránka samotná (`index.html`) ani logika
(`js/app.js`) se při běžném přidávání obsahu nemění.

Nová lekce je objekt v poli `LESSONS`:

```js
{
  id: "l13",                              // musí být unikátní
  number: 13,
  eyebrow: "Lekce 13",
  title: "Název lekce",
  blocks: [
    { type: "p", text: "Vysvětlující text." },
    { type: "vocab", items: [
      { jp: "言葉", romaji: "kotoba", cz: "slovo" },
    ]},
  ],
  flashcardGroups: [
    { name: "Slovíčka", cards: [
      { jp: "言葉", romaji: "kotoba", cz: "slovo" },
    ]},
  ],
  quiz: [
    { q: "Co znamená 言葉?", options: ["slovo","kniha","ruka","oko"], correct: 0 },
  ],
},
```

Přehled všech typů bloků je v komentáři na začátku `data.js`. Appendix (Příloha)
má úplně stejný tvar, jen patří do pole `APPENDICES` místo `LESSONS`.

Postup uživatele (hotové lekce, kvízy, kartičky) se ukládá pod klíčem
`id` lekce — pokud `id` později změníš, uživatelům se postup pro tu lekci
"resetuje" (budou ji muset proklikat znovu), takže `id` po vydání měň jen
když musíš.

## Pokud budeš chtít pokračovat s Claude Code

Pro tenhle typ projektu (běžící repozitář, opakované úpravy, nasazování) je
Claude Code obvykle pohodlnější než chat — má přímý přístup k repu na disku a
nemusí se nic kopírovat sem a tam.
