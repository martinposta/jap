/* =========================================================
   日本語 KURZ — APP LOGIC
   Obsah kurzu žije v data.js. Tady je jen vykreslování,
   navigace, kvízy, kartičky a ukládání postupu (localStorage).
   ========================================================= */

(function () {
  "use strict";

  const STORE = "jpcourse:";

  /* ---------- localStorage helpers ---------- */

  function lsGet(key) { try { return localStorage.getItem(STORE + key); } catch (e) { return null; } }
  function lsSet(key, val) { try { localStorage.setItem(STORE + key, val); } catch (e) {} }
  function lsDel(key) { try { localStorage.removeItem(STORE + key); } catch (e) {} }

  function isCompleted(pageId) { return lsGet("done:" + pageId) === "1"; }
  function setCompleted(pageId, val) { val ? lsSet("done:" + pageId, "1") : lsDel("done:" + pageId); }

  function isQuizCorrect(pageId, i) { return lsGet("quiz:" + pageId + ":" + i) === "1"; }
  function setQuizCorrect(pageId, i) { lsSet("quiz:" + pageId + ":" + i, "1"); }

  function isCardKnown(pageId, g, i) { return lsGet("fc:" + pageId + ":" + g + ":" + i) === "1"; }
  function setCardKnown(pageId, g, i, val) { val ? lsSet("fc:" + pageId + ":" + g + ":" + i, "1") : lsDel("fc:" + pageId + ":" + g + ":" + i); }

  function allQuizCorrect(page) {
    return page.quiz && page.quiz.length > 0 && page.quiz.every((_, i) => isQuizCorrect(page.id, i));
  }

  /* ---------- text helpers ---------- */

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Wraps runs of Japanese characters (kana/kanji/full-width punctuation) in a
  // span with the Japanese font, so they read nicely even inside Czech prose.
  const JP_RANGE = /([\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uFF00-\uFFEF]+)/g;
  function autoJP(escapedText) {
    return escapedText.replace(JP_RANGE, '<span class="jp">$1</span>');
  }
  function rich(text) { return autoJP(esc(text)); }

  function stampSvg(extraClass) {
    return `<svg class="stamp-svg ${extraClass || ""}" viewBox="0 0 60 60" aria-hidden="true">
      <circle class="ring" cx="30" cy="30" r="25"/>
      <text class="char" x="30" y="39" text-anchor="middle" font-size="22">済</text>
    </svg>`;
  }

  /* ---------- flat page list & lookup ---------- */

  function allPages() {
    return [...COURSE.lessons, ...COURSE.appendices, COURSE.outro];
  }
  function findPage(id) {
    return allPages().find(p => p.id === id);
  }
  function pageLabel(page) {
    if (page.number != null) return String(page.number).padStart(2, "0");
    if (page.id === "outro") return "—";
    return page.id.replace(/^p/, "").toUpperCase();
  }

  /* ---------- block renderers ---------- */

  function renderBlock(b) {
    switch (b.type) {
      case "p": return `<p>${rich(b.text)}</p>`;
      case "h3": return `<h3>${rich(b.text)}</h3>`;
      case "tip": return `<div class="tip"><span class="tip-icon">${b.icon || "💡"}</span><div>${rich(b.text)}</div></div>`;
      case "list": {
        const tag = b.ordered ? "ol" : "ul";
        return `<${tag}>${b.items.map(it => `<li>${rich(it)}</li>`).join("")}</${tag}>`;
      }
      case "table": {
        const kinds = b.kinds || b.headers.map(() => "text");
        const thead = `<thead><tr>${b.headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>`;
        const tbody = `<tbody>${b.rows.map(row => `<tr>${row.map((cell, i) => {
          const kind = kinds[i];
          const cls = kind === "jp" ? "jp-cell jp" : kind === "romaji" ? "romaji-cell" : "";
          return `<td class="${cls}">${kind === "text" ? rich(cell) : esc(cell)}</td>`;
        }).join("")}</tr>`).join("")}</tbody>`;
        return `<table class="data-table">${thead}${tbody}</table>`;
      }
      case "kana": {
        const cells = b.rows.flatMap(r => r.cells);
        return `<div class="kana-grid">${cells.map(c =>
          c ? `<div class="kana-box"><span class="kana-char">${esc(c.char)}</span><span class="kana-romaji">${esc(c.romaji)}</span></div>`
             : `<div class="kana-box empty"></div>`
        ).join("")}</div>`;
      }
      case "vocab": {
        return `<div class="vocab-grid">${b.items.map(it => `
          <div class="vocab-card">
            <span class="v-jp jp">${esc(it.jp)}</span>
            <span class="v-romaji">${esc(it.romaji)}</span>
            <span class="v-cz">${rich(it.cz)}</span>
            ${it.note ? `<span class="v-note">${rich(it.note)}</span>` : ""}
          </div>`).join("")}</div>`;
      }
      case "examples": {
        return b.items.map(it => `
          <div class="example-card">
            <span class="ex-jp jp">${esc(it.jp)}</span>
            <span class="ex-romaji">${esc(it.romaji)}</span>
            <span class="ex-cz">${rich(it.cz)}</span>
          </div>`).join("");
      }
      default: return "";
    }
  }

  /* ---------- flashcards ---------- */

  let fcState = { pageId: null, group: 0, index: 0 };

  function renderFlashcardSection(page) {
    if (!page.flashcardGroups || page.flashcardGroups.length === 0) return "";
    if (fcState.pageId !== page.id) fcState = { pageId: page.id, group: 0, index: 0 };

    const groupTabs = page.flashcardGroups.map((g, i) =>
      `<button class="btn ${i === fcState.group ? "primary" : "ghost"}" data-fc-group="${i}">${esc(g.name)}</button>`
    ).join("");

    return `
      <h2>Kartičky k zapamatování</h2>
      <div class="flash-controls">
        <div class="flash-group-tabs">${groupTabs}</div>
        <span class="flash-progress" id="fc-progress"></span>
      </div>
      <div class="flashcard-stage" id="fc-stage"></div>
      <div class="flash-actions" id="fc-actions"></div>
    `;
  }

  function currentGroup(page) { return page.flashcardGroups[fcState.group]; }

  function renderFlashcardStage(page) {
    const group = currentGroup(page);
    const stage = document.getElementById("fc-stage");
    const actions = document.getElementById("fc-actions");
    const progress = document.getElementById("fc-progress");
    if (!stage) return;

    const card = group.cards[fcState.index];
    const known = isCardKnown(page.id, fcState.group, fcState.index);
    const knownCount = group.cards.filter((_, i) => isCardKnown(page.id, fcState.group, i)).length;

    stage.innerHTML = `
      <div class="flashcard" id="fc-card">
        <div class="flashcard-inner">
          <div class="flash-face front">
            <span class="f-jp jp">${esc(card.jp)}</span>
            ${card.romaji ? `<span class="f-romaji">${esc(card.romaji)}</span>` : ""}
            <span class="f-hint">klikni pro otočení</span>
          </div>
          <div class="flash-face back">
            <span class="f-cz">${esc(card.cz)}</span>
          </div>
        </div>
      </div>`;

    actions.innerHTML = `
      <button class="btn ghost" id="fc-prev" ${fcState.index === 0 ? "disabled" : ""}>← Předchozí</button>
      <button class="btn ${known ? "know" : "ghost"}" id="fc-know">${known ? "✓ Umím" : "Umím"}</button>
      <button class="btn ghost" id="fc-next">Další →</button>
    `;

    progress.textContent = `Karta ${fcState.index + 1} / ${group.cards.length} · umím ${knownCount}/${group.cards.length}`;

    document.getElementById("fc-card").onclick = () => document.getElementById("fc-card").classList.toggle("flipped");
    document.getElementById("fc-know").onclick = (e) => {
      e.stopPropagation();
      setCardKnown(page.id, fcState.group, fcState.index, !known);
      renderFlashcardStage(page);
    };
    document.getElementById("fc-prev").onclick = (e) => {
      e.stopPropagation();
      if (fcState.index > 0) { fcState.index--; renderFlashcardStage(page); }
    };
    document.getElementById("fc-next").onclick = (e) => {
      e.stopPropagation();
      fcState.index = (fcState.index + 1) % group.cards.length;
      renderFlashcardStage(page);
    };
  }

  function wireFlashcards(page) {
    if (!page.flashcardGroups || page.flashcardGroups.length === 0) return;
    document.querySelectorAll("[data-fc-group]").forEach(btn => {
      btn.onclick = () => {
        fcState.group = parseInt(btn.dataset.fcGroup, 10);
        fcState.index = 0;
        document.querySelectorAll("[data-fc-group]").forEach(b => b.classList.remove("primary"));
        document.querySelectorAll("[data-fc-group]").forEach(b => b.classList.add("ghost"));
        btn.classList.add("primary");
        btn.classList.remove("ghost");
        renderFlashcardStage(page);
      };
    });
    renderFlashcardStage(page);
  }

  /* ---------- quiz ---------- */

  function renderQuizSection(page) {
    if (!page.quiz || page.quiz.length === 0) return "";
    return `
      <h2>Cvičení</h2>
      ${page.quiz.map((q, qi) => `
        <div class="quiz-block" data-quiz-index="${qi}">
          <div class="quiz-q-title">${rich(q.q)}</div>
          <ul class="quiz-options">
            ${q.options.map((opt, oi) => `<li><button class="quiz-option" data-opt="${oi}">${rich(opt)}</button></li>`).join("")}
          </ul>
          <div class="quiz-feedback hidden"></div>
        </div>
      `).join("")}
    `;
  }

  function wireQuiz(page) {
    if (!page.quiz || page.quiz.length === 0) return;
    document.querySelectorAll(".quiz-block").forEach(block => {
      const qi = parseInt(block.dataset.quizIndex, 10);
      const q = page.quiz[qi];
      const feedback = block.querySelector(".quiz-feedback");

      if (isQuizCorrect(page.id, qi)) {
        block.querySelectorAll(".quiz-option").forEach((btn, oi) => {
          btn.disabled = true;
          if (oi === q.correct) btn.classList.add("correct");
        });
        feedback.classList.remove("hidden");
        feedback.textContent = q.explain ? q.explain : "Správně!";
      }

      block.querySelectorAll(".quiz-option").forEach(btn => {
        btn.onclick = () => {
          const oi = parseInt(btn.dataset.opt, 10);
          const opts = block.querySelectorAll(".quiz-option");
          opts.forEach(b => b.disabled = true);
          if (oi === q.correct) {
            btn.classList.add("correct");
            setQuizCorrect(page.id, qi);
            feedback.classList.remove("hidden");
            feedback.textContent = q.explain ? q.explain : "Správně!";
            checkAutoComplete(page);
          } else {
            btn.classList.add("incorrect");
            feedback.classList.remove("hidden");
            feedback.textContent = "Zkus to znovu.";
            setTimeout(() => { opts.forEach(b => { b.disabled = false; b.classList.remove("incorrect"); }); }, 900);
          }
        };
      });
    });
  }

  function checkAutoComplete(page) {
    if (allQuizCorrect(page) && !isCompleted(page.id)) {
      setCompleted(page.id, true);
      refreshCompletionUI(page);
      refreshSidebarAndHeader();
    }
  }

  /* ---------- completion banner / button ---------- */

  function renderCompletionArea(page) {
    return `<div id="completion-area"></div>`;
  }

  function refreshCompletionUI(page) {
    const area = document.getElementById("completion-area");
    if (!area) return;
    const done = isCompleted(page.id);
    if (done) {
      area.innerHTML = `
        <div class="lesson-complete-banner">
          ${stampSvg()}
          <span>Lekce dokončena — hanko razítko je tvoje!</span>
        </div>
        <button class="btn ghost" id="toggle-complete">Zrušit dokončení</button>`;
    } else {
      area.innerHTML = `<button class="btn primary" id="toggle-complete">Označit lekci jako hotovou</button>`;
    }
    document.getElementById("toggle-complete").onclick = () => {
      setCompleted(page.id, !done);
      refreshCompletionUI(page);
      refreshSidebarAndHeader();
    };
  }

  /* ---------- sidebar & header ---------- */

  function navItemHtml(page, currentId) {
    const active = page.id === currentId ? "active" : "";
    const done = isCompleted(page.id);
    return `<li class="nav-item ${active}" data-nav-id="${page.id}">
      <a href="#${page.id}">
        <span class="nav-num">${pageLabel(page)}</span>
        <span class="nav-title">${esc(page.title)}</span>
        <span class="nav-stamp">${done ? stampSvg() : ""}</span>
      </a>
    </li>`;
  }

  function buildSidebar(currentId) {
    const sidebar = document.getElementById("sidebar");
    sidebar.innerHTML = `
      <div class="sidebar-section-label">Lekce</div>
      <ul class="nav-list">${COURSE.lessons.map(l => navItemHtml(l, currentId)).join("")}</ul>
      <div class="sidebar-section-label">Přílohy</div>
      <ul class="nav-list">${COURSE.appendices.map(a => navItemHtml(a, currentId)).join("")}</ul>
      <div class="sidebar-section-label">Závěr</div>
      <ul class="nav-list">${navItemHtml(COURSE.outro, currentId)}</ul>
      <div class="sidebar-section-label">&nbsp;</div>
      <div style="padding:0 20px;">
        <button class="btn ghost" id="reset-progress" style="width:100%; font-size:12.5px;">Resetovat postup</button>
      </div>
    `;
    document.querySelectorAll(".nav-item a").forEach(a => {
      a.addEventListener("click", () => closeMobileSidebar());
    });
    document.getElementById("reset-progress").onclick = () => {
      if (confirm("Opravdu chceš smazat veškerý uložený postup (hotové lekce, kvízy, kartičky)? Tahle akce se nedá vzít zpět.")) {
        Object.keys(localStorage).filter(k => k.startsWith(STORE)).forEach(k => localStorage.removeItem(k));
        location.reload();
      }
    };
  }

  function refreshSidebarAndHeader() {
    const currentId = location.hash.slice(1) || COURSE.lessons[0].id;
    document.querySelectorAll(".nav-item").forEach(li => {
      const id = li.dataset.navId;
      const stampSpan = li.querySelector(".nav-stamp");
      stampSpan.innerHTML = isCompleted(id) ? stampSvg() : "";
    });
    updateHeaderProgress();
  }

  function updateHeaderProgress() {
    const total = COURSE.lessons.length;
    const done = COURSE.lessons.filter(l => isCompleted(l.id)).length;
    document.getElementById("progress-text").innerHTML = `<span class="progress-label">Postup: </span><strong>${done} / ${total}</strong>`;
    document.getElementById("progress-dots").innerHTML = COURSE.lessons.map(l =>
      `<span class="stamp-dot ${isCompleted(l.id) ? "done" : ""}"></span>`
    ).join("");
  }

  /* ---------- page render & routing ---------- */

  function renderPage(page) {
    const inner = document.getElementById("content-inner");
    const blocksHtml = page.blocks.map(renderBlock).join("");
    inner.innerHTML = `
      <p class="lesson-eyebrow">${esc(page.eyebrow)}</p>
      <h1 class="lesson-title">${esc(page.title)}</h1>
      ${blocksHtml}
      ${renderFlashcardSection(page)}
      ${renderQuizSection(page)}
      ${renderCompletionArea(page)}
      ${renderFooterNav(page)}
    `;
    wireFlashcards(page);
    wireQuiz(page);
    refreshCompletionUI(page);
    window.scrollTo(0, 0);
  }

  function renderFooterNav(page) {
    const list = allPages();
    const i = list.findIndex(p => p.id === page.id);
    const prev = list[i - 1];
    const next = list[i + 1];
    return `<div class="lesson-footer-nav">
      ${prev ? `<a href="#${prev.id}">← ${esc(prev.title)}</a>` : `<span></span>`}
      <span class="spacer"></span>
      ${next ? `<a href="#${next.id}">${esc(next.title)} →</a>` : `<span></span>`}
    </div>`;
  }

  function route() {
    const id = location.hash.slice(1) || COURSE.lessons[0].id;
    const page = findPage(id) || COURSE.lessons[0];
    buildSidebar(page.id);
    updateHeaderProgress();
    renderPage(page);
  }

  /* ---------- mobile sidebar ---------- */

  function openMobileSidebar() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("scrim").classList.add("show");
  }
  function closeMobileSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("scrim").classList.remove("show");
  }

  /* ---------- boot ---------- */

  function boot() {
    document.getElementById("brand-title").textContent = COURSE.title;
    document.getElementById("brand-sub").textContent = COURSE.subtitle;
    document.getElementById("menu-toggle").onclick = openMobileSidebar;
    document.getElementById("scrim").onclick = closeMobileSidebar;
    window.addEventListener("hashchange", route);
    route();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
