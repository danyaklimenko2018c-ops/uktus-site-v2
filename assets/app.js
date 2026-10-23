/* Баден-Баден Термы Уктус — рендер разделов из data.js и интерактив.
   Вся информация берётся из SITE (assets/data.js) — здесь только вывод. */
(() => {
  'use strict';
  const D = window.SITE || SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rub = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
  const set = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };

  const I = {
    tg: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.9 4.3 18.6 19.8c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L5.9 13.3l-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6L20.4 2.8c.9-.3 1.7.2 1.5 1.5z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    kids: ['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="7" r="3"/><path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/></svg>',
           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 20c-2-2-2-4 0-6s2-4 0-6M12 20c-2-2-2-4 0-6s2-4 0-6M16 20c-2-2-2-4 0-6s2-4 0-6"/></svg>',
           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 15c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M2 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M12 3v6M9 6l3 3 3-3"/></svg>'],
  };

  /* ── время в Екатеринбурге (UTC+5) — для «открыто до…» и ближайшего ауфгусса ── */
  function ekb() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Yekaterinburg', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map(x => [x.type, x.value]));
    const dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
    const h = +p.hour, m = +p.minute;
    return { dow, h, m, min: h * 60 + m };
  }
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  /* ── статус «открыто» ─────────────────────────────────────────────── */
  function status() {
    const el = $('#status'); if (!el) return;
    const t = ekb(), C = D.contacts;
    // после полуночи в пт/сб мы ещё «вчерашние» — проверяем вчерашнее закрытие
    const close = C.closeAt[t.dow], prevClose = C.closeAt[(t.dow + 6) % 7];
    const fmt = h => (h === 24 ? '00:00' : String(h).padStart(2, '0') + ':00');
    if (t.h >= C.openAt && t.min < close * 60) {
      el.textContent = `Сегодня открыто до ${fmt(close)}`; el.classList.remove('closed');
    } else if (t.h < C.openAt && prevClose > 24 && t.min < (prevClose - 24) * 60) {
      el.textContent = `Открыто до ${fmt(prevClose - 24)}`; el.classList.remove('closed');
    } else {
      el.textContent = t.h < C.openAt ? `Откроемся сегодня в ${fmt(C.openAt)}` : `Откроемся завтра в ${fmt(C.openAt)}`;
      el.classList.add('closed');
    }
  }

  /* ── вкладки (общий механизм) ─────────────────────────────────────── */
  function tabs(list, onChange) {
    const btns = $$('[role="tab"]', list);
    const pick = (b, focus) => {
      btns.forEach(x => {
        const on = x === b;
        x.setAttribute('aria-selected', on);
        x.tabIndex = on ? 0 : -1;
        const p = x.getAttribute('aria-controls') && document.getElementById(x.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (focus) b.focus();
      onChange && onChange(b);
    };
    btns.forEach((b, i) => {
      b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1;
      b.addEventListener('click', () => pick(b));
      b.addEventListener('keydown', e => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); pick(btns[(i + d + btns.length) % btns.length], true); }
      });
    });
    return pick;
  }

  /* ══ 01 ТЕРМЫ ══════════════════════════════════════════════════════ */
  function renderTermy() {
    const T = D.termy;
    set('#termy-facts', T.facts.map(f => `<div class="fact"><b>${esc(f.n)}</b><span>${esc(f.t)}</span></div>`).join(''));

    const today = ekb().dow, todayIdx = today === 6 ? 1 : today === 0 ? 2 : 0;
    const cols = ['2 часа', '3 часа', 'Безлимит'];
    set('#tariff-table', `
      <thead><tr><th></th>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      ${T.tariffs.map((r, i) => `
      <tbody class="day${i === todayIdx ? ' today' : ''}">
        <tr class="dayname"><th colspan="4">${esc(r.day)}${r.sub ? ` <small>${esc(r.sub)}</small>` : ''}</th></tr>
        <tr><th class="cat">Общий</th>${r.general.map((x, j) => `<td data-l="${cols[j]}">${rub(x)}</td>`).join('')}</tr>
        <tr><th class="cat">Льготный</th>${r.lgot.map((x, j) => `<td data-l="${cols[j]}">${rub(x)}</td>`).join('')}</tr>
      </tbody>`).join('')}`);
    set('#lgot-who', `<b>Льготный тариф:</b> ${esc(T.lgotWho)}. ${esc(T.kidsFree)}`);
    set('#termy-included', esc(T.included));
    set('#termy-rent', T.rent.map(r => `<div class="kv"><span>${esc(r.n)}</span><b>${esc(r.p)}</b></div>`).join(''));
    set('#termy-bring', `<b>Что взять с собой:</b> ${esc(T.bring)}`);

    set('#promo-grid', T.promos.map(p => `
      <article class="card promo">
        <div class="promo-top"><span class="tag">${esc(p.tag)}</span><span class="price">${esc(p.price)}</span></div>
        <h3>${esc(p.name)}</h3>
        <div class="when">${esc(p.when)}</div>
        <p>${esc(p.text)}</p>
      </article>`).join(''));

    set('#passes', `
      <div class="passes-head"><h3 class="sub-h">Абонементы</h3><p class="muted small">${esc(T.passesNote)}</p></div>
      ${T.passes.map(x => `<div class="pass card"><b>${esc(x.name)}</b>
        <div class="kv"><span>Взрослый</span><b>${rub(x.adult)}</b></div>
        <div class="kv"><span>Детский, 4–12 лет</span><b>${rub(x.kid)}</b></div></div>`).join('')}`);

    const L = T.loyalty;
    const rules = (D.docs.flatMap(g => g.d).find(x => /лояльност/i.test(x.t)) || {}).u;
    set('#loyal', `
      <div class="loyal-hero">
        <div>
          <span class="tag">Программа лояльности Baden Uktus</span>
          <h3>Скидка растёт <em>с каждым визитом</em></h3>
          <p class="muted">${esc(L.reset)}. Вступить можно бесплатно.</p>
        </div>
        <a class="btn btn-warm" href="${esc(L.bot)}" target="_blank" rel="noopener">${I.tg}Вступить в ${esc(L.botName)}</a>
      </div>
      <ol class="ladder" aria-label="Скидка по номеру визита в месяце">
        ${L.tiers.map((t, i) => `<li style="--i:${i}"><span class="pct">−${t.pct}%</span><span class="v">${esc(t.visit)}</span><i aria-hidden="true"></i></li>`).join('')}
      </ol>
      <div class="loyal-grid">
        <div class="card"><h4 class="sub-h">Как вступить</h4>
          ${L.join.map((j, i) => `<div class="step"><span class="n">${i + 1}</span><div><b>${esc(j.how)}</b><p>${esc(j.text)}</p></div></div>`).join('')}
        </div>
        <div class="card"><h4 class="sub-h">Важно знать</h4>
          <ul class="ticks">${L.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
          <p class="note">${esc(L.survey)}</p>
        </div>
      </div>
      <div class="loyal-foot">
        <a href="#termy" data-open-tab="tb-calc" class="btn btn-line btn-sm">Посчитать билет со скидкой</a>
        ${rules ? `<a href="${esc(rules)}" target="_blank" rel="noopener" class="small">Полные правила программы (PDF) →</a>` : ''}
      </div>`);

    set('#sauna-grid', T.saunas.map(s => `
      <article class="card sauna">
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.text)}</p>
        <div class="gauges">
          <div class="gauge"><span>Темп. <b>${s.t}°</b></span><i style="--v:${Math.round(s.t / 100 * 100)}%"></i></div>
          <div class="gauge hum"><span>Влажн. <b>${s.h}%</b></span><i style="--v:${s.h}%"></i></div>
        </div>
      </article>`).join(''));

    // Расписание ауфгуссов строится из саун — отдельного списка нет
    const slots = T.saunas.flatMap(s => (s.aufguss || []).map(time => ({ time, sauna: s.name, kids: (s.kids || []).includes(time) })))
      .sort((a, b) => toMin(a.time) - toMin(b.time));
    set('#aufguss-note', `${slots.length} сеансов в день. ${esc(T.aufgussNote)}`);
    const rail = $('#aufguss-rail');
    const draw = mode => {
      const t = ekb();
      const live = (mode === 'sat') === (t.dow === 6);      // подсветка только для «сегодняшнего» режима
      let nextDone = false;
      rail.innerHTML = slots.map(s => {
        const show = mode === 'sat' && T.aufgussShows.find(x => x.time === s.time);
        let cls = 'slot';
        if (show) cls += ' show';
        if (live) {
          if (toMin(s.time) + 15 <= t.min) cls += ' past';
          else if (!nextDone && t.h >= 9) { cls += ' next'; nextDone = true; }
        }
        return `<div class="${cls}"><time>${s.time}</time>
          <b>${show ? '«' + esc(show.name) + '»' : 'Парение'}</b>
          <small>${esc(s.sauna)}${show ? ' · авторское' : ''}</small>
          ${s.kids && !show ? '<span class="kid">детское</span>' : ''}</div>`;
      }).join('');
      const nx = $('.slot.next', rail);
      if (nx) rail.scrollTo({ left: nx.offsetLeft - rail.offsetLeft - 8, behavior: 'smooth' });
    };
    $$('#t-bath .seg button').forEach(b => b.addEventListener('click', () => {
      $$('#t-bath .seg button').forEach(x => x.setAttribute('aria-pressed', x === b));
      draw(b.dataset.day);
    }));
    const isSat = ekb().dow === 6;
    if (isSat) $$('#t-bath .seg button').forEach(x => x.setAttribute('aria-pressed', x.dataset.day === 'sat'));
    draw(isSat ? 'sat' : 'usual');

    set('#pool-list', T.pools.map((p, i) => `
      <div class="pool"><span class="dot">${i + 1}</span><div>
        <h3>${esc(p.name)}</h3><div class="spec">${esc(p.spec)}</div><p>${esc(p.text)}</p></div></div>`).join(''));
    set('#water-note', `<b>Вода.</b> ${esc(T.water)}`);
  }

  /* ── калькулятор: считает все подходящие варианты и берёт самый выгодный
        (акции не суммируются) ──────────────────────────────────────────── */
  function calc() {
    const f = $('#calc'); if (!f) return;
    const v = {
      day: f.day.value, time: f.time.value, hours: f.hours.value, cat: f.cat.value,
      adults: +f.adults.value, kids: +f.kids.value, bday: f.bday.checked, student: f.student.checked, loyal: +f.loyal.value,
    };
    const T = D.termy.tariffs, row = v.day === 'saturday' ? T[1] : v.day === 'sunday' ? T[2] : T[0];
    const idx = { 2: 0, 3: 1, u: 2 }[v.hours], unlim = v.hours === 'u';
    const aP = row[v.cat][idx], kP = row.lgot[idx];
    const weekday = v.day === 'weekday' || v.day === 'wednesday';
    const people = v.adults + v.kids;
    const base = v.adults * aP + v.kids * kP;

    const opts = [{ name: 'Без скидок', sum: base, info: `${v.adults} взр. × ${rub(aP)}` + (v.kids ? ` + ${v.kids} дет. × ${rub(kP)}` : '') }];
    if (people) {
      if (weekday && v.time === 'late')
        opts.push({ name: '«Ещё не поздно»', sum: people * 1500, info: `${people} × 1 500 ₽, с 20:45 до закрытия` });
      if (v.adults >= 2 && v.hours === '3' && v.cat === 'general' && v.kids > 0)
        opts.push({ name: '«Семья»', sum: base - kP, info: 'один ребёнок до 12 лет — бесплатно' });
      if (weekday && ['morning', 'day'].includes(v.time) && v.adults === 1 && v.kids === 1)
        opts.push({ name: '«Мать и дитя» −20%', sum: Math.round((row.general[idx] + kP) * .8), info: 'будни 9:00–17:00, взрослый по общему прайсу' });
      if (v.bday && !unlim)
        opts.push({ name: '«Именинник» −10%', sum: Math.round(base * .9), info: 'кроме безлимита, по документу' });
      if (v.student && v.day === 'wednesday' && ['morning', 'day'].includes(v.time))
        opts.push({ name: '«Студенческая среда» −20%', sum: Math.round(base * .8), info: 'до 19:00, по студенческому' });
      if (v.loyal && v.adults > 0) {
        const off = Math.round((aP + (v.kids ? kP : 0)) * v.loyal / 100);
        opts.push({ name: `Карта лояльности −${v.loyal}%`, sum: base - off, info: v.kids ? 'на билет участника и одного ребёнка' : 'на билет участника программы' });
      }
    }
    const best = opts.reduce((a, b) => (b.sum < a.sum ? b : a));
    $('#calc-sum').innerHTML = people ? rub(best.sum) + (best.sum < base ? `<span class="old">${rub(base)}</span>` : '') : '—';
    $('#calc-line').textContent = people ? (best === opts[0] ? opts[0].info : best.info) : 'Добавьте гостей';
    $('#calc-applied').innerHTML = (opts.length > 1
      ? opts.slice(1).sort((a, b) => a.sum - b.sum).map(o => `<div class="${o === best ? 'best' : ''}">${o === best ? '✓ ' : ''}${esc(o.name)} — ${rub(o.sum)}</div>`).join('')
      : '<div>Для этих условий акций нет.</div>')
      + '<div class="fine">Скидки не суммируются — выбран самый выгодный вариант. В праздничные дни акции не действуют. Дети до 4 лет — бесплатно.</div>';
  }
  function initCalc() {
    const f = $('#calc'); if (!f) return;
    f.addEventListener('input', calc);
    f.addEventListener('change', calc);
    $$('[data-step]', f).forEach(b => b.addEventListener('click', () => {
      const [k, d] = b.dataset.step.split(':');
      const o = f[k], lim = k === 'adults' ? [0, 20] : [0, 20];
      o.value = Math.min(lim[1], Math.max(lim[0], +o.value + +d));
      calc();
    }));
    calc();
  }

  /* ══ 02 СПА ════════════════════════════════════════════════════════ */
  function renderSpa() {
    const S = D.spa;
    set('#spa-pkgs', S.packages.map(p => `
      <article class="card pkg"><h3>${esc(p.name)}</h3><div class="dur">${p.min} минут · вход без очереди</div>
        <p>${esc(p.text)}</p><div class="price">${rub(p.price)}</div></article>`).join(''));
    set('#spa-pkgs-note', esc(S.packagesNote));
    const ph = $('#spa-phone'); ph.textContent = S.phone; ph.href = S.phoneHref;
    set('#spa-resident', esc(S.residentDiscount));
    set('#spa-rules', esc(S.rules));
    set('#spa-acc', S.groups.map((g, i) => `
      <details${i === 0 ? ' open' : ''}>
        <summary><h3>${esc(g.name)}<span class="cnt">${g.items.length}</span></h3><span class="pm" aria-hidden="true"></span></summary>
        <div class="rows">
          ${g.items.map(it => `<div class="svc"><span class="n">${esc(it.n)}</span><span class="ps">${it.p.map(([m, r]) => `<span>${m ? `<i>${m} мин</i>` : ''}${rub(r)}</span>`).join('')}</span></div>`).join('')}
          ${g.note ? `<p class="note">${esc(g.note)}</p>` : ''}
        </div>
      </details>`).join(''));
  }

  /* ══ 03 КАФЕ И БАРЫ ════════════════════════════════════════════════ */
  function renderFood() {
    const F = D.food, M = D.menu;
    const venues = $('#venues');
    venues.innerHTML = F.venues.map((v, i) => `
      <button class="venue" role="tab" aria-selected="${i === 0}" data-v="${v.id}">
        <b>${esc(v.name)}</b><small>${esc(v.where)}</small></button>`).join('');

    const showCat = (vid, ci) => {
      const cat = M[vid][ci];
      $$('#cats .cat').forEach((b, j) => b.setAttribute('aria-selected', j === ci));
      if (cat.breakfast) {
        const B = F.breakfast;
        $('#menu-out').innerHTML = `
          <p class="muted" style="margin-bottom:14px"><b style="color:var(--ink)">${rub(B.price)}</b> · ${esc(B.time)} · ${esc(B.drink)}</p>
          <div class="bfast">${B.sets.map(s => `<div class="card"><h4>${esc(s.n)}<span>${esc(s.w)}</span></h4><p>${esc(s.d)}</p></div>`).join('')}</div>
          <p class="note">${esc(B.note)}</p>`;
        return;
      }
      $('#menu-out').innerHTML = `<div class="menu">${cat.i.map(d => `
        <div class="dish"><span class="n">${esc(d.n)}</span><span class="p">${esc(d.p)}</span>
          ${d.s ? `<span class="s">${esc(d.s)}</span>` : ''}${d.w ? `<span class="w">${esc(d.w)}</span>` : ''}</div>`).join('')}</div>`;
    };
    const showVenue = vid => {
      const v = F.venues.find(x => x.id === vid);
      $$('#venues .venue').forEach(b => b.setAttribute('aria-selected', b.dataset.v === vid));
      set('#venue-about', esc(v.text));
      $('#cats').innerHTML = M[vid].map((c, j) => `<button class="cat" role="tab" aria-selected="${j === 0}" data-c="${j}">${esc(c.c)}</button>`).join('');
      $$('#cats .cat').forEach(b => b.addEventListener('click', () => showCat(vid, +b.dataset.c)));
      showCat(vid, 0);
    };
    $$('#venues .venue').forEach(b => b.addEventListener('click', () => showVenue(b.dataset.v)));
    showVenue(F.venues[0].id);

    const o = F.offers[0];
    set('#food-offer', `
      <article class="card offer">
        <div><span class="tag">${esc(o.when)}</span><h3>${esc(o.name)}</h3><p>${esc(o.text)}</p></div>
        <div></div>
        <div class="price">${esc(o.price)}<small>${esc(o.for)}</small></div>
      </article>`);
  }

  /* ══ 04 АНИМАЦИЯ ═══════════════════════════════════════════════════ */
  function renderAnim() {
    const A = D.anim;
    set('#kids-list', A.kids.map((k, i) => `
      <div class="kid-item"><span class="ic">${I.kids[i % 3]}</span><div><h3>${esc(k.name)}</h3><p>${esc(k.text)}</p></div></div>`).join(''));
    const sh = A.shows;
    set('#anim-row', `
      <article class="card show-card">
        <h3>${esc(sh.title)}</h3><p>${esc(sh.text)}</p>
        <div class="show-list">${sh.list.map(x => `<span>${esc(x)}</span>`).join('')}</div>
        <a href="#termy" data-open-tab="tb-bath">Смотреть расписание →</a>
      </article>
      ${A.programs.map(p => `
      <article class="card prog">
        <h3>${esc(p.name)}</h3><div class="meta">${esc(p.meta)}</div>
        <ul>${p.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <div class="prog-foot"><span class="muted small">${esc(p.unit || 'стоимость')}</span><span class="price">${esc(p.price)}</span></div>
      </article>`).join('')}`);
    set('#anim-groups', `
      <div><b>${esc(A.groups.text)}</b><div class="muted small">Подберём программу, рассчитаем стоимость</div></div>
      <a class="btn btn-warm" href="${esc(A.groups.href)}">${esc(A.groups.phone)}</a>`);
  }

  /* ══ 05 ПРОЖИВАНИЕ ═════════════════════════════════════════════════ */
  function renderStay() {
    const S = D.stay;
    set('#stay-incl', S.included.map(x => `<div>${I.check}<span>${esc(x)}</span></div>`).join(''));
    set('#homes', S.types.map(t => `
      <article class="card home">
        <figure><img src="img/${esc(t.img)}" alt="${esc(t.name)}" loading="lazy">${t.badge ? `<span class="badge">${esc(t.badge)}</span>` : ''}</figure>
        <div class="body">
          <h3>${esc(t.name)}</h3><p>${esc(t.text)}</p>
          <dl><dt>Гостей</dt><dt>Заезд</dt><dt>Выезд</dt>
              <dd>${esc(t.guests)}</dd><dd>${esc(t.checkin)}</dd><dd>${esc(t.checkout)}</dd></dl>
        </div>
      </article>`).join(''));
    set('#stay-promos', `
      <h3 class="sub-h">Акции на проживание</h3>
      <div class="grid g4">${S.promos.map(x => `
        <article class="card promo"><div class="promo-top"><h3>${esc(x.name)}</h3><span class="price">${esc(x.pct)}</span></div>
          <p>${esc(x.text)}</p></article>`).join('')}</div>
      <p class="note">Акции не суммируются, не действуют в праздничные дни и не распространяются на дополнительные места.</p>`);
    set('#extra-bed', S.extraBed.map(r => `<div class="kv"><span>${esc(r.n)}</span><b>${esc(r.p)}</b></div>`).join(''));
    set('#extra-note', esc(S.extraBedNote));
    set('#stay-deposit', esc(S.deposit));
    set('#stay-pets', `${esc(S.pets)} <a href="#docs">Правила проживания</a>`);
    set('#stay-phones', S.phones.map(p => `<div class="phone-line"><span>${esc(p.label)}</span><a href="${esc(p.href)}">${esc(p.value)}</a></div>`).join(''));
    const fb = $('#tl-fallback'); fb.href = S.bookingUrl;
  }

  // TravelLine: грузим только когда блок бронирования рядом с экраном
  function travelline() {
    const box = $('#tl-box'), cfg = D.stay.travelline;
    if (!box) return;
    let started = false;
    const start = () => {
      if (started) return; started = true;
      (function (w) {
        const q = [['setContext', cfg.context, cfg.lang], ['embed', 'booking-form', { container: 'tl-booking-form' }]];
        const h = ['ru-ibe.tlintegration.ru', 'ibe.tlintegration.ru', 'ibe.tlintegration.com'];
        const t = w.travelline = (w.travelline || {}), ti = t.integration = (t.integration || {});
        ti.__cq = ti.__cq ? ti.__cq.concat(q) : q;
        if (!ti.__loader) {
          ti.__loader = true;
          const d = w.document, c = d.head || d.body;
          const e = (s, f) => () => { w.TL || (c.removeChild(s), f()); };
          (function l(h) {
            if (!h.length) return;
            const s = d.createElement('script'); s.async = true; s.src = 'https://' + h[0] + '/integration/loader.js';
            s.onerror = s.onload = e(s, () => l(h.slice(1))); c.appendChild(s);
          })(h);
        }
      })(window);
      // если за 10 секунд форма не появилась (например, домен не разрешён в TravelLine) — даём ссылку
      setTimeout(() => {
        if (!$('#tl-booking-form').children.length) { box.classList.add('failed'); $('#tl-fail').classList.add('on'); }
      }, 10000);
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { start(); io.disconnect(); } }, { rootMargin: '600px 0px' });
      io.observe(box);
    } else start();
    if (location.hash === '#stay-book' || location.hash === '#stay') start();
  }

  /* ══ 06 ОБЩАЯ ИНФОРМАЦИЯ ═══════════════════════════════════════════ */
  function renderInfo() {
    const C = D.contacts;
    set('#addr', esc(C.address));
    set('#place', esc(C.place));
    const hoursHTML = C.hours.map(h => `<div><span>${esc(h.days)}</span><span>${esc(h.time)}</span></div>`).join('');
    set('#hours', hoursHTML);
    $('#map-y').href = C.maps.yandex; $('#map-g').href = C.maps.gis;
    set('#contact-lines', C.lines.map(l => `<div class="phone-line"><span>${esc(l.label)}</span><a href="${esc(l.href)}"${l.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(l.value)}</a></div>`).join(''));

    set('#faq', D.faq.map(f => `
      <details><summary><p>${esc(f.q)}</p><span class="pm" aria-hidden="true"></span></summary>
        <div class="rows"><p>${esc(f.a)}</p><a href="#${esc(f.to)}"${f.to === 'termy' ? ' data-open-tab="' + ({ 'Бассейны': 'tb-pools', 'Карта лояльности': 'tb-loyal' }[f.tl] || 'tb-price') + '"' : ''}>${esc(f.tl)} →</a></div></details>`).join(''));

    const G = D.gift;
    set('#gift', `<div><h3>Подарочные сертификаты</h3><p class="muted small">${esc(G.text)} ${esc(G.online)}.</p></div>
      <a class="btn btn-warm" href="${esc(G.url)}" target="_blank" rel="noopener">Купить сертификат</a>`);

    set('#docs-grid', D.docs.map(g => `
      <div class="card doc-g"><h3>${esc(g.g)}</h3>
        ${g.d.map(x => `<a href="${esc(x.u)}" target="_blank" rel="noopener">${I.doc}<span>${esc(x.t)}</span></a>`).join('')}</div>`).join(''));

    // подвал
    const ft = $('#foot-tel'); ft.textContent = C.phone; ft.href = 'tel:' + C.phone.replace(/[^\d+]/g, '');
    set('#foot-addr', esc(C.address));
    set('#foot-hours', C.hours.map(h => `<li>${esc(h.days)} · ${esc(h.time)}</li>`).join(''));
    $('#foot-official').href = C.official;
  }

  /* ── шапка, навигация, появление ─────────────────────────────────── */
  function chrome() {
    const top = $('#top'), hero = $('#hero');
    const solid = () => top.classList.toggle('solid', window.scrollY > hero.offsetHeight - 120);
    solid(); window.addEventListener('scroll', solid, { passive: true });

    const links = $$('.nav a, .chips a');
    const secs = ['termy', 'spa', 'food', 'anim', 'stay', 'info'].map(id => document.getElementById(id));
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
        const chip = $('.chips a.on'); if (chip) chip.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => s && io.observe(s));

    // ссылки, которые открывают нужную вкладку в «Термах»
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-open-tab]'); if (!a) return;
      const b = document.getElementById(a.dataset.openTab); if (b) b.click();
    });

    const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach(el => rv.observe(el));

    $('#theme').addEventListener('click', () => {
      const r = document.documentElement;
      const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      r.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('uktus-theme', r.dataset.theme); } catch (e) {}
    });
  }

  /* ── запуск ─────────────────────────────────────────────────────── */
  renderTermy(); renderSpa(); renderFood(); renderAnim(); renderStay(); renderInfo();
  $$('[data-tabs]').forEach(l => tabs(l));
  initCalc(); status(); setInterval(status, 60000);
  chrome(); travelline();
})();
