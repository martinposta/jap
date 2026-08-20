/* =========================================================
   日本語 KURZ — OBSAH KURZU
   ---------------------------------------------------------
   Tady je VEŠKERÝ text a obsah kurzu. Žádný jiný soubor
   obsah nemá — pokud chceš přidat lekci, slovíčko, kvíz nebo
   kartičku, uprav jen tento soubor. Layout a logika (app.js)
   se přizpůsobí automaticky.

   STRUKTURA JEDNÉ LEKCE / PŘÍLOHY:
   {
     id: "l1",                 // jedinečné, používá se i pro ukládání postupu
     number: 1,                // zobrazené číslo (nebo null)
     eyebrow: "Lekce 1",       // malý popisek nad titulkem
     title: "...",
     blocks: [ ... ],          // viz typy bloků níže
     flashcardGroups: [ { name: "...", cards: [{jp, romaji, cz}] } ],
     quiz: [ { q, jp, options: [...], correct: index, explain } ]
   }

   TYPY BLOKŮ (blocks):
   { type: "p", text }
   { type: "h3", text }
   { type: "tip", text, icon }                         // rámeček s tipem
   { type: "table", headers: [...], kinds: [...], rows: [[...]] }
                                                        // kinds: "jp" | "romaji" | "text" pro každý sloupec
   { type: "kana", rows: [{label, cells:[{char,romaji}|null, ...]}] }
   { type: "vocab", items: [{jp, romaji, cz, note}] }
   { type: "examples", items: [{jp, romaji, cz}] }
   { type: "list", ordered: true|false, items: ["...", ...] }
   ========================================================= */

/* ---------- pomocné tabulky kany (jedna pravda, použitá na více místech) ---------- */

const HIRAGANA_ROWS = [
  { label: "–", cells: [["あ","a"],["い","i"],["う","u"],["え","e"],["お","o"]] },
  { label: "k", cells: [["か","ka"],["き","ki"],["く","ku"],["け","ke"],["こ","ko"]] },
  { label: "s", cells: [["さ","sa"],["し","shi"],["す","su"],["せ","se"],["そ","so"]] },
  { label: "t", cells: [["た","ta"],["ち","chi"],["つ","tsu"],["て","te"],["と","to"]] },
  { label: "n", cells: [["な","na"],["に","ni"],["ぬ","nu"],["ね","ne"],["の","no"]] },
  { label: "h", cells: [["は","ha"],["ひ","hi"],["ふ","fu"],["へ","he"],["ほ","ho"]] },
  { label: "m", cells: [["ま","ma"],["み","mi"],["む","mu"],["め","me"],["も","mo"]] },
  { label: "y", cells: [["や","ya"], null, ["ゆ","yu"], null, ["よ","yo"]] },
  { label: "r", cells: [["ら","ra"],["り","ri"],["る","ru"],["れ","re"],["ろ","ro"]] },
  { label: "w", cells: [["わ","wa"], null, null, null, ["を","o"]] },
  { label: "n", cells: [["ん","n"], null, null, null, null] },
];

const HIRAGANA_DAKUTEN_ROWS = [
  { label: "g", cells: [["が","ga"],["ぎ","gi"],["ぐ","gu"],["げ","ge"],["ご","go"]] },
  { label: "z", cells: [["ざ","za"],["じ","ji"],["ず","zu"],["ぜ","ze"],["ぞ","zo"]] },
  { label: "d", cells: [["だ","da"],["ぢ","ji"],["づ","zu"],["で","de"],["ど","do"]] },
  { label: "b", cells: [["ば","ba"],["び","bi"],["ぶ","bu"],["べ","be"],["ぼ","bo"]] },
  { label: "p", cells: [["ぱ","pa"],["ぴ","pi"],["ぷ","pu"],["ぺ","pe"],["ぽ","po"]] },
];

const KATAKANA_ROWS = [
  { label: "–", cells: [["ア","a"],["イ","i"],["ウ","u"],["エ","e"],["オ","o"]] },
  { label: "k", cells: [["カ","ka"],["キ","ki"],["ク","ku"],["ケ","ke"],["コ","ko"]] },
  { label: "s", cells: [["サ","sa"],["シ","shi"],["ス","su"],["セ","se"],["ソ","so"]] },
  { label: "t", cells: [["タ","ta"],["チ","chi"],["ツ","tsu"],["テ","te"],["ト","to"]] },
  { label: "n", cells: [["ナ","na"],["ニ","ni"],["ヌ","nu"],["ネ","ne"],["ノ","no"]] },
  { label: "h", cells: [["ハ","ha"],["ヒ","hi"],["フ","fu"],["ヘ","he"],["ホ","ho"]] },
  { label: "m", cells: [["マ","ma"],["ミ","mi"],["ム","mu"],["メ","me"],["モ","mo"]] },
  { label: "y", cells: [["ヤ","ya"], null, ["ユ","yu"], null, ["ヨ","yo"]] },
  { label: "r", cells: [["ラ","ra"],["リ","ri"],["ル","ru"],["レ","re"],["ロ","ro"]] },
  { label: "w", cells: [["ワ","wa"], null, null, null, ["ヲ","o"]] },
  { label: "n", cells: [["ン","n"], null, null, null, null] },
];

const KATAKANA_DAKUTEN_ROWS = [
  { label: "g", cells: [["ガ","ga"],["ギ","gi"],["グ","gu"],["ゲ","ge"],["ゴ","go"]] },
  { label: "z", cells: [["ザ","za"],["ジ","ji"],["ズ","zu"],["ゼ","ze"],["ゾ","zo"]] },
  { label: "d", cells: [["ダ","da"],["ヂ","ji"],["ヅ","zu"],["デ","de"],["ド","do"]] },
  { label: "b", cells: [["バ","ba"],["ビ","bi"],["ブ","bu"],["ベ","be"],["ボ","bo"]] },
  { label: "p", cells: [["パ","pa"],["ピ","pi"],["プ","pu"],["ペ","pe"],["ポ","po"]] },
];

function kanaRowsToBlock(rows) {
  return { type: "kana", rows: rows.map(r => ({ label: r.label, cells: r.cells.map(c => c ? { char: c[0], romaji: c[1] } : null) })) };
}
function kanaRowsToCards(rows) {
  return rows.flatMap(r => r.cells.filter(Boolean).map(c => ({ jp: c[0], romaji: "", cz: c[1] })));
}

/* =========================================================
   LEKCE
   ========================================================= */

