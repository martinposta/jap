/* ================================================================
   JAPANESE FROM ZERO — data-helpers.js
   Kana tabulky, sdílené pomocné funkce
   ================================================================ */

/* ── hiragana řady ── */
const H_AIUEO = [{ label:"母音", cells:[
  {char:"あ",romaji:"a"},{char:"い",romaji:"i"},{char:"う",romaji:"u"},
  {char:"え",romaji:"e"},{char:"お",romaji:"o"}]}];
const H_KA = [{ label:"k", cells:[
  {char:"か",romaji:"ka"},{char:"き",romaji:"ki"},{char:"く",romaji:"ku"},
  {char:"け",romaji:"ke"},{char:"こ",romaji:"ko"}]}];
const H_SA = [{ label:"s", cells:[
  {char:"さ",romaji:"sa"},{char:"し",romaji:"shi"},{char:"す",romaji:"su"},
  {char:"せ",romaji:"se"},{char:"そ",romaji:"so"}]}];
const H_TA = [{ label:"t", cells:[
  {char:"た",romaji:"ta"},{char:"ち",romaji:"chi"},{char:"つ",romaji:"tsu"},
  {char:"て",romaji:"te"},{char:"と",romaji:"to"}]}];
const H_NA = [{ label:"n", cells:[
  {char:"な",romaji:"na"},{char:"に",romaji:"ni"},{char:"ぬ",romaji:"nu"},
  {char:"ね",romaji:"ne"},{char:"の",romaji:"no"}]}];
const H_HA = [{ label:"h", cells:[
  {char:"は",romaji:"ha"},{char:"ひ",romaji:"hi"},{char:"ふ",romaji:"fu"},
  {char:"へ",romaji:"he"},{char:"ほ",romaji:"ho"}]}];
const H_MA = [{ label:"m", cells:[
  {char:"ま",romaji:"ma"},{char:"み",romaji:"mi"},{char:"む",romaji:"mu"},
  {char:"め",romaji:"me"},{char:"も",romaji:"mo"}]}];
const H_YA = [{ label:"y", cells:[
  {char:"や",romaji:"ya"},null,{char:"ゆ",romaji:"yu"},null,{char:"よ",romaji:"yo"}]}];
const H_RA = [{ label:"r", cells:[
  {char:"ら",romaji:"ra"},{char:"り",romaji:"ri"},{char:"る",romaji:"ru"},
  {char:"れ",romaji:"re"},{char:"ろ",romaji:"ro"}]}];
const H_WA = [{ label:"w", cells:[
  {char:"わ",romaji:"wa"},null,null,null,{char:"を",romaji:"o"}]}];
const H_N  = [{ label:"n", cells:[
  {char:"ん",romaji:"n"},null,null,null,null]}];

const H_GA = [{ label:"g", cells:[
  {char:"が",romaji:"ga"},{char:"ぎ",romaji:"gi"},{char:"ぐ",romaji:"gu"},
  {char:"げ",romaji:"ge"},{char:"ご",romaji:"go"}]}];
const H_ZA = [{ label:"z", cells:[
  {char:"ざ",romaji:"za"},{char:"じ",romaji:"ji"},{char:"ず",romaji:"zu"},
  {char:"ぜ",romaji:"ze"},{char:"ぞ",romaji:"zo"}]}];
const H_DA = [{ label:"d", cells:[
  {char:"だ",romaji:"da"},{char:"ぢ",romaji:"ji"},{char:"づ",romaji:"zu"},
  {char:"で",romaji:"de"},{char:"ど",romaji:"do"}]}];
const H_BA = [{ label:"b", cells:[
  {char:"ば",romaji:"ba"},{char:"び",romaji:"bi"},{char:"ぶ",romaji:"bu"},
  {char:"べ",romaji:"be"},{char:"ぼ",romaji:"bo"}]}];
const H_PA = [{ label:"p", cells:[
  {char:"ぱ",romaji:"pa"},{char:"ぴ",romaji:"pi"},{char:"ぷ",romaji:"pu"},
  {char:"ぺ",romaji:"pe"},{char:"ぽ",romaji:"po"}]}];

/* složené kany — youon */
const H_YOUON = [
  { label:"kya", cells:[{char:"きゃ",romaji:"kya"},{char:"きゅ",romaji:"kyu"},{char:"きょ",romaji:"kyo"},null,null]},
  { label:"sha", cells:[{char:"しゃ",romaji:"sha"},{char:"しゅ",romaji:"shu"},{char:"しょ",romaji:"sho"},null,null]},
  { label:"cha", cells:[{char:"ちゃ",romaji:"cha"},{char:"ちゅ",romaji:"chu"},{char:"ちょ",romaji:"cho"},null,null]},
  { label:"nya", cells:[{char:"にゃ",romaji:"nya"},{char:"にゅ",romaji:"nyu"},{char:"にょ",romaji:"nyo"},null,null]},
  { label:"hya", cells:[{char:"ひゃ",romaji:"hya"},{char:"ひゅ",romaji:"hyu"},{char:"ひょ",romaji:"hyo"},null,null]},
  { label:"mya", cells:[{char:"みゃ",romaji:"mya"},{char:"みゅ",romaji:"myu"},{char:"みょ",romaji:"myo"},null,null]},
  { label:"rya", cells:[{char:"りゃ",romaji:"rya"},{char:"りゅ",romaji:"ryu"},{char:"りょ",romaji:"ryo"},null,null]},
  { label:"gya", cells:[{char:"ぎゃ",romaji:"gya"},{char:"ぎゅ",romaji:"gyu"},{char:"ぎょ",romaji:"gyo"},null,null]},
  { label:"ja",  cells:[{char:"じゃ",romaji:"ja"}, {char:"じゅ",romaji:"ju"}, {char:"じょ",romaji:"jo"}, null,null]},
  { label:"bya", cells:[{char:"びゃ",romaji:"bya"},{char:"びゅ",romaji:"byu"},{char:"びょ",romaji:"byo"},null,null]},
  { label:"pya", cells:[{char:"ぴゃ",romaji:"pya"},{char:"ぴゅ",romaji:"pyu"},{char:"ぴょ",romaji:"pyo"},null,null]},
];

/* ── kartičky z kana řad ── */
function kanaCards(rows) {
  return rows.flatMap(r => r.cells.filter(Boolean).map(c => ({
    front: c.char, frontKana: "", frontRo: c.romaji, back: c.romaji
  })));
}
