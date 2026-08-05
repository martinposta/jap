/* ================================================================
   JAPANESE FROM ZERO — app.js
   Rendering, navigace, flashkarty, kvízy, progress v localStorage
   ================================================================ */

(function () {
"use strict";

/* ─────────────────── localStorage helpers ─────────────────── */
const STORE = "jfz2:";
function lsGet(k)    { try { return localStorage.getItem(STORE+k); } catch(e) { return null; } }
function lsSet(k,v)  { try { localStorage.setItem(STORE+k,v); } catch(e) {} }
function lsDel(k)    { try { localStorage.removeItem(STORE+k); } catch(e) {} }
function isPageDone(bookId, pageId)   { return lsGet(bookId+":done:"+pageId)==="1"; }
function setPageDone(bookId, pageId, v) { v ? lsSet(bookId+":done:"+pageId,"1") : lsDel(bookId+":done:"+pageId); }
function isQuizOk(bookId, pageId, i) { return lsGet(bookId+":q:"+pageId+":"+i)==="1"; }
function setQuizOk(bookId, pageId, i){ lsSet(bookId+":q:"+pageId+":"+i,"1"); }
function isCardKnown(bookId, pageId, g, i){ return lsGet(bookId+":fc:"+pageId+":"+g+":"+i)==="1"; }
function setCardKnown(bookId, pageId, g, i, v){ v ? lsSet(bookId+":fc:"+pageId+":"+g+":"+i,"1") : lsDel(bookId+":fc:"+pageId+":"+g+":"+i); }

/* ─────────────────── text helpers ─────────────────── */
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
const JP_RE = /([\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uFF00-\uFFEF]+)/g;
function rich(t){ return esc(t).replace(JP_RE,'<span class="jp">$1</span>'); }

function stampSvg(cls){
  return `<svg class="stamp-svg ${cls||""}" viewBox="0 0 60 60" aria-hidden="true">
    <circle class="stamp-ring" cx="30" cy="30" r="26"/>
    <text class="stamp-char" x="30" y="40" text-anchor="middle" font-size="22">済</text>
  </svg>`;
}

/* ─────────────────── shuffle ─────────────────── */
function shuffle(n){
  const a=Array.from({length:n},(_,i)=>i);
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

/* ─────────────────── state ─────────────────── */
let currentBook = null;
let fcState = {pageId:null, bookId:null, group:0, idx:0, order:[]};

/* ─────────────────── block renderers ─────────────────── */
function renderBlock(b){
  switch(b.type){
    case "p":   return `<p>${rich(b.text)}</p>`;
    case "h3":  return `<h3>${rich(b.text)}</h3>`;

    case "tip": return `<div class="tip${b.warn?" warning":""}">
      <span class="tip-icon">${b.warn?"⚠️":"💡"}</span>
      <div>${rich(b.text)}</div></div>`;

    case "words": {
      const heads = b.headers.map(h=>`<th>${esc(h)}</th>`).join("");
      const rows = b.rows.map(r=>`<tr>
        <td class="td-prog">${rich(r[0])}</td>
        <td class="td-kana jp">${esc(r[1])}</td>
        <td class="td-kanji jp">${esc(r[2])}</td>
        <td class="td-en">${esc(r[3])}</td>
      </tr>`).join("");
      return `<table class="word-table">
        <thead><tr>${heads}</tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    }

    case "phrases": {
      const items = b.items.map(it=>`<li class="phrase-item">
        <span class="phrase-num">${esc(it.num)}.</span>
        <span class="phrase-en">${rich(it.en)}</span>
        <span>
          <span class="phrase-jp jp">${esc(it.jp)}</span>
          ${it.ro?`<br><span class="phrase-ro">${esc(it.ro)}</span>`:""}
        </span>
      </li>`).join("");
      return `<ul class="phrase-list">${items}</ul>`;
    }

    case "culture": return `<div class="culture-card">
      <strong>文化クリップ — ${esc(b.title)}</strong><br>${rich(b.text)}</div>`;

    case "cool": return `<div class="cool-tools-box">
      <strong>🛠 Cool Tools — ${esc(b.title)}</strong><br>${rich(b.text)}</div>`;

    case "grammar": return b.points.map(renderGrammarPoint).join("");

    case "kana": return renderKanaBlock(b);

    case "qa": {
      const pairs = b.pairs.map(p=>`<div class="qa-pair">
        <span class="qa-jp jp">${esc(p.jp)}</span>
        <span class="qa-en">${rich(p.en)}</span>
      </div>`).join("");
      return `<div class="qa-block">
        <div class="qa-question-header">${b.title}${b.titleJp?` <span class="qa-question-jp jp">${esc(b.titleJp)}</span>`:""}</div>
        <div class="qa-pairs">${pairs}</div>
      </div>`;
    }

    case "reading": {
      const items = b.items.map((s,i)=>`<li>${esc(`${i+1}. `)}${esc(s)}</li>`).join("");
      return `<div class="reading-passage"><ol>${items}</ol></div>`;
    }

    case "dialogue": {
      const lines = b.lines.map(l=>`<div class="dialogue-line">
        <span class="dialogue-speaker">${esc(l.speaker)}</span>
        <span>
          <span class="dialogue-text-jp jp">${esc(l.jp)}</span>
          <span class="dialogue-text-en"> → ${esc(l.en)}</span>
        </span>
      </div>`).join("");
      return `<div class="dialogue-box">
        <div class="dialogue-header">${esc(b.title)}</div>
        <div class="dialogue-body">${lines}</div>
      </div>`;
    }

    case "vocab": {
      const cards = b.items.map(it=>`<div class="vocab-card">
        <span class="v-jp jp">${esc(it.jp)}</span>
        <span class="v-ro">${esc(it.romaji)}</span>
        <span class="v-en">${esc(it.en)}</span>
      </div>`).join("");
      return `<h3>${rich(b.groupTitle)}</h3><div class="vocab-group-grid">${cards}</div>`;
    }

    case "sentence": return `<div class="sentence-building">
      <div class="sb-label">Sentence Building ぶんのつくり</div>
      <div class="sb-jp jp">${esc(b.jp)}</div>
      <div class="sb-en">${esc(b.en)}</div>
    </div>`;

    default: return "";
  }
}

function renderGrammarPoint(pt){
  const exHtml = (pt.examples||[]).map(ex=>`<div class="example-row">
    <span class="ex-num">${esc(ex.num)}</span>
    <span class="ex-jp jp">${esc(ex.jp)}</span>
    <span class="ex-ro">${esc(ex.ro||"")}</span>
    <span class="ex-en">${esc(ex.en)}</span>
  </div>`).join("");
  return `<div class="grammar-point">
    <div class="grammar-point-header">☐ ${esc(pt.title)}</div>
    <div class="grammar-point-body">
      <p>${rich(pt.body)}</p>
      ${pt.formula?`<div class="formula-box">${esc(pt.formula)}</div>`:""}
      ${exHtml?`<div class="example-block">
        <div class="example-block-title">Příklady / Example Sentences</div>
        ${exHtml}
      </div>`:""}
    </div>
  </div>`;
}

function renderKanaBlock(b){
  const cells = b.rows.flatMap(r=>r.cells||[]);
  return `<div class="kana-grid">${cells.map(c=>
    c?`<div class="kana-box" title="${c.romaji}">
      <span class="kana-char jp">${esc(c.char)}</span>
      <span class="kana-romaji">${esc(c.romaji)}</span>
    </div>`
    :`<div class="kana-box empty"></div>`
  ).join("")}</div>`;
}

/* ─────────────────── section badge helper ─────────────────── */
function badge(kind, icon, label){
  return `<div class="section-badge ${kind}"><span class="badge-icon">${icon}</span> ${esc(label)}</div>`;
}

/* ─────────────────── page renderer ─────────────────── */
function renderPage(book, page){
  const inner = document.getElementById("content-inner");
  const parts = [];

  parts.push(`<p class="lesson-eyebrow">${esc(page.eyebrow)}</p>`);
  parts.push(`<h1 class="lesson-title">${esc(page.title)}</h1>`);
  if(page.subtitle) parts.push(`<p class="lesson-subtitle">${esc(page.subtitle)}</p>`);

  // About This Lesson
  if(page.about){
    const {before=[], goals=[], teachers=[]} = page.about;
    parts.push(`<div class="about-box">
      ${before.length?`<div class="about-col before-col">
        <div class="about-col-title">Než začneš</div>
        <ul>${before.map(s=>`<li>${rich(s)}</li>`).join("")}</ul>
      </div>`:""}
      ${goals.length?`<div class="about-col goals-col">
        <div class="about-col-title">Cíle lekce</div>
        <ul>${goals.map(s=>`<li>${rich(s)}</li>`).join("")}</ul>
      </div>`:""}
      ${teachers.length?`<div class="about-col teachers-col">
        <div class="about-col-title">Tipy od učitelů</div>
        <ul>${teachers.map(s=>`<li>${rich(s)}</li>`).join("")}</ul>
      </div>`:""}
    </div>`);
  }

  // Main blocks — auto-inject section badges
  let prevType = null;
  for(const b of (page.blocks||[])){
    const t = b.type;
    if(t==="words"    && prevType!=="words")    parts.push(badge("words","📖","Nová slovíčka あたらしい ことば"));
    if(t==="phrases"  && prevType!=="phrases")  parts.push(badge("phrases","💬","Nové fráze あたらしい かいわ"));
    if(t==="culture"  && prevType!=="culture")  parts.push(badge("culture","🏮","Culture Clip カルチャー クリップ"));
    if(t==="cool"     && prevType!=="cool")     parts.push(badge("cool","🛠","Cool Tools クール・ツール"));
    if(t==="grammar"  && prevType!=="grammar")  parts.push(badge("grammar","📐","Grammar ぶんぽう"));
    if(t==="kana"     && prevType!=="kana")     parts.push(badge("kana","✍","New Hiragana あたらしい ひらがな"));
    if(t==="qa"       && prevType!=="qa")       parts.push(badge("activ","✏️","Q&A Cvičení"));
    if(t==="dialogue" && prevType!=="dialogue") parts.push(badge("activ","💬","Mini Conversation ミニ かいわ"));
    if(t==="vocab"    && prevType!=="vocab")    parts.push(badge("vocab","📚","Vocabulary Groups ことばの グループ"));
    if(t==="sentence" && prevType!=="sentence") parts.push(badge("drill","🔨","Sentence Building ぶんのつくり"));
    parts.push(renderBlock(b));
    prevType = t;
  }

  // Flashcards
  if((page.flashcardGroups||[]).length>0){
    parts.push(`<h2>Kartičky k zapamatování</h2>`);
    parts.push(renderFlashSection(book, page));
  }

  // Quiz
  if((page.quiz||[]).length>0){
    parts.push(`<h2>Cvičení — Quiz</h2>`);
    parts.push(renderQuizSection(book, page));
  }

  // Completion
  parts.push(`<div id="completion-area"></div>`);

  // Footer nav
  parts.push(renderFooterNav(book, page));

  inner.innerHTML = parts.join("");
  window.scrollTo(0,0);

  // Wire interactives
  wireFlashcards(book, page);
  wireQuiz(book, page);
  refreshCompletionArea(book, page);
}

/* ─────────────────── flashcards ─────────────────── */
function renderFlashSection(book, page){
  if(!page.flashcardGroups?.length) return "";
  const tabs = page.flashcardGroups.map((g,i)=>
    `<button class="flash-tab${i===0?" active":""}" data-fc-group="${i}">${esc(g.name)}</button>`
  ).join("");
  return `<div class="flash-section">
    <div class="flash-tabs">${tabs}</div>
    <div class="flash-meta" id="fc-meta"></div>
    <div class="flash-stage" id="fc-stage"></div>
    <div class="flash-controls" id="fc-controls"></div>
    <div class="flash-controls-2">
      <button class="btn ghost sm" id="fc-shuffle">🔀 Zamíchat znovu</button>
    </div>
  </div>`;
}

function initFcState(book, page){
  if(fcState.pageId===page.id && fcState.bookId===book.id) return;
  fcState = {
    pageId: page.id, bookId: book.id,
    group: 0, idx: 0,
    order: shuffle(page.flashcardGroups[0].cards.length)
  };
}

function wireFlashcards(book, page){
  if(!page.flashcardGroups?.length) return;
  initFcState(book, page);

  document.querySelectorAll(".flash-tab").forEach(btn=>{
    btn.onclick=()=>{
      const g=parseInt(btn.dataset.fcGroup,10);
      fcState.group=g; fcState.idx=0;
      fcState.order=shuffle(page.flashcardGroups[g].cards.length);
      document.querySelectorAll(".flash-tab").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      renderCard(book, page);
    };
  });

  const shuffleBtn=document.getElementById("fc-shuffle");
  if(shuffleBtn) shuffleBtn.onclick=()=>{
    fcState.order=shuffle(page.flashcardGroups[fcState.group].cards.length);
    fcState.idx=0;
    renderCard(book, page);
  };

  renderCard(book, page);
}

function renderCard(book, page){
  const grp = page.flashcardGroups[fcState.group];
  const realIdx = fcState.order[fcState.idx];
  const card = grp.cards[realIdx];
  const known = isCardKnown(book.id, page.id, fcState.group, realIdx);
  const knownCnt = grp.cards.filter((_,i)=>isCardKnown(book.id, page.id, fcState.group, i)).length;

  const meta=document.getElementById("fc-meta");
  const stage=document.getElementById("fc-stage");
  const controls=document.getElementById("fc-controls");
  if(!meta||!stage||!controls) return;

  meta.textContent=`Karta ${fcState.idx+1} / ${grp.cards.length} · umím ${knownCnt}/${grp.cards.length} · zamícháno`;

  stage.innerHTML=`<div class="flashcard" id="fc-card">
    <div class="flashcard-inner">
      <div class="flash-face front">
        <span class="f-jp jp">${esc(card.front)}</span>
        ${card.frontRo?`<span class="f-ro">${esc(card.frontRo)}</span>`:""}
        <span class="f-hint">klikni pro otočení</span>
      </div>
      <div class="flash-face back">
        <span class="f-en">${esc(card.back)}</span>
        ${card.frontKana&&card.frontKana!==card.front?`<span class="f-kana jp">${esc(card.frontKana)}</span>`:""}
      </div>
    </div>
  </div>`;

  controls.innerHTML=`
    <button class="btn ghost" id="fc-prev" ${fcState.idx===0?"disabled":""}>← Předchozí</button>
    <button class="btn ${known?"know":""}" id="fc-know">${known?"✓ Umím":"Umím"}</button>
    <button class="btn ghost" id="fc-next">Další →</button>`;

  document.getElementById("fc-card").onclick=()=>document.getElementById("fc-card").classList.toggle("flipped");

  document.getElementById("fc-know").onclick=(e)=>{
    e.stopPropagation();
    setCardKnown(book.id, page.id, fcState.group, realIdx, !known);
    renderCard(book, page);
  };
  document.getElementById("fc-prev").onclick=(e)=>{
    e.stopPropagation();
    if(fcState.idx>0){fcState.idx--;renderCard(book,page);}
  };
  document.getElementById("fc-next").onclick=(e)=>{
    e.stopPropagation();
    fcState.idx=(fcState.idx+1)%grp.cards.length;
    renderCard(book,page);
  };
}

/* ─────────────────── quiz ─────────────────── */
function renderQuizSection(book, page){
  return (page.quiz||[]).map((q,qi)=>`
    <div class="quiz-block" data-qi="${qi}">
      <div class="quiz-q">${rich(q.q)}</div>
      <ul class="quiz-options">
        ${q.options.map((opt,oi)=>
          `<li><button class="quiz-opt" data-oi="${oi}">${rich(opt)}</button></li>`
        ).join("")}
      </ul>
      <div class="quiz-feedback hidden"></div>
    </div>`).join("");
}

function wireQuiz(book, page){
  document.querySelectorAll(".quiz-block").forEach(block=>{
    const qi=parseInt(block.dataset.qi,10);
    const q=page.quiz[qi];
    const fb=block.querySelector(".quiz-feedback");

    // restore already-correct answers
    if(isQuizOk(book.id, page.id, qi)){
      block.querySelectorAll(".quiz-opt").forEach((btn,oi)=>{
        btn.disabled=true;
        if(oi===q.correct) btn.classList.add("correct");
      });
      fb.classList.remove("hidden");
      fb.innerHTML=q.explain?`✅ ${rich(q.explain)}`:"✅ Správně!";
    }

    block.querySelectorAll(".quiz-opt").forEach(btn=>{
      btn.onclick=()=>{
        const oi=parseInt(btn.dataset.oi,10);
        const opts=block.querySelectorAll(".quiz-opt");
        opts.forEach(b=>b.disabled=true);

        if(oi===q.correct){
          btn.classList.add("correct");
          setQuizOk(book.id, page.id, qi);
          fb.classList.remove("hidden");
          fb.innerHTML=q.explain?`✅ ${rich(q.explain)}`:"✅ Správně!";
          checkAutoComplete(book, page);
        } else {
          btn.classList.add("wrong");
          fb.classList.remove("hidden");
          fb.textContent="❌ Zkus znovu.";
          setTimeout(()=>{
            opts.forEach(b=>{b.disabled=false; b.classList.remove("wrong");});
            fb.classList.add("hidden");
          }, 900);
        }
      };
    });
  });
}

function checkAutoComplete(book, page){
  const allOk=(page.quiz||[]).every((_,i)=>isQuizOk(book.id, page.id, i));
  if(allOk && !isPageDone(book.id, page.id)){
    setPageDone(book.id, page.id, true);
    refreshCompletionArea(book, page);
    refreshSidebar(book, page.id);
    refreshHeaderProgress(book);
  }
}

/* ─────────────────── completion ─────────────────── */
function refreshCompletionArea(book, page){
  const area=document.getElementById("completion-area");
  if(!area) return;
  const done=isPageDone(book.id, page.id);
  if(done){
    area.innerHTML=`<div class="completion-banner">
      ${stampSvg()}
      <span>Lekce dokončena — hanko razítko je tvoje! 🎉</span>
    </div>
    <button class="btn ghost" id="toggle-done">Zrušit dokončení</button>`;
  } else {
    area.innerHTML=`<button class="btn primary" id="toggle-done">✓ Označit lekci jako hotovou</button>`;
  }
  document.getElementById("toggle-done").onclick=()=>{
    setPageDone(book.id, page.id, !done);
    refreshCompletionArea(book, page);
    refreshSidebar(book, page.id);
    refreshHeaderProgress(book);
  };
}

/* ─────────────────── footer nav ─────────────────── */
function renderFooterNav(book, page){
  const pages=book.pages;
  const i=pages.findIndex(p=>p.id===page.id);
  const prev=pages[i-1], next=pages[i+1];
  return `<div class="lesson-footer-nav">
    ${prev?`<a href="#${prev.id}">← ${esc(prev.title)}</a>`:"<span></span>"}
    <span></span>
    ${next?`<a href="#${next.id}">${esc(next.title)} →</a>`:"<span></span>"}
  </div>`;
}

/* ─────────────────── sidebar ─────────────────── */
function buildSidebar(book, currentId){
  const sb=document.getElementById("sidebar");
  const preLessons=book.pages.filter(p=>p.id.startsWith("p"));
  const lessons=book.pages.filter(p=>p.id.startsWith("l"));

  function navItem(page){
    const active=page.id===currentId?"active":"";
    const done=isPageDone(book.id, page.id);
    return `<li class="nav-item ${active}" data-id="${page.id}">
      <a href="#${page.id}">
        <span class="nav-num">${esc(page.eyebrow.split(" ")[1]||"")}</span>
        <span>${esc(page.title)}</span>
        <span class="nav-stamp">${done?stampSvg():"" }</span>
      </a>
    </li>`;
  }

  sb.innerHTML=`
    <div class="sidebar-section-label">Pre-Lekce</div>
    <ul class="nav-list">${preLessons.map(navItem).join("")}</ul>
    <div class="sidebar-section-label">Lekce 1–10</div>
    <ul class="nav-list">${lessons.map(navItem).join("")}</ul>
    <div class="sidebar-footer">
      <div class="version-tag">v${COURSE.version} · ${COURSE.versionDate}</div>
      <button class="btn ghost" id="reset-btn" style="width:100%;margin-top:8px;font-size:12px;">
        Resetovat postup
      </button>
    </div>`;

  sb.querySelectorAll(".nav-item a").forEach(a=>a.addEventListener("click",()=>closeSidebar()));
  document.getElementById("reset-btn").onclick=()=>{
    if(confirm("Opravdu chceš smazat veškerý postup? Tato akce je nevratná.")){
      Object.keys(localStorage).filter(k=>k.startsWith(STORE)).forEach(k=>localStorage.removeItem(k));
      location.reload();
    }
  };
}

function refreshSidebar(book, currentId){
  buildSidebar(book, currentId);
}

/* ─────────────────── header progress ─────────────────── */
function refreshHeaderProgress(book){
  const lessons=book.pages.filter(p=>p.id.startsWith("l"));
  const done=lessons.filter(l=>isPageDone(book.id, l.id)).length;
  const el=document.getElementById("header-progress");
  if(el) el.innerHTML=`Postup: <strong>${done}/${lessons.length}</strong>`;
}

/* ─────────────────── mobile sidebar ─────────────────── */
function openSidebar(){
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("scrim").classList.add("show");
}
function closeSidebar(){
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("scrim").classList.remove("show");
}

/* ─────────────────── book selector ─────────────────── */
function buildBookSelector(){
  const grid=document.getElementById("book-grid");
  document.getElementById("version-label").textContent=COURSE.version;
  document.getElementById("version-date").textContent=COURSE.versionDate;

  grid.innerHTML=COURSE.books.map((book,bi)=>{
    const lessons=book.pages.filter(p=>p.id.startsWith("l"));
    const done=lessons.filter(l=>isPageDone(book.id, l.id)).length;
    const pips=lessons.map(l=>`<span class="progress-pip${isPageDone(book.id,l.id)?" done":""}"></span>`).join("");

    return `<div class="book-card${book.locked?" locked":""}" data-book-idx="${bi}">
      ${book.locked?`<span class="book-card-lock">🔒</span>`:""}
      <div class="book-card-num">${esc(book.num)}</div>
      <div class="book-card-title">${esc(book.title)}</div>
      <div class="book-card-sub">${esc(book.sub)}</div>
      ${lessons.length?`<div class="book-card-progress">${pips}</div>`:""}
      ${!book.locked?`<div class="book-card-btn">Vstoupit →</div>`:`<div style="font-size:11px;color:#4a6070;margin-top:12px;">Brzy k dispozici</div>`}
    </div>`;
  }).join("");

  grid.querySelectorAll(".book-card:not(.locked)").forEach(card=>{
    card.onclick=()=>enterBook(parseInt(card.dataset.bookIdx,10));
  });
}

function enterBook(idx){
  const book=COURSE.books[idx];
  if(book.locked) return;
  currentBook=book;
  document.getElementById("book-selector-overlay").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("header-book-badge").textContent=book.num;
  document.getElementById("header-title").textContent="Japanese From Zero!";
  refreshHeaderProgress(book);

  const hash=location.hash.slice(1);
  const page=book.pages.find(p=>p.id===hash)||book.pages[0];
  location.hash="#"+page.id;
  buildSidebar(book, page.id);
  renderPage(book, page);
}

/* ─────────────────── routing ─────────────────── */
function route(){
  if(!currentBook) return;
  const id=location.hash.slice(1)||currentBook.pages[0].id;
  const page=currentBook.pages.find(p=>p.id===id)||currentBook.pages[0];
  buildSidebar(currentBook, page.id);
  renderPage(currentBook, page);
}

/* ─────────────────── boot ─────────────────── */
function boot(){
  buildBookSelector();

  document.getElementById("menu-toggle").onclick=openSidebar;
  document.getElementById("scrim").onclick=closeSidebar;
  document.getElementById("book-switch-btn").onclick=()=>{
    currentBook=null;
    document.getElementById("app").classList.add("hidden");
    document.getElementById("book-selector-overlay").classList.remove("hidden");
    buildBookSelector();
  };

  window.addEventListener("hashchange", route);
}

document.addEventListener("DOMContentLoaded", boot);

})();