const LESSONS = [

/* ---------------- LEKCE 0 ---------------- */
{
  id: "l0", number: 0, eyebrow: "Lekce 0 · Úvod",
  title: `Jak japonština „tiká“`,
  blocks: [
    { type: "p", text: `Než začneme se slovíčky, je dobré vědět, jak je japonština jinak poskládaná než čeština nebo angličtina. Tahle lekce nemá slovíčka na biflování — je to mapa, podle které se budeš orientovat ve všech dalších lekcích.` },

    { type: "h3", text: "1. Slovosled: podmět – předmět – sloveso (SOV)" },
    { type: "p", text: `Česky: „Já jím sushi.“ Japonsky doslova: „Já sushi jím.“` },
    { type: "examples", items: [
      { jp: "私は寿司を食べます。", romaji: "Watashi wa sushi o tabemasu.", cz: "(Já) (sushi) (jím)." },
      { jp: "虎杖は呪いを祓う。", romaji: "Itadori wa noroi o harau.", cz: "(Itadori) (kletbu) (zaříkává/zahání)." },
      { jp: "炭治郎は鬼と戦う。", romaji: "Tanjirou wa oni to tatakau.", cz: "(Tanjirou) (s démonem) (bojuje)." },
    ]},
    { type: "p", text: `Všimni si, že podmět (kdo), předmět (co/s čím) a sloveso (co dělá) jsou pokaždé ve stejném pořadí: kdo → co → dělá. Sloveso je vždy úplně na konci věty. To je nejdůležitější věc v celé japonské gramatice — v anime si všimneš, že postavy často nechají sloveso „viset“ až úplně na konec, a právě to drama vytváří: nevíš, jestli řekne „udělám to“ nebo „neudělám to“, dokud nedoříká celou větu.` },

    { type: "h3", text: `2. Částice — japonská „lepicí páska“` },
    { type: "p", text: `Japonština nemá pády jako čeština. Místo toho se za slovo přilepí malá částice, která řekne, jakou roli slovo ve větě hraje. を je předmět, は je téma věty, が je podmět atd. Naučíme se je postupně — jsou naprostý základ a jakmile je pochopíš, gramatika se „rozsvítí“.` },

    { type: "h3", text: "3. Žádné rody, žádná čísla, žádné členy" },
    { type: "p", text: `Slovo 猫 (neko, kočka) je úplně stejné, ať mluvíš o jedné kočce nebo deseti, samci nebo samici. Žádné „a/an/the“, žádné skloňování podstatných jmen.` },

    { type: "h3", text: "4. Tři úrovně zdvořilosti" },
    { type: "p", text: `Tohle je pro pochopení anime klíčové. Zkus si jednu jedinou myšlenku — „díky“ — na všech třech úrovních:` },
    { type: "table",
      headers: ["Úroveň", "Kdy se používá", "Příklad: „děkuji“"],
      kinds: ["text","text","text"],
      rows: [
        ["敬語 (keigo)", "velmi formální/zdvořilá řeč — k šéfovi, cizím lidem, klientům", "感謝いたします (kansha itashimasu)"],
        ["丁寧語 (teineigo)", "standardní zdvořilá řeč ze školních učebnic (slovesa na -masu, -desu)", "ありがとうございます (arigatou gozaimasu)"],
        ["砕けた言葉 (kudaketa kotoba)", "neformální (plain) řeč mezi kamarády a v rodině — tohle mluví naprostá většina postav v anime", "ありがとう (arigatou), nebo jen サンキュー (sankyuu)"],
      ]
    },
    { type: "tip", text: `Učebnice tě obvykle učí jen tu prostřední, zdvořilou úroveň. My se naučíme obě — zdvořilou i neformální — protože v anime uslyšíš především tu neformální. Stejná myšlenka, tři úplně jiná slova — to je normální, ne výjimka.` },

    { type: "h3", text: "5. Tři písma najednou" },
    { type: "table",
      headers: ["Písmo", "Použití"],
      kinds: ["text","text"],
      rows: [
        ["平仮名 hiragana", "japonská slova a gramatika"],
        ["片仮名 katakana", "cizí slova a jména (Spike Spiegel se píše スパイク・スピーゲル)"],
        ["漢字 kanji", "znaky převzaté z čínštiny, nesou význam — v tomto kurzu jen málo"],
      ]
    },
    { type: "p", text: `Slabika v japonštině se nazývá „mora“ a skoro každá odpovídá jedné hlásce v hiraganě/katakaně. Proto se japonské písmo dá naučit mnohem rychleji než třeba čínské znaky.` },
    { type: "tip", text: `Proč rovnou tři písma? Hiragana a katakana jsou ve skutečnosti zjednodušené verze starých kanji (vznikly přibližně před 1200 lety) — hiragana z kurzivního zápisu, katakana z jednotlivých kousků znaků. Kanji se z Číny do Japonska dostalo dřív, ale na zápis čistě japonské gramatiky (koncovky, částice) se nehodilo, proto si Japonci „vyrobili“ vlastní fonetické písmo navíc. Katakana se postupem času specializovala na cizí slova a zvukomalebné výrazy, hiragana na gramatiku a rodná slova.` },
  ],
  flashcardGroups: [
    { name: "Pojmy z Lekce 0", cards: [
      { jp: "敬語", romaji: "keigo", cz: "velmi formální/zdvořilá řeč" },
      { jp: "丁寧語", romaji: "teineigo", cz: "standardní zdvořilá řeč (-masu/-desu)" },
      { jp: "砕けた言葉", romaji: "kudaketa kotoba", cz: "neformální řeč mezi kamarády" },
      { jp: "平仮名", romaji: "hiragana", cz: "slabičné písmo pro japonská slova a gramatiku" },
      { jp: "片仮名", romaji: "katakana", cz: "slabičné písmo pro cizí slova a jména" },
      { jp: "漢字", romaji: "kanji", cz: "znaky převzaté z čínštiny, nesou význam" },
    ]},
  ],
  quiz: [
    { q: "Kam patří sloveso v japonské větě?", options: ["Na začátek","Doprostřed","Na konec","Japonština slovesa nepotřebuje"], correct: 2, explain: "Japonština je SOV — sloveso je vždy na konci." },
    { q: "Co dělá částice v japonské větě?", options: ["Mění barvu slova","Ukazuje roli slova ve větě (kdo/co/kde…)","Nahrazuje sloveso","Je to jen výplň beze smyslu"], correct: 1, explain: "Částice nahrazují to, co v češtině dělají pádové koncovky." },
    { q: "Kterou úroveň zdvořilosti uslyšíš v anime nejčastěji mezi kamarády?", options: ["敬語 keigo","丁寧語 teineigo","砕けた言葉 (neformální)"], correct: 2, explain: "Mezi kamarády a v rodině se mluví neformálně." },
  ],
},

/* ---------------- LEKCE 1 ---------------- */
{
  id: "l1", number: 1, eyebrow: "Lekce 1",
  title: "Hiragana č. 1 (a/k/s-řada) + pozdravy",
  blocks: [
    { type: "h3", text: "Hiragana — první 3 řady" },
    kanaRowsToBlock(HIRAGANA_ROWS.slice(0,3)),
    { type: "tip", text: `Pozor na し = shi (ne „si“). Tohle není výjimka k naučení napaměť, ale pravidlo: v moderní japonštině se „s“ před „i“ vždy automaticky změní na hlásku „š“ (shi). Stejné pravidlo platí i jinde v jazyce — proto ho uvidíš znovu a znovu, ne jen u téhle jedné kany.` },

    { type: "h3", text: "Pozdravy a základní fráze" },
    { type: "vocab", items: [
      { jp: "おはよう（ございます）", romaji: "ohayou (gozaimasu)", cz: "dobré ráno" },
      { jp: "こんにちは", romaji: "konnichiwa", cz: "dobrý den" },
      { jp: "こんばんは", romaji: "konbanwa", cz: "dobrý večer" },
      { jp: "おやすみ（なさい）", romaji: "oyasumi (nasai)", cz: "dobrou noc" },
      { jp: "さようなら", romaji: "sayounara", cz: "sbohem (formální, na dlouho)" },
      { jp: "じゃあね", romaji: "jaa ne", cz: "tak zatím (neformální)" },
      { jp: "ありがとう（ございます）", romaji: "arigatou (gozaimasu)", cz: "děkuji" },
      { jp: "すみません", romaji: "sumimasen", cz: "promiňte / pardon" },
      { jp: "ごめん（なさい）", romaji: "gomen (nasai)", cz: "omlouvám se" },
      { jp: "はい / うん", romaji: "hai / un", cz: "ano (formální / neformální)" },
      { jp: "いいえ / ううん", romaji: "iie / uun", cz: "ne (formální / neformální)" },
    ]},
    { type: "p", text: `Slovo bez závorky je kratší, neformální verze pro kamarády. S tím, co je v závorce, je to zdvořilejší — řekneš to cizímu člověku nebo učiteli.` },
    { type: "h3", text: "Krátký rozhovor" },
    { type: "p", text: `Takhle by mohla vypadat úplně první výměna mezi dvěma postavami, co se potkají ráno:` },
    { type: "examples", items: [
      { jp: "A: おはよう！", romaji: "A: Ohayou!", cz: "A: Dobré ráno!" },
      { jp: "B: おはよう。元気？", romaji: "B: Ohayou. Genki?", cz: "B: Dobré ráno. Jak se vede?" },
      { jp: "A: うん、元気！じゃあね！", romaji: "A: Un, genki! Jaa ne!", cz: "A: Jo, mám se dobře! Tak zatím!" },
    ]},
    { type: "tip", text: `Anime poznámka: postavy v anime skoro nikdy neříkají celé „arigatou gozaimasu“, ale jen „arigatou“, nebo dokonce „サンキュー“ (sankyuu, z angličtiny). To je přesně ta neformální úroveň řeči.` },
  ],
  flashcardGroups: [
    { name: "Hiragana: a / k / s", cards: kanaRowsToCards(HIRAGANA_ROWS.slice(0,3)) },
    { name: "Pozdravy", cards: [
      { jp: "おはよう", romaji: "ohayou", cz: "dobré ráno" },
      { jp: "こんにちは", romaji: "konnichiwa", cz: "dobrý den" },
      { jp: "こんばんは", romaji: "konbanwa", cz: "dobrý večer" },
      { jp: "おやすみ", romaji: "oyasumi", cz: "dobrou noc" },
      { jp: "ありがとう", romaji: "arigatou", cz: "děkuji" },
      { jp: "すみません", romaji: "sumimasen", cz: "promiňte / pardon" },
      { jp: "ごめん", romaji: "gomen", cz: "omlouvám se" },
    ]},
  ],
  quiz: [
    { q: `Která hiragana odpovídá slabice „ka“?`, options: ["か","さ","た","な"], correct: 0 },
    { q: `Která hiragana odpovídá slabice „su“?`, options: ["す","ぬ","つ","く"], correct: 0 },
    { q: `Která hiragana odpovídá slabice „o“?`, options: ["お","あ","ろ","こ"], correct: 0 },
    { q: `Která hiragana se čte „shi“ (ne „si“)?`, options: ["し","す","ち","き"], correct: 0 },
    { q: "Co znamená おやすみ (oyasumi)?", options: ["Dobrou noc","Dobré ráno","Děkuji","Promiňte"], correct: 0 },
    { q: "Která fráze je formálnější / zdvořilejší?", options: ["ありがとう (arigatou)","ありがとうございます (arigatou gozaimasu)"], correct: 1, explain: "Delší forma s „gozaimasu“ je zdvořilejší — pro cizí lidi a nadřízené." },
    { q: "Kterou frázi řekneš kamarádovi, když odcházíš jen na chvíli?", options: ["じゃあね (jaa ne)","さようなら (sayounara)","おやすみ (oyasumi)","すみません (sumimasen)"], correct: 0, explain: "じゃあね je lehké, neformální „tak zatím“. さようなら zní spíš jako rozloučení na dlouho/navždy." },
  ],
},

/* ---------------- LEKCE 2 ---------------- */
{
  id: "l2", number: 2, eyebrow: "Lekce 2",
  title: `Hiragana č. 2 (t/n/h/m-řada) + zájmena a věta „X je Y“`,
  blocks: [
    { type: "h3", text: "Hiragana — další 4 řady" },
    kanaRowsToBlock(HIRAGANA_ROWS.slice(3,7)),
    { type: "tip", text: `Tři výjimky ve výslovnosti: ち = chi, つ = tsu, ふ = fu (ne „ti“, „tu“, „hu“).` },

    { type: "h3", text: "Osobní zájmena" },
    { type: "table",
      headers: ["Japonsky","Romaji","Česky","Poznámka"],
      kinds: ["jp","romaji","text","text"],
      rows: [
        ["私（わたし）","watashi","já","neutrální, zdvořilé"],
        ["私（あたし）","atashi","já","neformální, ženské, měkčí varianta výslovnosti watashi"],
        ["俺（おれ）","ore","já","neformální, hlavně muži — typické pro „drsné“ postavy v anime"],
        ["僕（ぼく）","boku","já","neformální, mírnější, často u chlapců/mladších mužů"],
        ["あなた","anata","ty","mezi kamarády se spíš použije jméno/přezdívka — přímé „ty“ zní často divně"],
        ["君（きみ）","kimi","ty","neformální, mezi vrstevníky"],
        ["お前（おまえ）","omae","ty","hrubé/familiární — typické pro drsné hlášky v anime"],
        ["彼（かれ）","kare","on",""],
        ["彼女（かのじょ）","kanojo","ona / přítelkyně","záleží na kontextu"],
      ]
    },
    { type: "tip", text: `To, jaké zájmeno „já“/„ty“ postava použije, v anime hodně napovídá o její osobnosti — „ore“ a „omae“ slyšíš u drsných/sebevědomých postav, „boku“ u skromnějších, „watashi“ je univerzální a zdvořilé, „atashi“ typicky u dívek/žen v neformální řeči.` },

    { type: "h3", text: `Základní věta: X は Y です (X wa Y desu) — „X je Y“` },
    { type: "p", text: `は se v této roli (částice tématu) čte wa, ne „ha“! です (desu) je spojka podobná českému „je / jsem / jsi“.` },
    { type: "examples", items: [
      { jp: "私は学生です。", romaji: "Watashi wa gakusei desu.", cz: "Já jsem student." },
      { jp: "彼はナルトです。", romaji: "Kare wa Naruto desu.", cz: "On je Naruto." },
      { jp: "虎杖は呪術師です。", romaji: "Itadori wa jujutsushi desu.", cz: "Itadori je zaklínač/exorcista (呪術師, jujutsushi)." },
      { jp: "坂本は元殺し屋です。", romaji: "Sakamoto wa moto-koroshiya desu.", cz: "Sakamoto je bývalý zabiják. (元 moto- = „bývalý/dřívější“)" },
    ]},
    { type: "tip", text: `Proč se は čte „wa“, a ne „ha“? Je to historická zkamenělina. V dávné japonštině se を vyslovovalo „wo“ a は se v některých pozicích vyslovovalo blíž k „wa“ — výslovnost se postupem staletí zjednodušila, ale pravopis zůstal při starém. Dnes platí: は je „ha“ ve většině slov, ale „wa“ konkrétně jako částice tématu. Podobně を je dnes vždy „o“, i když znak historicky patřil k „wa-řadě“.` },
    { type: "p", text: `Zápor: です → ではありません / では(じゃ)ない` },
    { type: "examples", items: [
      { jp: "私は先生ではありません。", romaji: "Watashi wa sensei de wa arimasen.", cz: "Já nejsem učitel." },
      { jp: "ソン・ジヌは弱くない。", romaji: "Son Jinu wa yowakunai.", cz: "Son Jinu není slabý. (yowakunai — záporný tvar i-adjektiva, viz lekce 6)" },
    ]},
    { type: "p", text: `Neformálně se „de wa“ často zkracuje na じゃ (ja):` },
    { type: "examples", items: [
      { jp: "学生じゃない。", romaji: "Gakusei ja nai.", cz: "Nejsem student. (neformálně)" },
    ]},
  ],
  flashcardGroups: [
    { name: "Hiragana: t / n / h / m", cards: kanaRowsToCards(HIRAGANA_ROWS.slice(3,7)) },
    { name: "Zájmena", cards: [
      { jp: "私", romaji: "watashi", cz: "já (neutrální)" },
      { jp: "俺", romaji: "ore", cz: "já (neformální, drsné, muži)" },
      { jp: "僕", romaji: "boku", cz: "já (neformální, skromnější)" },
      { jp: "君", romaji: "kimi", cz: "ty (neformální)" },
      { jp: "お前", romaji: "omae", cz: "ty (hrubé/familiární)" },
      { jp: "彼", romaji: "kare", cz: "on" },
      { jp: "彼女", romaji: "kanojo", cz: "ona / přítelkyně" },
    ]},
  ],
  quiz: [
    { q: `Která hiragana odpovídá „chi“ (ne „ti“)?`, options: ["ち","つ","し","き"], correct: 0 },
    { q: `Která hiragana odpovídá „fu“ (ne „hu“)?`, options: ["ふ","ほ","む","ぬ"], correct: 0 },
    { q: "Jak se přečte částice は ve větě „watashi WA gakusei desu“?", options: ["ha","wa","ba","da"], correct: 1 },
    { q: "Co znamená 「俺」 (ore)?", options: ["já (drsně/neformálně, hlavně muži)","ty","on","ona"], correct: 0 },
    { q: "Jak negujeme です neformálně (zkráceně)?", options: ["じゃない (ja nai)","ません (masen)","でした (deshita)","ですよ (desu yo)"], correct: 0 },
    { q: `Přelož neformálně: „Nejsem kočka.“ (猫 neko = kočka)`, options: ["猫じゃない (neko ja nai)","猫です (neko desu)","猫がいる (neko ga iru)","猫ですか (neko desu ka)"], correct: 0 },
  ],
},

/* ---------------- LEKCE 3 ---------------- */
{
  id: "l3", number: 3, eyebrow: "Lekce 3",
  title: "Hiragana dokončení + částice は・が・を",
  blocks: [
    { type: "h3", text: "Hiragana — zbylé řady" },
    kanaRowsToBlock(HIRAGANA_ROWS.slice(7,11)),
    { type: "tip", text: `ん (n) je jediná hiragana, která je samostatná souhláska bez samohlásky — vždy je na konci slabiky/slova (např. 元気 げんき genki, nebo にほん nihon = Japonsko).` },

    { type: "h3", text: "Znělé varianty (dakuten) — ukázka" },
    { type: "p", text: `Když ke kaně přidáš dvě čárky (゛), změní se výslovnost. Tady je ukázka dvou řad — celý přehled najdeš v Příloze A.` },
    kanaRowsToBlock(HIRAGANA_DAKUTEN_ROWS.slice(0,2)),

    { type: "h3", text: "Tři klíčové částice" },
    { type: "p", text: `は (wa) — označuje téma věty („co se týče X…“). Funguje jako spojovník pozornosti.` },
    { type: "p", text: `が (ga) — označuje podmět, často když uvádíš novou informaci nebo zdůrazňuješ, kdo/co něco dělá.` },
    { type: "examples", items: [
      { jp: "猫が好きです。", romaji: "Neko ga suki desu.", cz: "Mám rád/a kočky. (doslova: Kočky jsou líbivé.)" },
    ]},
    { type: "p", text: `を (o) — označuje přímý předmět. Píše se znakem を, ale dnes se vždy vyslovuje jen „o“.` },
    { type: "examples", items: [
      { jp: "寿司を食べます。", romaji: "Sushi o tabemasu.", cz: "Jím sushi." },
      { jp: "虎杖は呪いを祓う。", romaji: "Itadori wa noroi o harau.", cz: "Itadori zahání kletbu." },
    ]},
    { type: "tip", text: `を se historicky vyslovovalo „wo“ (stejně jako は bývalo blíž „wa“ — viz lekce 2). I to je „pravopisná zkamenělina“: znak zůstal, výslovnost se časem zjednodušila na prosté „o“. Proto v moderní japonštině uvidíš を jen na jednom místě — přesně jako tuhle částici.` },
    { type: "tip", text: `Rozdíl は vs が je oblíbená záludnost japonštiny, ale na začátek stačí tohle: は uvádí téma/o čem mluvíš obecně, が zdůrazňuje konkrétní podmět. Časem to „ucítíš“ z poslechu — v anime to uslyšíš stokrát denně.` },
  ],
  flashcardGroups: [
    { name: "Hiragana: y / r / w / n", cards: kanaRowsToCards(HIRAGANA_ROWS.slice(7,11)) },
    { name: "Částice wa/ga/o", cards: [
      { jp: "は", romaji: "wa", cz: "označuje téma věty" },
      { jp: "が", romaji: "ga", cz: "označuje podmět / novou informaci" },
      { jp: "を", romaji: "o", cz: "označuje přímý předmět" },
    ]},
  ],
  quiz: [
    { q: `Která hiragana je „n“ (samostatná souhláska)?`, options: ["ん","の","な","に"], correct: 0 },
    { q: "Jak se čte を jako částice?", options: ["wo","o","ko","do"], correct: 1 },
    { q: "Doplň částici: 私＿学生です。(Já jsem student.)", options: ["は (wa)","を (o)","が (ga)","に (ni)"], correct: 0 },
    { q: "Doplň částici: りんご＿食べます。(Jím jablko.)", options: ["を (o)","は (wa)","が (ga)","と (to)"], correct: 0 },
    { q: "Která částice zdůrazňuje podmět/novou informaci, např. v „猫が好きです“?", options: ["が (ga)","は (wa)","を (o)","に (ni)"], correct: 0 },
  ],
},

/* ---------------- LEKCE 4 ---------------- */
{
  id: "l4", number: 4, eyebrow: "Lekce 4",
  title: "Slovesa: přítomný/budoucí čas, zdvořilá vs. neformální řeč",
  blocks: [
    { type: "p", text: `Japonské sloveso se na rozdíl od češtiny nemění podle osoby — „já jdu / ty jdeš / on jde“ je sloveso ve všech případech stejné. Mění se jen podle času a úrovně zdvořilosti.` },
    { type: "h3", text: "Slovník (dictionary) tvar = neformální přítomný/budoucí čas" },
    { type: "table",
      headers: ["Japonsky","Romaji","Česky"],
      kinds: ["jp","romaji","text"],
      rows: [
        ["行く","iku","jít / jet"],
        ["来る","kuru","přijít"],
        ["食べる","taberu","jíst"],
        ["飲む","nomu","pít"],
        ["見る","miru","dívat se / vidět"],
        ["言う","iu","říct"],
        ["する","suru","dělat"],
        ["分かる","wakaru","rozumět / chápat"],
        ["戦う","tatakau","bojovat"],
        ["祓う","harau","zaříkávat / zahánět (kletbu, démona)"],
        ["好き（だ）","suki (da)","mít rád / líbit se"],
      ]
    },
    { type: "examples", items: [
      { jp: "行く。", romaji: "Iku.", cz: "Jdu / Půjdu. (neformálně)" },
      { jp: "炭治郎は戦う。", romaji: "Tanjirou wa tatakau.", cz: "Tanjirou bojuje." },
    ]},

    { type: "h3", text: "Zdvořilý tvar -masu" },
    { type: "table",
      headers: ["Neformální","Zdvořilé","Česky"],
      kinds: ["jp","jp","text"],
      rows: [
        ["行く iku","行きます ikimasu","jít / jet"],
        ["来る kuru","来ます kimasu","přijít"],
        ["食べる taberu","食べます tabemasu","jíst"],
        ["飲む nomu","飲みます nomimasu","pít"],
        ["見る miru","見ます mimasu","dívat se"],
        ["する suru","します shimasu","dělat"],
      ]
    },

    { type: "h3", text: "Zápor — neformální vs. zdvořilý" },
    { type: "table",
      headers: ["Sloveso","Neformální zápor","Zdvořilý zápor"],
      kinds: ["text","jp","jp"],
      rows: [
        ["iku (jít)","行かない ikanai","行きません ikimasen"],
        ["taberu (jíst)","食べない tabenai","食べません tabemasen"],
        ["suru (dělat)","しない shinai","しません shimasen"],
      ]
    },
    { type: "examples", items: [
      { jp: "食べない。", romaji: "Tabenai.", cz: "Nejím to. / Nebudu to jíst. (neformálně, často odmítavě)" },
      { jp: "俺は戦わない。", romaji: "Ore wa tatakawanai.", cz: "Já nebudu bojovat. (neformálně, drsně)" },
    ]},
    { type: "tip", text: `Skoro každá běžná konverzace mezi přáteli v anime používá neformální tvary (iku, taberu, shinai…). Tvary na -masu uslyšíš, když postava mluví se starším/nadřízeným, nebo je obecně velmi zdvořilá.` },
  ],
  flashcardGroups: [
    { name: "Slovesa (slovník tvar)", cards: [
      { jp: "行く", romaji: "iku", cz: "jít / jet" },
      { jp: "来る", romaji: "kuru", cz: "přijít" },
      { jp: "食べる", romaji: "taberu", cz: "jíst" },
      { jp: "飲む", romaji: "nomu", cz: "pít" },
      { jp: "見る", romaji: "miru", cz: "dívat se / vidět" },
      { jp: "言う", romaji: "iu", cz: "říct" },
      { jp: "する", romaji: "suru", cz: "dělat" },
      { jp: "分かる", romaji: "wakaru", cz: "rozumět / chápat" },
      { jp: "戦う", romaji: "tatakau", cz: "bojovat" },
      { jp: "祓う", romaji: "harau", cz: "zaříkávat / zahánět kletbu" },
    ]},
  ],
  quiz: [
    { q: `Jak je zdvořile „Piji“ (飲む nomu)?`, options: ["飲みます (nomimasu)","飲む (nomu)","飲んだ (nonda)","飲んでいる (nondeiru)"], correct: 0 },
    { q: `Jak je neformálně „Nepřijdu“ (来る kuru)?`, options: ["来ない (konai)","来ます (kimasu)","来ません (kimasen)","来た (kita)"], correct: 0 },
    { q: `Přelož neformálně: „Nerozumím.“ (分かる wakaru)`, options: ["分からない (wakaranai)","分かります (wakarimasu)","分かりません (wakarimasen)","分かった (wakatta)"], correct: 0 },
    { q: "Jaký je zdvořilý tvar slovesa する (suru, dělat)?", options: ["します (shimasu)","する (suru)","しない (shinai)","した (shita)"], correct: 0 },
    { q: "Co znamená「食べない」(tabenai)?", options: ["Nejím to / Nebudu to jíst","Jím to","Jedl jsem to","Snězme to"], correct: 0 },
    { q: "Jak je neformálně „Nebudu bojovat“ (戦う tatakau)?", options: ["戦わない (tatakawanai)","戦う (tatakau)","戦った (tatakatta)","戦います (tatakaimasu)"], correct: 0 },
  ],
},

/* ---------------- LEKCE 5 ---------------- */
{
  id: "l5", number: 5, eyebrow: "Lekce 5",
  title: "Otázky, tázací slova a další částice",
  blocks: [
    { type: "h3", text: "Tázací slova" },
    { type: "vocab", items: [
      { jp: "何（なに／なん）", romaji: "nani / nan", cz: "co" },
      { jp: "誰（だれ）", romaji: "dare", cz: "kdo" },
      { jp: "どこ", romaji: "doko", cz: "kde" },
      { jp: "いつ", romaji: "itsu", cz: "kdy" },
      { jp: "どう", romaji: "dou", cz: "jak" },
      { jp: "なぜ／どうして", romaji: "naze / doushite", cz: "proč" },
      { jp: "いくつ", romaji: "ikutsu", cz: "kolik (kusů)" },
      { jp: "いくら", romaji: "ikura", cz: "kolik (cena)" },
      { jp: "どれ／どの", romaji: "dore / dono", cz: "který / jaký" },
    ]},

    { type: "h3", text: "Otázková částice か (ka)" },
    { type: "p", text: `Na konec věty přidáš か a je z ní zdvořilá otázka:` },
    { type: "examples", items: [{ jp: "これは何ですか？", romaji: "Kore wa nan desu ka?", cz: "Co to je?" }] },
    { type: "p", text: `V neformální mluvě se か často vynechává úplně a otázka se pozná jen ze stoupavé intonace:` },
    { type: "examples", items: [{ jp: "これ何？", romaji: "Kore nani?", cz: "Co to je? (neformálně)" }] },

    { type: "h3", text: "Další užitečné částice" },
    { type: "table",
      headers: ["Částice","Význam","Příklad"],
      kinds: ["jp","text","text"],
      rows: [
        ["に (ni)","čas / místo / směr","7時に (shichi-ji ni) — v 7 hodin"],
        ["で (de)","místo děje / prostředek","学校で (gakkou de) — ve škole"],
        ["と (to)","„a“ (mezi jmény), „s“","私と彼 (watashi to kare) — já a on"],
        ["も (mo)","„také / i“","私も！(Watashi mo!) — Já také!"],
        ["から (kara)","„z/od“, „protože“","日本から (Nihon kara) — z Japonska"],
        ["まで (made)","„až do“","駅まで (eki made) — až na nádraží"],
      ]
    },
    { type: "examples", items: [
      { jp: "地球から火星まで行く。", romaji: "Chikyuu kara Kasei made iku.", cz: "Jedu ze Země až na Mars. (jako ve vesmírných westernech typu Cowboy Bebop)" },
    ]},
    { type: "tip", text: `„Watashi mo!“ (私も！) — „Já taky!“ je jedna z nejčastějších kratičkých hlášek v anime, často ji vykřikne postava, co chce být zahrnuta do plánu/výletu/jídla.` },
  ],
  flashcardGroups: [
    { name: "Tázací slova", cards: [
      { jp: "何", romaji: "nani / nan", cz: "co" },
      { jp: "誰", romaji: "dare", cz: "kdo" },
      { jp: "どこ", romaji: "doko", cz: "kde" },
      { jp: "いつ", romaji: "itsu", cz: "kdy" },
      { jp: "どう", romaji: "dou", cz: "jak" },
      { jp: "なぜ", romaji: "naze", cz: "proč" },
      { jp: "いくつ", romaji: "ikutsu", cz: "kolik (kusů)" },
      { jp: "いくら", romaji: "ikura", cz: "kolik (cena)" },
    ]},
    { name: "Částice 2", cards: [
      { jp: "に", romaji: "ni", cz: "čas / místo / směr" },
      { jp: "で", romaji: "de", cz: "místo děje / prostředek" },
      { jp: "と", romaji: "to", cz: "„a“, „s“" },
      { jp: "も", romaji: "mo", cz: "také / i" },
      { jp: "から", romaji: "kara", cz: "z/od, protože" },
      { jp: "まで", romaji: "made", cz: "až do" },
    ]},
  ],
  quiz: [
    { q: `Přelož: „Kdo je to?“ (zdvořile)`, options: ["これは誰ですか？ (Kore wa dare desu ka?)","これは何ですか？ (Kore wa nan desu ka?)","これはどこですか？ (Kore wa doko desu ka?)","これはいつですか？ (Kore wa itsu desu ka?)"], correct: 0 },
    { q: "Doplň částici: 図書館＿勉強します。(Studuju v knihovně.)", options: ["で (de)","に (ni)","を (o)","と (to)"], correct: 0 },
    { q: "Co znamená どうして？", options: ["proč","jak","kdy","kde"], correct: 0 },
    { q: `Která částice znamená „také / i“?`, options: ["も (mo)","と (to)","から (kara)","まで (made)"], correct: 0 },
    { q: `Která částice znamená „až do“ (čas/místo)?`, options: ["まで (made)","から (kara)","に (ni)","で (de)"], correct: 0 },
  ],
},

/* ---------------- LEKCE 6 ---------------- */
{
  id: "l6", number: 6, eyebrow: "Lekce 6",
  title: "Přídavná jména a popis",
  blocks: [
    { type: "h3", text: "I-adjektiva (konec na -i)" },
    { type: "vocab", items: [
      { jp: "大きい", romaji: "ookii", cz: "velký" },
      { jp: "小さい", romaji: "chiisai", cz: "malý" },
      { jp: "かわいい", romaji: "kawaii", cz: "roztomilý" },
      { jp: "すごい", romaji: "sugoi", cz: "super / skvělý / úžasný" },
      { jp: "かっこいい", romaji: "kakkoii", cz: "cool / skvělý (o vzhledu)" },
      { jp: "やばい", romaji: "yabai", cz: `„šílený“ — kladně i záporně, podle tónu!` },
      { jp: "強い", romaji: "tsuyoi", cz: "silný" },
      { jp: "弱い", romaji: "yowai", cz: "slabý" },
      { jp: "うるさい", romaji: "urusai", cz: `hlučný / „Sklapni!“` },
    ]},
    { type: "examples", items: [
      { jp: "かわいい猫。", romaji: "Kawaii neko.", cz: "Roztomilá kočka." },
      { jp: "この猫はかわいい！", romaji: "Kono neko wa kawaii!", cz: "Tahle kočka je roztomilá!" },
      { jp: "ソン・ジヌはどんどん強くなる。", romaji: "Son Jinu wa dondon tsuyokunaru.", cz: "Son Jinu je čím dál silnější. (přesně ten power-fantasy pocit ze Solo Leveling)" },
    ]},
    { type: "p", text: "Zápor i-adjektiva: -i → -kunai" },
    { type: "examples", items: [{ jp: "かわいくない。", romaji: "Kawaikunai.", cz: "Není roztomilá." }] },
    { type: "tip", text: `Proč mají i-adjektiva a na-adjektiva jiná pravidla? I-adjektiva jsou „rodná“ japonská slovní třída — chovají se trochu jako slovesa (mají svůj vlastní zápor, minulý čas atd., uvidíš v lekci 7). Na-adjektiva jsou ve skutečnosti podstatná jména (často převzatá z čínštiny, jako 元気 nebo 有名), která se k dalšímu podstatnému jménu „přilepí“ pomocí な. Proto na-adjektiva gramaticky nečekaně připomínají spíš dvě podstatná jména za sebou než klasické přídavné jméno.` },

    { type: "h3", text: "Na-adjektiva (potřebují な před podstatným jménem)" },
    { type: "vocab", items: [
      { jp: "元気（な）", romaji: "genki (na)", cz: "zdravý / energický" },
      { jp: "好き（な）", romaji: "suki (na)", cz: "oblíbený / milovaný" },
      { jp: "大丈夫（な）", romaji: "daijoubu (na)", cz: "v pořádku" },
      { jp: "静か（な）", romaji: "shizuka (na)", cz: "tichý" },
      { jp: "有名（な）", romaji: "yuumei (na)", cz: "slavný" },
    ]},
    { type: "examples", items: [{ jp: "元気な人。", romaji: "Genki na hito.", cz: "Energický člověk." }] },
    { type: "p", text: "Na konci věty な mizí, přidá se です/だ:" },
    { type: "examples", items: [{ jp: "元気です！", romaji: "Genki desu!", cz: "Jsem v pořádku / Mám se dobře!" }] },
    { type: "tip", text: `「元気？」(Genki?) je jeden z nejběžnějších neformálních pozdravů typu „Jak se vede?“ v anime, a odpověď「元気だよ」(Genki da yo) = „Mám se dobře.“` },
  ],
  flashcardGroups: [
    { name: "I-adjektiva", cards: [
      { jp: "大きい", romaji: "ookii", cz: "velký" },
      { jp: "小さい", romaji: "chiisai", cz: "malý" },
      { jp: "かわいい", romaji: "kawaii", cz: "roztomilý" },
      { jp: "すごい", romaji: "sugoi", cz: "super / skvělý" },
      { jp: "かっこいい", romaji: "kakkoii", cz: "cool / skvělý" },
      { jp: "やばい", romaji: "yabai", cz: "šílený (+/-)" },
      { jp: "強い", romaji: "tsuyoi", cz: "silný" },
      { jp: "弱い", romaji: "yowai", cz: "slabý" },
      { jp: "うるさい", romaji: "urusai", cz: "hlučný / sklapni" },
    ]},
    { name: "Na-adjektiva", cards: [
      { jp: "元気", romaji: "genki", cz: "zdravý / energický" },
      { jp: "好き", romaji: "suki", cz: "oblíbený / milovaný" },
      { jp: "大丈夫", romaji: "daijoubu", cz: "v pořádku" },
      { jp: "静か", romaji: "shizuka", cz: "tichý" },
      { jp: "有名", romaji: "yuumei", cz: "slavný" },
    ]},
  ],
  quiz: [
    { q: `Přelož: „Silný muž“ (男 otoko = muž)`, options: ["強い男 (tsuyoi otoko)","弱い男 (yowai otoko)","大きい男 (ookii otoko)","かわいい男 (kawaii otoko)"], correct: 0 },
    { q: "Jaký je zápor すごい (sugoi)?", options: ["すごくない (sugokunai)","すごいじゃない (sugoi ja nai)","すごいません (sugoimasen)","すごいなかった (sugoinakatta)"], correct: 0 },
    { q: "Co znamená 大丈夫です？", options: ["Je to v pořádku / Jsem v pořádku","Je mi to líto","Nerozumím","Jsem unavený"], correct: 0 },
    { q: "Která koncovka se používá u na-adjektiva před podstatným jménem (元気＿人)?", options: ["な (na)","い (i)","だ (da)","の (no)"], correct: 0 },
  ],
},

/* ---------------- LEKCE 7 ---------------- */
{
  id: "l7", number: 7, eyebrow: "Lekce 7",
  title: "Minulý čas a zápor v minulosti",
  blocks: [
    { type: "h3", text: "Zdvořilý minulý čas: -masu → -mashita" },
    { type: "table",
      headers: ["Přítomný","Minulý","Česky"],
      kinds: ["jp","jp","text"],
      rows: [
        ["食べます tabemasu","食べました tabemashita","jedl/a jsem"],
        ["行きます ikimasu","行きました ikimashita","šel/šla jsem"],
        ["しません shimasen","しませんでした shimasen deshita","nedělal/a jsem"],
      ]
    },

    { type: "h3", text: "Neformální minulý čas: ta-forma" },
    { type: "table",
      headers: ["Slovník","Minulý (neformální)","Česky"],
      kinds: ["jp","jp","text"],
      rows: [
        ["食べる taberu","食べた tabeta","jedl/a jsem"],
        ["行く iku","行った itta","šel/šla jsem"],
        ["見る miru","見た mita","viděl/a jsem"],
        ["する suru","した shita","udělal/a jsem"],
        ["来る kuru","来た kita","přišel/přišla jsem"],
        ["言う iu","言った itta","řekl/a jsem"],
      ]
    },
    { type: "examples", items: [
      { jp: "食べた！", romaji: "Tabeta!", cz: "Sním! / Sjedl jsem to! (neformálně)" },
      { jp: "炭治郎は鬼と戦った。", romaji: "Tanjirou wa oni to tatakatta.", cz: "Tanjirou bojoval s démonem." },
    ]},
    { type: "tip", text: `Proč je 行った (itta) nepravidelné? Většina sloves na -ku v minulém čase dělá -ita (書く kaku → 書いた kaita, „psát“ → „psal“). Sloveso 行く (iku, „jít“) je jedna z mála výjimek a místo toho dělá 行った (itta) se zdvojenou souhláskou. Je to tak staré a běžné slovo, že si „vyjednalo“ vlastní zkratku — podobně jako v češtině máme nepravidelné „šel“ vedle pravidelného „chodil“.` },
    { type: "p", text: "Minulý zápor (neformálně): -nai → -nakatta" },
    { type: "examples", items: [{ jp: "食べなかった。", romaji: "Tabenakatta.", cz: "Nejedl/a jsem." }] },
    { type: "p", text: "です v minulosti: でした (deshita)" },
    { type: "examples", items: [{ jp: "学生でした。", romaji: "Gakusei deshita.", cz: "Byl/a jsem student." }] },
    { type: "tip", text: `「やった！」(Yatta!) — minulý tvar slovesa suru, zvolání radosti „Udělal/a jsem to! / Jeej!“ — jedna z nejtypičtějších radostných hlášek v anime.` },
  ],
  flashcardGroups: [
    { name: "Minulý čas (neformální)", cards: [
      { jp: "食べた", romaji: "tabeta", cz: "jedl/a jsem (taberu)" },
      { jp: "行った", romaji: "itta", cz: "šel/šla jsem (iku)" },
      { jp: "見た", romaji: "mita", cz: "viděl/a jsem (miru)" },
      { jp: "した", romaji: "shita", cz: "udělal/a jsem (suru)" },
      { jp: "来た", romaji: "kita", cz: "přišel/přišla jsem (kuru)" },
      { jp: "言った", romaji: "itta", cz: "řekl/a jsem (iu)" },
    ]},
  ],
  quiz: [
    { q: `Přelož neformálně: „Šel jsem do školy.“ (学校 gakkou = škola)`, options: ["学校に行った (gakkou ni itta)","学校に行きます (gakkou ni ikimasu)","学校に行く (gakkou ni iku)","学校に行っている (gakkou ni itte iru)"], correct: 0 },
    { q: `Jak je zdvořile „Nedělal jsem (to)“ v minulosti?`, options: ["しませんでした (shimasen deshita)","しなかった (shinakatta)","しません (shimasen)","しました (shimashita)"], correct: 0 },
    { q: "Co znamená やった？", options: [`„Udělal/a jsem to!“ (radostné zvolání)`,"„Udělám to.“","„Nedělám to.“","„Děláš to?“"], correct: 0 },
    { q: "Jaký je neformální minulý tvar slovesa 見る (miru)?", options: ["見た (mita)","見ます (mimasu)","見ない (minai)","見て (mite)"], correct: 0 },
  ],
},

/* ---------------- LEKCE 8 ---------------- */
{
  id: "l8", number: 8, eyebrow: "Lekce 8",
  title: "Te-forma: žádosti, probíhající děj a spojování vět",
  blocks: [
    { type: "p", text: `Te-forma je jedna z nejdůležitějších a nejvíc univerzálních forem v japonštině — uslyšíš ji v anime neustále.` },
    { type: "h3", text: "Tvorba te-formy" },
    { type: "table",
      headers: ["Slovník","Te-forma"],
      kinds: ["jp","jp"],
      rows: [
        ["食べる taberu","食べて tabete"],
        ["行く iku","行って itte"],
        ["見る miru","見て mite"],
        ["する suru","して shite"],
        ["来る kuru","来て kite"],
        ["待つ matsu","待って matte"],
        ["言う iu","言って itte"],
      ]
    },
    { type: "tip", text: `Proč 待つ→待って, ale 食べる→食べて? Te-forma se neřídí náhodou, ale podle toho, na co sloveso v slovníkovém tvaru končí. Slovesa na -ru (食べる, 見る) jen vymění -ru za -te. Slovesa na -u/-tsu/-ru (待つ, 言う, 行く* — *行く je výjimka, viz lekce 7) změní koncovku na zdvojenou souhlásku + te (って). Slovesa na -mu/-bu/-nu udělají んで (ne v naší tabulce, ale uvidíš je dál v kurzu). Jde o stejný mechanismus jako u minulého času v lekci 7 — te-forma a minulý čas se tvoří téměř identickým způsobem, jen s -te místo -ta na konci.` },

    { type: "h3", text: "Použití 1: Žádost — te + ください, nebo jen te (neformálně)" },
    { type: "examples", items: [
      { jp: "待ってください。", romaji: "Matte kudasai.", cz: "Prosím, počkejte." },
      { jp: "待って！", romaji: "Matte!", cz: "Počkej! (neformálně/naléhavě)" },
      { jp: "やめて！", romaji: "Yamete!", cz: "Přestaň! / Stop!" },
    ]},

    { type: "h3", text: "Použití 2: Probíhající děj — te + いる = „právě dělám“" },
    { type: "examples", items: [{ jp: "食べている。", romaji: "Tabete iru.", cz: "Právě jím. / Jím (teď)." }] },
    { type: "p", text: `V mluvené řeči se „iru“ často zkracuje na jen „-teru“:` },
    { type: "examples", items: [{ jp: "何してる？", romaji: "Nani shiteru?", cz: "Co to děláš? (velmi běžná otázka)" }] },

    { type: "h3", text: "Použití 3: Spojování více činností v jedné větě" },
    { type: "examples", items: [
      { jp: "家に帰って、ご飯を食べて、寝ます。", romaji: "Ie ni kaette, gohan o tabete, nemasu.", cz: "Vrátím se domů, sním jídlo a půjdu spát." },
      { jp: "集中して、剣を抜いて、戦う。", romaji: "Shuuchuu shite, ken o nuite, tatakau.", cz: "Soustředím se, vytáhnu meč a bojuju. (přesně postup před souboji v Demon Slayer)" },
    ]},
  ],
  flashcardGroups: [
    { name: "Te-forma", cards: [
      { jp: "食べて", romaji: "tabete", cz: "te-forma od taberu (jíst)" },
      { jp: "行って", romaji: "itte", cz: "te-forma od iku (jít)" },
      { jp: "見て", romaji: "mite", cz: "te-forma od miru (dívat se)" },
      { jp: "して", romaji: "shite", cz: "te-forma od suru (dělat)" },
      { jp: "来て", romaji: "kite", cz: "te-forma od kuru (přijít)" },
      { jp: "待って", romaji: "matte", cz: "te-forma od matsu (čekat)" },
    ]},
  ],
  quiz: [
    { q: `Jak řekneš neformálně „Pojď!“ (žádost, sloveso 来る kuru)?`, options: ["来て！ (kite!)","来る！ (kuru!)","来た！ (kita!)","来ます！ (kimasu!)"], correct: 0 },
    { q: "Co znamená „何してるの？“?", options: ["Co to děláš?","Kam jdeš?","Kdo jsi?","Co je to?"], correct: 0 },
    { q: `Přelož: „Právě se dívám (na to).“ (見る miru)`, options: ["見ている / 見てる (mite iru / miteru)","見た (mita)","見る (miru)","見ない (minai)"], correct: 0 },
    { q: "Jaká je te-forma slovesa 待つ (matsu, čekat)?", options: ["待って (matte)","待た (mata)","待ち (machi)","待つて (matsute)"], correct: 0 },
  ],
},

/* ---------------- LEKCE 9 ---------------- */
{
  id: "l9", number: 9, eyebrow: "Lekce 9",
  title: "Rozkazovací a volní tvary (drsná anime řeč)",
  blocks: [
    { type: "p", text: `Tady se dostáváme k tvarům, které jsou v anime extrémně časté — bojové výkřiky, rozkazy a sebevědomá prohlášení.` },
    { type: "h3", text: "Rozkazovací tvar (drsný, hlavně mužský/neformální)" },
    { type: "table",
      headers: ["Slovník","Rozkaz","Česky"],
      kinds: ["jp","jp","text"],
      rows: [
        ["行く iku","行け ike","Jdi!"],
        ["待つ matsu","待て mate","Čekej!"],
        ["見る miru","見ろ miro","Dívej se!"],
        ["する suru","しろ shiro","Udělej (to)!"],
        ["来る kuru","来い koi","Pojď! / Přijď!"],
        ["死ぬ shinu (zemřít)","死ね shine","Zemři!"],
        ["戦う tatakau","戦え tatakae","Bojuj!"],
        ["祓う harau","祓え harae","Zažehnej to! / Exorcizuj to!"],
      ]
    },
    { type: "examples", items: [
      { jp: "やめろ！", romaji: "Yamero!", cz: "Přestaň (s tím)! (drsnější verze než „yamete“)" },
      { jp: "戦え！諦めるな！", romaji: "Tatakae! Akirameruna!", cz: "Bojuj! Nevzdávej se! (typický bojový povzbuzovací pokřik)" },
    ]},

    { type: "h3", text: "Zákazový tvar: slovník + な (na)" },
    { type: "examples", items: [
      { jp: "行くな！", romaji: "Ikuna!", cz: "Nechoď!" },
      { jp: "死ぬな！", romaji: "Shinuna!", cz: "Neumírej! (typická dramatická hláška)" },
    ]},

    { type: "h3", text: `Volní tvar (-ou/-you) — „udělejme / pojďme“` },
    { type: "table",
      headers: ["Slovník","Volní","Česky"],
      kinds: ["jp","jp","text"],
      rows: [
        ["行く iku","行こう ikou","Pojďme! / Půjdu! (rozhodnutí)"],
        ["食べる taberu","食べよう tabeyou","Sněme to!"],
        ["する suru","しよう shiyou","Udělejme to!"],
      ]
    },
    { type: "examples", items: [{ jp: "行こう！", romaji: "Ikou!", cz: "Pojďme! / Jde se!" }] },
    { type: "tip", text: `Rozkazovací tvary (ike, kite, yamero, shine) jsou drsné a hlavně mužské/agresivní — ve zdvořilé řeči bys je nikdy nepoužil/a. V anime je slyšíš hlavně v bojových scénách, rozkazech a hádkách.` },
  ],
  flashcardGroups: [
    { name: "Rozkazovací tvary", cards: [
      { jp: "行け", romaji: "ike", cz: "Jdi!" },
      { jp: "待て", romaji: "mate", cz: "Čekej!" },
      { jp: "見ろ", romaji: "miro", cz: "Dívej se!" },
      { jp: "しろ", romaji: "shiro", cz: "Udělej (to)!" },
      { jp: "来い", romaji: "koi", cz: "Pojď! / Přijď!" },
    ]},
    { name: "Volní tvary", cards: [
      { jp: "行こう", romaji: "ikou", cz: "Pojďme! / Půjdu!" },
      { jp: "食べよう", romaji: "tabeyou", cz: "Sněme to!" },
      { jp: "しよう", romaji: "shiyou", cz: "Udělejme to!" },
    ]},
  ],
  quiz: [
    { q: "Jaký je rozdíl mezi 待って (matte) a 待て (mate)?", options: ["matte = žádost/prosba, mate = drsný rozkaz","jsou to synonyma beze rozdílu","matte je minulý čas, mate přítomný","mate je zdvořilejší než matte"], correct: 0 },
    { q: `Přelož: „Nedívej se!“ (見る miru)`, options: ["見るな (miruna)","見ない (minai)","見ろ (miro)","見て (mite)"], correct: 0 },
    { q: "Co znamená 行こう？", options: ["Pojďme! / Jde se!","Jdu.","Nechoď!","Jdi!"], correct: 0 },
    { q: "Jaký je drsný rozkazovací tvar slovesa する (suru)?", options: ["しろ (shiro)","する (suru)","しよう (shiyou)","した (shita)"], correct: 0 },
    { q: "Jaký je rozkazovací tvar slovesa 戦う (tatakau, bojovat)?", options: ["戦え (tatakae)","戦う (tatakau)","戦った (tatakatta)","戦おう (tatakaou)"], correct: 0 },
  ],
},

/* ---------------- LEKCE 10 ---------------- */
{
  id: "l10", number: 10, eyebrow: "Lekce 10",
  title: "Katakana a cizí slova",
  blocks: [
    { type: "p", text: `Katakanu používáš pro cizí slova (přejatá z angličtiny a dalších jazyků), zahraniční jména a často pro zvukomalebná slova nebo zdůraznění (název útoku, jméno robota atd.).` },
    { type: "h3", text: "Katakana — kompletní přehled" },
    kanaRowsToBlock(KATAKANA_ROWS),
    { type: "p", text: `Dlouhá samohláska se v katakaně značí čárkou ー (chōonpu), ne zdvojením znaku:` },
    { type: "examples", items: [
      { jp: "コーヒー", romaji: "koohii", cz: "káva" },
      { jp: "ビール", romaji: "biiru", cz: "pivo" },
    ]},

    { type: "h3", text: "Časté přejaté slovo v anime kontextu" },
    { type: "vocab", items: [
      { jp: "アニメ", romaji: "anime", cz: "anime" },
      { jp: "ゲーム", romaji: "geemu", cz: "hra" },
      { jp: "テレビ", romaji: "terebi", cz: "televize" },
      { jp: "コンピューター", romaji: "konpyuutaa", cz: "počítač" },
      { jp: "アイス", romaji: "aisu", cz: "zmrzlina" },
      { jp: "パン", romaji: "pan", cz: "chléb" },
      { jp: "タクシー", romaji: "takushii", cz: "taxi" },
      { jp: "ホテル", romaji: "hoteru", cz: "hotel" },
      { jp: "サンキュー", romaji: "sankyuu", cz: `díky (z angl. „thank you“, neformální)` },
    ]},
    { type: "p", text: `Zahraniční jména se taky píšou katakanou — proto i jména postav z anime (např. ナルト Naruto, サスケ Sasuke) bys v psaném textu poznal/a podle katakany.` },

    { type: "h3", text: "Zahraniční jména: ukázka z Cowboy Bebop a Solo Levelingu" },
    { type: "p", text: `Japonská jména postav (Tanjirou, Itadori, Sakamoto) se píšou kanji. Ale jakmile je postava cizinec, nebo přichází z jiného jazyka, jde rovnou do katakany — přesně jako u téhle posádky:` },
    { type: "table",
      headers: ["Katakana","Romaji","Kdo to je"],
      kinds: ["jp","romaji","text"],
      rows: [
        ["スパイク・スピーゲル","Supaiku Supiigeru","Spike Spiegel (Cowboy Bebop)"],
        ["ジェット・ブラック","Jetto Burakku","Jet Black (Cowboy Bebop)"],
        ["フェイ・ヴァレンタイン","Fei Varentain","Faye Valentine (Cowboy Bebop)"],
        ["ソン・ジヌ","Son Jinu","hlavní hrdina Solo Levelingu"],
      ]
    },
    { type: "tip", text: `Všimni si znaku ・ (nakaten) — používá se jako oddělovač mezi jménem a příjmením v katakaně, protože japonština jinak mezery mezi slovy nepíše. A ヴァ ve „Valentine“ je speciální kombinace na zápis hlásky „v“, kterou japonština přirozeně nemá — ヴ se přidalo až nedávno kvůli přejatým slovům.` },
  ],
  flashcardGroups: [
    { name: "Katakana — kompletní", cards: kanaRowsToCards(KATAKANA_ROWS) },
    { name: "Přejatá slova", cards: [
      { jp: "アニメ", romaji: "anime", cz: "anime" },
      { jp: "ゲーム", romaji: "geemu", cz: "hra" },
      { jp: "テレビ", romaji: "terebi", cz: "televize" },
      { jp: "コンピューター", romaji: "konpyuutaa", cz: "počítač" },
      { jp: "アイス", romaji: "aisu", cz: "zmrzlina" },
      { jp: "タクシー", romaji: "takushii", cz: "taxi" },
      { jp: "ホテル", romaji: "hoteru", cz: "hotel" },
    ]},
    { name: "Jména v katakaně", cards: [
      { jp: "スパイク・スピーゲル", romaji: "Supaiku Supiigeru", cz: "Spike Spiegel (Cowboy Bebop)" },
      { jp: "ジェット・ブラック", romaji: "Jetto Burakku", cz: "Jet Black (Cowboy Bebop)" },
      { jp: "フェイ・ヴァレンタイン", romaji: "Fei Varentain", cz: "Faye Valentine (Cowboy Bebop)" },
      { jp: "ソン・ジヌ", romaji: "Son Jinu", cz: "hlavní hrdina Solo Levelingu" },
    ]},
  ],
  quiz: [
    { q: "Co znamená テレビ？", options: ["televize","telefon","televizní pořad","tenis"], correct: 0 },
    { q: `Jak se katakanou správně zapíše dlouhé „ii“ na konci slova „takushii“?`, options: ["タクシー (takushii)","タクシイ (takushi-i)","タクシ (takushi)","タクシイー (takushii-)"], correct: 0 },
    { q: "Proč se cizí jména píšou katakanou, ne hiraganou?", options: ["Katakana je vyhrazená pro přejatá slova a jména, hiragana pro rodná japonská slova/gramatiku","Katakana je jednodušší na psaní","Hiragana cizí jména „nezná“","Je to jen estetická volba bez pravidla"], correct: 0 },
    { q: `Která katakana odpovídá slabice „ta“?`, options: ["タ","ナ","ラ","サ"], correct: 0 },
    { q: "Jak se v katakaně píše jméno Spike Spiegel?", options: ["スパイク・スピーゲル (Supaiku Supiigeru)","スパイク・スピゲル (Supaiku Supigeru)","スパイケ・スピーゲル (Supaike Supiigeru)","スピーゲル・スパイク (Supiigeru Supaiku)"], correct: 0 },
  ],
},

/* ---------------- LEKCE 11 ---------------- */
{
  id: "l11", number: 11, eyebrow: "Lekce 11",
  title: "Partikule na konci vět a styl řeči",
  blocks: [
    { type: "p", text: `Tohle je možná nejdůležitější lekce pro pochopení osobnosti postav v anime — malá slovíčka na konci věty, která nemění význam, ale silně mění tón.` },
    { type: "table",
      headers: ["Částice","Efekt","Kdo to typicky používá"],
      kinds: ["jp","text","text"],
      rows: [
        ["ね (ne)", `„že jo?“, hledání souhlasu, sdílený pocit`, "kdokoliv, velmi běžné"],
        ["よ (yo)", `důraznost, informování („říkám ti, že…“)`, "kdokoliv"],
        ["ぞ (zo)", "silný, hrubý důraz", "hlavně muži, drsné/sebevědomé postavy"],
        ["ぜ (ze)", `podobné ぞ, ale trochu „kámoš“ tón`, "hlavně muži, neformální"],
        ["わ (wa)", `měkký, tradičně „ženský“ důraz (dnes i Kansai dialekt)`, "tradičně ženské postavy, nebo Kansai dialekt"],
        ["かな (kana)", `„jen se ptám/přemýšlím nahlas“, nejistota`, "kdokoliv"],
        ["さ (sa)", "lehký důraz, ledabylost", "neformální mluva"],
      ]
    },
    { type: "h3", text: "Příklady" },
    { type: "examples", items: [
      { jp: "行くよ！", romaji: "Iku yo!", cz: "Jdu/Jdeme! (důrazně, informativně)" },
      { jp: "強いね。", romaji: "Tsuyoi ne.", cz: "Je silný, že jo?" },
      { jp: "やるぞ！", romaji: "Yaru zo!", cz: "Tak do toho! / Udělám to! (sebevědomě)" },
      { jp: "もっと強くなるぞ！", romaji: "Motto tsuyokunaru zo!", cz: "Budu ještě silnější! (typický power-fantasy pokřik, Solo Leveling)" },
      { jp: "知らないわよ。", romaji: "Shiranai wa yo.", cz: "Nevím, fakt. (měkčí tón)" },
      { jp: "大丈夫かな…", romaji: "Daijoubu kana...", cz: "Je to v pořádku…? (přemýšlení nahlas)" },
    ]},
    { type: "tip", text: `Díky těmto částicím dokážeš v anime „uslyšet“ osobnost postavy ještě dřív, než rozumíš celé větě — ぞ/ぜ signalizují drsňáka, わ tradičně „uvolněnou“/elegantní řeč, ね je univerzálně přátelské.` },
  ],
  flashcardGroups: [
    { name: "Koncové částice", cards: [
      { jp: "ね", romaji: "ne", cz: `hledání souhlasu, „že jo?“` },
      { jp: "よ", romaji: "yo", cz: "důraznost, informování" },
      { jp: "ぞ", romaji: "zo", cz: "silný/hrubý důraz (muži)" },
      { jp: "ぜ", romaji: "ze", cz: "neformální důraz (muži)" },
      { jp: "わ", romaji: "wa", cz: "měkký důraz" },
      { jp: "かな", romaji: "kana", cz: "nejistota, přemýšlení nahlas" },
    ]},
  ],
  quiz: [
    { q: "Jaký je rozdíl v „pocitu“ mezi 行くぞ a 行くね?", options: ["ikuzo je sebevědomé/drsné, ikune je přátelské/sdílné","jsou úplně stejné","ikune je drsnější","ikuzo je otázka"], correct: 0 },
    { q: "Co vyjadřuje かな na konci věty?", options: ["nejistotu / přemýšlení nahlas","silný rozkaz","minulý čas","zápor"], correct: 0 },
    { q: "Která částice je typická pro drsné/sebevědomé mužské postavy?", options: ["ぞ / ぜ (zo/ze)","ね (ne)","かな (kana)","の (no)"], correct: 0 },
  ],
},

/* ---------------- LEKCE 12 ---------------- */
{
  id: "l12", number: 12, eyebrow: "Lekce 12 · Shrnutí",
  title: "Slavné anime hlášky pod lupou",
  blocks: [
    { type: "p", text: `Teď se vrátíme k tomu, čím jsme začali, a rozebereme nejznámější anime fráze gramaticky, s využitím všeho, co jsme se naučili.` },
    { type: "vocab", items: [
      { jp: "いってきます", romaji: "Ittekimasu", cz: "Jdu (a vrátím se)!", note: "te-forma slovesa iku + kimasu — řekne se při odchodu z domu" },
      { jp: "ただいま", romaji: "Tadaima", cz: "Jsem zpátky!", note: `zkráceně z „tadaima kaerimashita“ (právě jsem se vrátil)` },
      { jp: "いただきます", romaji: "Itadakimasu", cz: "(říká se před jídlem)", note: "skromný tvar slovesa „dostat, přijmout“" },
      { jp: "ごちそうさまでした", romaji: "Gochisousama deshita", cz: "(říká se po jídle)", note: `doslova „byla to hostina“` },
      { jp: "がんばって", romaji: "Ganbatte", cz: "Dej do toho všechno! / Hodně štěstí!", note: "te-forma slovesa ganbaru (snažit se) jako žádost/povzbuzení" },
      { jp: "がんばれ", romaji: "Ganbare", cz: "Snaž se! / Dělej!", note: "rozkazovací tvar stejného slovesa, důraznější" },
      { jp: "だいじょうぶ", romaji: "Daijoubu", cz: "Je to v pořádku / Jsem v pořádku", note: "na-adjektivum bez な na konci věty" },
      { jp: "しょうがない", romaji: "Shouganai", cz: "Nic se s tím nedá dělat.", note: `doslova „nemá cenu/způsob (jak to udělat)“` },
      { jp: "まさか", romaji: "Masaka", cz: "To není možný! / Snad ne!", note: "citoslovce nejistoty a šoku" },
      { jp: "うるさい", romaji: "Urusai", cz: "Sklapni! / Buď zticha!", note: `i-adjektivum „hlučný“ použité jako zvolání` },
      { jp: "ばか", romaji: "Baka", cz: "Idiote! / Blbče!", note: `podstatné jméno „blázen/hlupák“` },
      { jp: "まって", romaji: "Matte", cz: "Počkej!", note: "te-forma slovesa matsu jako žádost" },
      { jp: "やめて", romaji: "Yamete", cz: "Přestaň! / Stop!", note: "te-forma slovesa yameru jako žádost" },
      { jp: "いけ", romaji: "Ike", cz: "Jdi! / Útok!", note: "rozkazovací tvar slovesa iku" },
      { jp: "いくぞ", romaji: "Ikuzo", cz: "Jdeme! / Tak jdem na to!", note: "volní tvar iku + ぞ (drsný důraz)" },
      { jp: "やった", romaji: "Yatta", cz: "Udělal/a jsem to! Jeej!", note: "minulý tvar slovesa suru" },
      { jp: "気をつけて", romaji: "Ki o tsukete", cz: "Dávej na sebe pozor.", note: `doslova „připoj/věnuj pozornost (ki)“ jako žádost` },
      { jp: "お疲れ様", romaji: "Otsukaresama", cz: "Díky za práci! / Dobrá práce!", note: `doslova „jste unavený/á“ jako poklona, po skončení činnosti` },
      { jp: "すごい", romaji: "Sugoi", cz: "Super! / Úžasné!", note: "i-adjektivum" },
      { jp: "やばい", romaji: "Yabai", cz: "Šílený! / To je zlé! / To je super!", note: "i-adjektivum, kontextově kladné i záporné" },
    ]},
    { type: "h3", text: "Bonus: slovní zásoba podle žánru" },
    { type: "p", text: `Na závěr pár slov přímo z témat tvých oblíbených seriálů — abys měl/a vždycky aspoň jednu kotvu k tomu, co právě sleduješ.` },
    { type: "vocab", items: [
      { jp: "呪い", romaji: "noroi", cz: "kletba", note: "Jujutsu Kaisen — podstatné jméno, viz 呪術師 (jujutsushi, zaklínač) z lekce 2" },
      { jp: "呪力", romaji: "juryoku", cz: "kletební energie", note: "Jujutsu Kaisen — 呪 (kletba) + 力 (síla/energie)" },
      { jp: "鬼", romaji: "oni", cz: "démon", note: "Demon Slayer (鬼滅の刃)" },
      { jp: "刃", romaji: "yaiba", cz: "čepel, ostří", note: "Demon Slayer — odtud i japonský název 鬼滅の刃" },
      { jp: "全集中", romaji: "zenshuu chuu", cz: "totální koncentrace", note: "Demon Slayer — 全 (úplný) + 集中 (koncentrace), název dýchací techniky" },
      { jp: "賞金稼ぎ", romaji: "shoukinkasegi", cz: "lovec odměn / bounty hunter", note: "Cowboy Bebop — povolání celé posádky Bebopu" },
      { jp: "宇宙船", romaji: "uchuusen", cz: "kosmická loď", note: "Cowboy Bebop — loď se jmenuje ビバップ号 (Bebopu-gou)" },
      { jp: "覚醒", romaji: "kakusei", cz: "procitnutí / probuzení síly", note: "Solo Leveling — moment, kdy hrdina získá novou schopnost" },
      { jp: "レベルアップ", romaji: "reberu appu", cz: "level up (povýšení úrovně)", note: "Solo Leveling — katakana, přejaté z angličtiny „level up“" },
      { jp: "殺し屋", romaji: "koroshiya", cz: "zabiják / hitman", note: "Sakamoto Days — 坂本は元殺し屋です z lekce 2" },
      { jp: "コンビニ", romaji: "konbini", cz: "večerka / convenience store", note: "Sakamoto Days — katakana, zkratka z „convenience store“, kde Sakamoto pracuje" },
    ]},
    { type: "p", text: `Zkus se vrátit ke třem hláškám, co sis vybavil/a na úplném začátku kurzu, a zkus je teď gramaticky rozebrat sám/sama — odkud pocházejí, jaké slovesné/přídavné jméno je v základu.` },
  ],
  flashcardGroups: [
    { name: "Anime hlášky", cards: [
      { jp: "いってきます", romaji: "ittekimasu", cz: "Jdu (a vrátím se)!" },
      { jp: "ただいま", romaji: "tadaima", cz: "Jsem zpátky!" },
      { jp: "がんばって", romaji: "ganbatte", cz: "Dej do toho všechno!" },
      { jp: "だいじょうぶ", romaji: "daijoubu", cz: "Je to v pořádku." },
      { jp: "しょうがない", romaji: "shouganai", cz: "Nic se s tím nedá dělat." },
      { jp: "まさか", romaji: "masaka", cz: "To není možný!" },
      { jp: "うるさい", romaji: "urusai", cz: "Sklapni!" },
      { jp: "やった", romaji: "yatta", cz: "Udělal/a jsem to!" },
      { jp: "お疲れ様", romaji: "otsukaresama", cz: "Díky za práci!" },
      { jp: "やばい", romaji: "yabai", cz: "Šílený! (+/-)" },
    ]},
    { name: "Žánrová slovní zásoba", cards: [
      { jp: "呪い", romaji: "noroi", cz: "kletba (Jujutsu Kaisen)" },
      { jp: "呪力", romaji: "juryoku", cz: "kletební energie (Jujutsu Kaisen)" },
      { jp: "鬼", romaji: "oni", cz: "démon (Demon Slayer)" },
      { jp: "刃", romaji: "yaiba", cz: "čepel, ostří (Demon Slayer)" },
      { jp: "全集中", romaji: "zenshuu chuu", cz: "totální koncentrace (Demon Slayer)" },
      { jp: "賞金稼ぎ", romaji: "shoukinkasegi", cz: "lovec odměn (Cowboy Bebop)" },
      { jp: "覚醒", romaji: "kakusei", cz: "procitnutí síly (Solo Leveling)" },
      { jp: "レベルアップ", romaji: "reberu appu", cz: "level up (Solo Leveling)" },
      { jp: "殺し屋", romaji: "koroshiya", cz: "zabiják (Sakamoto Days)" },
      { jp: "コンビニ", romaji: "konbini", cz: "večerka (Sakamoto Days)" },
    ]},
  ],
  quiz: [
    { q: "Z jakého slovesa pochází がんばって a co dělá te-forma?", options: ["z 頑張る (ganbaru, snažit se); te-forma dělá žádost/povzbuzení","z 頑張る; te-forma dělá minulý čas","z 頑張る; te-forma dělá zápor","není to odvozené ze slovesa"], correct: 0 },
    { q: "Proč se いってきます říká při odchodu z domu?", options: ["Slibuje návrat — jde a zase přijde (te-forma iku + kimasu)",`Znamená jen „ahoj“`,`Je to rozkaz „jdi!“`,"Je to otázka"], correct: 0 },
    { q: "Co znamená しょうがない？", options: ["Nic se s tím nedá dělat.","Je mi to jedno.","Mám hlad.","Jsem v pořádku."], correct: 0 },
    { q: "Jaký tvar slovesa je やった (yatta)?", options: ["minulý čas slovesa する (suru)","přítomný čas slovesa やる (yaru)","rozkazovací tvar","te-forma"], correct: 0 },
  ],
},

];

