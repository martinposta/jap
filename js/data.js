/* ================================================================
   data.js — hlavní export COURSE objektu
   Závisí na: data-helpers.js → data-book1.js (v tomto pořadí!)
   ================================================================ */

const COURSE = {
  version:     "2.0.0",
  versionDate: "2026-06-29",
  books: [
    {
      id: "b1",
      num: "Book 1",
      title: "Japanese From Zero! 1",
      sub: "Hiragana · základní věty · slovesa",
      locked: false,
      pages: BOOK1_PAGES,
    },
    {
      id: "b2",
      num: "Book 2",
      title: "Japanese From Zero! 2",
      sub: "Katakana · časy sloves · rozšířená gramatika",
      locked: true,
      pages: [],
    },
    {
      id: "b3",
      num: "Book 3",
      title: "Japanese From Zero! 3",
      sub: "Te-forma · podmínky · plain form",
      locked: true,
      pages: [],
    },
    {
      id: "b4",
      num: "Book 4",
      title: "Japanese From Zero! 4",
      sub: "Kauzace · pasivum · potenciál",
      locked: true,
      pages: [],
    },
    {
      id: "b5",
      num: "Book 5",
      title: "Japanese From Zero! 5",
      sub: "Kanji · pokročilé vzory · JLPT N4",
      locked: true,
      pages: [],
    },
  ],
};