/* =========================================================
   TRÉNINK (Drilly) — náhodné opakování bez ohledu na pořadí lekcí
   ========================================================= */

const DRILLS = [

{
  id: "drill-kana", number: null, navLabel: "①", eyebrow: "Trénink",
  title: "Nácvik znaků (hiragana + katakana)",
  blocks: [
    { type: "p", text: `Tady jsou všechny znaky, které jsi zatím probral/a, na jedné kupě a v zamíchaném pořadí — žádná abeceda, žádná pevná posloupnost. Cíl je umět poznat znak nahodile, tak jak přijde v reálném textu, ne odříkat řadu „a-i-u-e-o“ jako básničku.` },
    { type: "tip", text: `Výslovnost je na druhé straně kartičky. Klikni na kartu pro otočení, a po každém pokusu si upřímně řekni „umím“ nebo „ještě ne“ — appka si to pamatuje. Tlačítko „Zamíchat znovu“ pořadí znovu zamíchá, kdykoliv chceš.` },
  ],
  flashcardGroups: [
    { name: "Hiragana (vše)", cards: kanaRowsToCards([...HIRAGANA_ROWS, ...HIRAGANA_DAKUTEN_ROWS]) },
    { name: "Katakana (vše)", cards: kanaRowsToCards([...KATAKANA_ROWS, ...KATAKANA_DAKUTEN_ROWS]) },
  ],
  quiz: [],
},

{
  id: "drill-words", number: null, navLabel: "②", eyebrow: "Trénink",
  title: "Nejčastější slova a fráze",
  blocks: [
    { type: "p", text: `Výběr nejužitečnějších slovíček a frází ze všech lekcí na jednom místě, zamíchaný napříč tématy — pozdravy vedle sloves vedle anime hlášek. Tohle je zkouška, jestli si slovo vybavíš i bez kontextu té jedné konkrétní lekce, kde jsi ho potkal/a poprvé.` },
  ],
  flashcardGroups: [
    { name: "Pozdravy a zdvořilost", cards: [
      { jp: "おはよう", romaji: "ohayou", cz: "dobré ráno" },
      { jp: "こんにちは", romaji: "konnichiwa", cz: "dobrý den" },
      { jp: "おやすみ", romaji: "oyasumi", cz: "dobrou noc" },
      { jp: "ありがとう", romaji: "arigatou", cz: "děkuji" },
      { jp: "すみません", romaji: "sumimasen", cz: "promiňte / pardon" },
      { jp: "ごめん", romaji: "gomen", cz: "omlouvám se" },
      { jp: "はい", romaji: "hai", cz: "ano" },
      { jp: "いいえ", romaji: "iie", cz: "ne" },
    ]},
    { name: "Zájmena", cards: [
      { jp: "私", romaji: "watashi", cz: "já (neutrální)" },
      { jp: "俺", romaji: "ore", cz: "já (neformální, drsné)" },
      { jp: "僕", romaji: "boku", cz: "já (neformální, skromnější)" },
      { jp: "君", romaji: "kimi", cz: "ty (neformální)" },
      { jp: "お前", romaji: "omae", cz: "ty (hrubé)" },
      { jp: "彼女", romaji: "kanojo", cz: "ona / přítelkyně" },
    ]},
    { name: "Slovesa", cards: [
      { jp: "行く", romaji: "iku", cz: "jít / jet" },
      { jp: "来る", romaji: "kuru", cz: "přijít" },
      { jp: "食べる", romaji: "taberu", cz: "jíst" },
      { jp: "飲む", romaji: "nomu", cz: "pít" },
      { jp: "見る", romaji: "miru", cz: "dívat se / vidět" },
      { jp: "する", romaji: "suru", cz: "dělat" },
      { jp: "分かる", romaji: "wakaru", cz: "rozumět" },
      { jp: "戦う", romaji: "tatakau", cz: "bojovat" },
      { jp: "待つ", romaji: "matsu", cz: "čekat" },
    ]},
    { name: "Přídavná jména", cards: [
      { jp: "かわいい", romaji: "kawaii", cz: "roztomilý" },
      { jp: "すごい", romaji: "sugoi", cz: "super / skvělý" },
      { jp: "かっこいい", romaji: "kakkoii", cz: "cool / skvělý" },
      { jp: "やばい", romaji: "yabai", cz: "šílený (+/-)" },
      { jp: "強い", romaji: "tsuyoi", cz: "silný" },
      { jp: "弱い", romaji: "yowai", cz: "slabý" },
      { jp: "大丈夫", romaji: "daijoubu", cz: "v pořádku" },
    ]},
    { name: "Anime hlášky", cards: [
      { jp: "いってきます", romaji: "ittekimasu", cz: "Jdu (a vrátím se)!" },
      { jp: "ただいま", romaji: "tadaima", cz: "Jsem zpátky!" },
      { jp: "がんばって", romaji: "ganbatte", cz: "Dej do toho všechno!" },
      { jp: "しょうがない", romaji: "shouganai", cz: "Nic se s tím nedá dělat." },
      { jp: "まさか", romaji: "masaka", cz: "To není možný!" },
      { jp: "やった", romaji: "yatta", cz: "Udělal/a jsem to!" },
      { jp: "お疲れ様", romaji: "otsukaresama", cz: "Díky za práci!" },
      { jp: "まって", romaji: "matte", cz: "Počkej!" },
      { jp: "やめて", romaji: "yamete", cz: "Přestaň!" },
    ]},
  ],
  quiz: [
    { q: "Co znamená 強い (tsuyoi)?", options: ["silný","slabý","roztomilý","hlučný"], correct: 0 },
    { q: "Jak se neformálně a drsně řekne „já“ (typické pro sebevědomé postavy)?", options: ["俺 (ore)","僕 (boku)","私 (watashi)","あなた (anata)"], correct: 0 },
    { q: "Která fráze se říká před jídlem?", options: ["いただきます (itadakimasu)","ごちそうさまでした (gochisousama deshita)","いってきます (ittekimasu)","ただいま (tadaima)"], correct: 0 },
    { q: "Co znamená しょうがない (shouganai)?", options: ["Nic se s tím nedá dělat.","Mám hlad.","Je mi smutno.","Jsem v pořádku."], correct: 0 },
    { q: "Jak je zdvořile „Jím“ (食べる taberu)?", options: ["食べます (tabemasu)","食べる (taberu)","食べた (tabeta)","食べて (tabete)"], correct: 0 },
    { q: "Která částice označuje přímý předmět?", options: ["を (o)","は (wa)","が (ga)","に (ni)"], correct: 0 },
    { q: "Co je pravda o slově やばい (yabai)?", options: ["Může být kladné i záporné — záleží na tónu","Je vždy jen záporné","Je vždy jen kladné","Znamená „klidný“"], correct: 0 },
    { q: "Jak řekneš „Pojďme!“ (volní tvar slovesa 行く iku)?", options: ["行こう (ikou)","行く (iku)","行った (itta)","行け (ike)"], correct: 0 },
    { q: "Co znamená お疲れ様 (otsukaresama)?", options: ["Díky za práci! / Dobrá práce!","Dobré ráno.","Promiňte.","Sbohem."], correct: 0 },
    { q: "Jaký je rozdíl mezi がんばって a がんばれ?", options: ["Obojí povzbuzuje, ale がんばれ je důraznější přímý rozkaz","がんばって je rozkaz a がんばれ je žádost — naopak","Jsou to synonyma beze rozdílu","がんばれ je minulý čas"], correct: 0 },
    { q: "Co znamená 大丈夫 (daijoubu)?", options: ["V pořádku","Unavený","Hladový","Smutný"], correct: 0 },
    { q: "Jak se anglické přejaté slovo „level up“ píše katakanou?", options: ["レベルアップ (reberu appu)","レベルアプ (reberu apu)","レベアップ (rebe appu)","レヴェルアップ (reveru appu)"], correct: 0 },
  ],
},

];

/* =========================================================
   PŘÍLOHY
   ========================================================= */

const APPENDICES = [

{
  id: "pA", number: null, eyebrow: "Příloha A",
  title: "Kompletní tabulka hiragany",
  blocks: [
    { type: "h3", text: "Základní řady" },
    kanaRowsToBlock(HIRAGANA_ROWS),
    { type: "h3", text: "Znělé varianty (dakuten)" },
    kanaRowsToBlock(HIRAGANA_DAKUTEN_ROWS),
    { type: "h3", text: "Sokuon, youon a dlouhé samohlásky" },
    { type: "list", ordered: false, items: [
      `Sokuon (zdvojení souhlásky): malé っ před souhláskou, např. がっこう (gakkou, škola).`,
      `Youon (spojené slabiky): malé や/ゆ/よ za き/し/ち/に/ひ/み/り tvoří きゃ kya, しゃ sha, ちゃ cha apod.`,
      `Dlouhé samohlásky: zdvojení samohláskové kany, např. おかあさん (okaasan, maminka).`,
    ]},
  ],
  flashcardGroups: [
    { name: "Hiragana — základní", cards: kanaRowsToCards(HIRAGANA_ROWS) },
    { name: "Hiragana — znělé (dakuten)", cards: kanaRowsToCards(HIRAGANA_DAKUTEN_ROWS) },
  ],
  quiz: [],
},

{
  id: "pB", number: null, eyebrow: "Příloha B",
  title: "Kompletní tabulka katakany",
  blocks: [
    { type: "h3", text: "Základní řady" },
    kanaRowsToBlock(KATAKANA_ROWS),
    { type: "h3", text: "Znělé varianty (dakuten)" },
    kanaRowsToBlock(KATAKANA_DAKUTEN_ROWS),
    { type: "tip", text: "Dlouhá samohláska: vodorovná čárka ー, např. ケーキ (keeki, dort)." },
  ],
  flashcardGroups: [
    { name: "Katakana — základní", cards: kanaRowsToCards(KATAKANA_ROWS) },
    { name: "Katakana — znělé (dakuten)", cards: kanaRowsToCards(KATAKANA_DAKUTEN_ROWS) },
  ],
  quiz: [],
},

{
  id: "pC", number: null, eyebrow: "Příloha C",
  title: "Přehled základních částic",
  blocks: [
    { type: "table",
      headers: ["Částice","Funkce"],
      kinds: ["jp","text"],
      rows: [
        ["は (wa)","téma věty"],
        ["が (ga)","podmět / zdůraznění"],
        ["を (o)","přímý předmět"],
        ["に (ni)","čas, místo/směr, příjemce děje"],
        ["で (de)","místo děje, prostředek"],
        ["と (to)", `„a“, „s“`],
        ["も (mo)","také"],
        ["か (ka)","otázka"],
        ["から (kara)", `„z/od“, „protože“`],
        ["まで (made)", `„až do“`],
        ["ね (ne)","hledání souhlasu"],
        ["よ (yo)","důraznost"],
        ["ぞ／ぜ (zo/ze)","drsný/sebevědomý důraz"],
        ["わ (wa, na konci věty)","měkký důraz"],
        ["かな (kana)", `nejistota, „přemýšlím nahlas“`],
      ]
    },
  ],
  flashcardGroups: [
    { name: "Všechny částice", cards: [
      { jp: "は", romaji: "wa", cz: "téma věty" },
      { jp: "が", romaji: "ga", cz: "podmět / zdůraznění" },
      { jp: "を", romaji: "o", cz: "přímý předmět" },
      { jp: "に", romaji: "ni", cz: "čas, místo/směr" },
      { jp: "で", romaji: "de", cz: "místo děje, prostředek" },
      { jp: "と", romaji: "to", cz: `„a“, „s“` },
      { jp: "も", romaji: "mo", cz: "také" },
      { jp: "から", romaji: "kara", cz: `„z/od“, „protože“` },
      { jp: "まで", romaji: "made", cz: `„až do“` },
      { jp: "ね", romaji: "ne", cz: "hledání souhlasu" },
      { jp: "よ", romaji: "yo", cz: "důraznost" },
      { jp: "ぞ／ぜ", romaji: "zo/ze", cz: "drsný/sebevědomý důraz" },
    ]},
  ],
  quiz: [
    { q: "Která částice označuje téma věty?", options: ["は (wa)","が (ga)","を (o)","に (ni)"], correct: 0 },
    { q: "Která částice označuje přímý předmět?", options: ["を (o)","は (wa)","と (to)","も (mo)"], correct: 0 },
    { q: `Která částice znamená „z/od“ nebo „protože“?`, options: ["から (kara)","まで (made)","で (de)","と (to)"], correct: 0 },
    { q: `Která částice na konci věty vyjadřuje hledání souhlasu („že jo?“)?`, options: ["ね (ne)","ぞ (zo)","を (o)","から (kara)"], correct: 0 },
  ],
},

{
  id: "pD", number: null, eyebrow: "Příloha D",
  title: "Mini slovníček",
  blocks: [
    { type: "vocab", items: [
      { jp: "友達（ともだち）", romaji: "tomodachi", cz: "kamarád" },
      { jp: "先生（せんせい）", romaji: "sensei", cz: "učitel / mistr" },
      { jp: "先輩（せんぱい）", romaji: "senpai", cz: "starší spolužák/kolega" },
      { jp: "後輩（こうはい）", romaji: "kouhai", cz: "mladší spolužák/kolega" },
      { jp: "学校（がっこう）", romaji: "gakkou", cz: "škola" },
      { jp: "家（いえ）", romaji: "ie", cz: "dům / domov" },
      { jp: "戦う（たたかう）", romaji: "tatakau", cz: "bojovat" },
      { jp: "強さ（つよさ）", romaji: "tsuyosa", cz: "síla" },
      { jp: "夢（ゆめ）", romaji: "yume", cz: "sen" },
      { jp: "仲間（なかま）", romaji: "nakama", cz: "spolubojovník / parta" },
      { jp: "約束（やくそく）", romaji: "yakusoku", cz: "slib" },
      { jp: "大切（たいせつ）", romaji: "taisetsu", cz: "důležitý / vzácný" },
    ]},
  ],
  flashcardGroups: [
    { name: "Mini slovníček", cards: [
      { jp: "友達", romaji: "tomodachi", cz: "kamarád" },
      { jp: "先生", romaji: "sensei", cz: "učitel / mistr" },
      { jp: "先輩", romaji: "senpai", cz: "starší spolužák/kolega" },
      { jp: "後輩", romaji: "kouhai", cz: "mladší spolužák/kolega" },
      { jp: "学校", romaji: "gakkou", cz: "škola" },
      { jp: "家", romaji: "ie", cz: "dům / domov" },
      { jp: "戦う", romaji: "tatakau", cz: "bojovat" },
      { jp: "夢", romaji: "yume", cz: "sen" },
      { jp: "仲間", romaji: "nakama", cz: "spolubojovník / parta" },
      { jp: "約束", romaji: "yakusoku", cz: "slib" },
      { jp: "大切", romaji: "taisetsu", cz: "důležitý / vzácný" },
    ]},
  ],
  quiz: [],
},

];

/* =========================================================
   ZÁVĚR
   ========================================================= */

const OUTRO = {
  id: "outro", number: null, eyebrow: "Závěr",
  title: "Jak pokračovat dál",
  blocks: [
    { type: "list", ordered: true, items: [
      `Poslech s japonskými titulky — jakmile zvládneš hiraganu/katakanu, zkus pustit anime s japonskými (ne českými/anglickými) titulky. Uvidíš psanou formu toho, co slyšíš.`,
      `Anki (aplikace na opakování) — nahraj si slovíčka z tohoto kurzu jako kartičky a opakuj je pravidelně, krátce a často.`,
      `Stínování (shadowing) — pusť si krátkou repliku z anime, zastav, zkus ji zopakovat se stejnou intonací. Skvělé na výslovnost a melodii řeči.`,
      `Tae Kim's Guide to Japanese nebo Genki I (učebnice) — až budeš chtít jít do hloubky gramatiky nad rámec tohoto kurzu.`,
      `Nevadí, když nejdřív budeš rozumět jen útržkům vět z anime — právě teď, po tomhle kurzu, už víš proč věta zní tak, jak zní, a to je obrovský posun oproti „jen znám pár hlášek“.`,
    ]},
    { type: "p", text: "頑張って！ (Ganbatte! — Ať se ti to daří!)" },
  ],
  flashcardGroups: [],
  quiz: [],
};

/* =========================================================
   EXPORT
   ========================================================= */

const COURSE = {
  title: "日本語",
  subtitle: "Japonština pro fanoušky anime",
  lessons: LESSONS,
  drills: DRILLS,
  appendices: APPENDICES,
  outro: OUTRO,
};
