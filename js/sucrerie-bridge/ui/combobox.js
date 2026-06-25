/**
 * combobox.js — Combobox cherchable réutilisable pour les <select> du pont.
 *
 * Portage autonome de Sucrerie (assets/js/ui/filter-combobox.js) : même UX que le
 * filtre Explorer (déclencheur + popup recherche optionnelle + listbox, support
 * des <optgroup> pour les pôles), mais sans dépendance à l'hôte — la traduction
 * est injectée via `tr`. Amélioration progressive : le <select> natif RESTE dans
 * le DOM (état + events 'change' + repli sans JS) ; on le masque et on monte un
 * déclencheur + une popup. Choisir une option écrit `select.value` puis dispatch
 * un 'change' → la tuyauterie existante du pont s'exécute inchangée.
 *
 * Classes namespacées `sucrerie-bridge__combobox*` (styles dans styles.css) pour
 * ne pas entrer en conflit avec l'hôte Caramel/aManDe.
 */

const SEARCH_THRESHOLD = 8;
let uidCounter = 0;

/** Normalise pour la recherche : minuscules + suppression des diacritiques. Pur. */
export function normalizeForSearch(s) {
  return String(s == null ? '' : s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Vrai si `label` matche `query` (sous-chaîne, insensible casse/accents). Requête vide → vrai. Pur. */
export function optionMatches(label, query) {
  const q = normalizeForSearch(query);
  if (!q) return true;
  return normalizeForSearch(label).includes(q);
}

/**
 * Améliore un <select> en combobox cherchable.
 * @param {HTMLSelectElement} nativeSelect
 * @param {object} opts
 * @param {function} opts.tr - fonction de traduction (clé → texte)
 * @param {boolean|'auto'} [opts.searchable='auto']
 * @param {string} [opts.searchPlaceholderKey='sucrerie_bridge_combobox_search']
 * @param {string} [opts.noResultKey='sucrerie_bridge_combobox_no_result']
 * @returns {{sync:Function, open:Function, close:Function, wrapper:HTMLElement}|null}
 */
export function enhanceBridgeSelect(nativeSelect, opts = {}) {
  if (!nativeSelect || nativeSelect.dataset.comboboxEnhanced) return null;

  const tr = typeof opts.tr === 'function' ? opts.tr : (k) => k;
  const uid = `sucrerie-bridge-combobox-${++uidCounter}`;
  const listboxId = `${uid}-listbox`;
  const searchPlaceholderKey = opts.searchPlaceholderKey || 'sucrerie_bridge_combobox_search';
  const noResultKey = opts.noResultKey || 'sucrerie_bridge_combobox_no_result';

  const selectableCount = Array.from(nativeSelect.querySelectorAll('option')).filter(o => o.value !== '').length;
  let searchable = opts.searchable;
  if (searchable == null || searchable === 'auto') searchable = selectableCount >= SEARCH_THRESHOLD;

  let activeId = null;

  const wrapper = document.createElement('div');
  wrapper.className = 'sucrerie-bridge__combobox';
  nativeSelect.parentNode.insertBefore(wrapper, nativeSelect);
  wrapper.appendChild(nativeSelect);
  nativeSelect.classList.add('sucrerie-bridge__combobox-native');
  nativeSelect.setAttribute('tabindex', '-1');
  nativeSelect.setAttribute('aria-hidden', 'true');
  nativeSelect.dataset.comboboxEnhanced = '1';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'sucrerie-bridge__combobox-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  const labelSpan = document.createElement('span');
  labelSpan.className = 'sucrerie-bridge__combobox-trigger-label';
  trigger.appendChild(labelSpan);
  wrapper.appendChild(trigger);

  const popup = document.createElement('div');
  popup.className = 'sucrerie-bridge__combobox-popup';
  popup.hidden = true;

  let searchInput = null;
  if (searchable) {
    searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'sucrerie-bridge__combobox-search';
    searchInput.setAttribute('role', 'combobox');
    searchInput.setAttribute('aria-autocomplete', 'list');
    searchInput.setAttribute('aria-expanded', 'true');
    searchInput.setAttribute('aria-controls', listboxId);
    searchInput.setAttribute('autocomplete', 'off');
    searchInput.setAttribute('spellcheck', 'false');
    popup.appendChild(searchInput);
  }

  const listbox = document.createElement('ul');
  listbox.className = 'sucrerie-bridge__combobox-list';
  listbox.id = listboxId;
  listbox.setAttribute('role', 'listbox');
  if (!searchable) listbox.setAttribute('tabindex', '-1');
  popup.appendChild(listbox);

  const noResultEl = document.createElement('p');
  noResultEl.className = 'sucrerie-bridge__combobox-no-result';
  noResultEl.hidden = true;
  popup.appendChild(noResultEl);

  wrapper.appendChild(popup);

  const focusEl = () => (searchable ? searchInput : listbox);

  function makeOption(value, label, selected) {
    const li = document.createElement('li');
    li.id = `${uid}-opt-${value || 'all'}`;
    li.className = 'sucrerie-bridge__combobox-option';
    li.setAttribute('role', 'option');
    li.dataset.value = value;
    li.textContent = label;
    if (selected) li.setAttribute('aria-selected', 'true');
    return li;
  }

  function renderList(query = '') {
    listbox.innerHTML = '';
    let count = 0, firstId = null;
    const add = (value, label, selected) => {
      const li = makeOption(value, label, selected);
      listbox.appendChild(li);
      count++;
      if (firstId === null) firstId = li.id;
    };
    for (const node of nativeSelect.children) {
      if (node.tagName === 'OPTGROUP') {
        const matching = Array.from(node.children).filter(o => optionMatches(o.textContent, query));
        if (!matching.length) continue;
        const header = document.createElement('li');
        header.className = 'sucrerie-bridge__combobox-group';
        header.setAttribute('role', 'presentation');
        header.textContent = node.label;
        listbox.appendChild(header);
        for (const o of matching) add(o.value, o.textContent, o.value === nativeSelect.value);
      } else if (node.tagName === 'OPTION') {
        if (!optionMatches(node.textContent, query)) continue;
        add(node.value, node.textContent, node.value === nativeSelect.value);
      }
    }
    noResultEl.hidden = count > 0;
    const sel = listbox.querySelector('[aria-selected="true"]');
    setActive(sel ? sel.id : firstId);
  }

  function optionEls() { return Array.from(listbox.querySelectorAll('.sucrerie-bridge__combobox-option')); }

  function setActive(id) {
    activeId = id;
    for (const el of optionEls()) {
      const on = el.id === id;
      el.classList.toggle('is-active', on);
      if (on) { focusEl().setAttribute('aria-activedescendant', id); el.scrollIntoView({ block: 'nearest' }); }
    }
    if (!id) focusEl().removeAttribute('aria-activedescendant');
  }

  function moveActive(delta) {
    const els = optionEls();
    if (!els.length) return;
    let i = els.findIndex(e => e.id === activeId) + delta;
    if (i < 0) i = els.length - 1;
    if (i >= els.length) i = 0;
    setActive(els[i].id);
  }

  const isOpen = () => wrapper.classList.contains('is-open');

  function open() {
    if (isOpen() || nativeSelect.disabled) return;
    window.dispatchEvent(new CustomEvent('sucrerie-bridge:combobox-open', { detail: { uid } }));
    renderList('');
    wrapper.classList.add('is-open');
    popup.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    if (searchInput) searchInput.value = '';
    focusEl().focus();
  }

  function close({ restoreFocus = false } = {}) {
    if (!isOpen()) return;
    wrapper.classList.remove('is-open');
    popup.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus();
  }

  function choose(value) {
    if (nativeSelect.value !== value) {
      nativeSelect.value = value;
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    sync();
    close({ restoreFocus: true });
  }

  function currentLabel() {
    const opt = nativeSelect.options[nativeSelect.selectedIndex] || nativeSelect.options[0];
    return opt ? opt.textContent : '';
  }

  function sync() {
    labelSpan.textContent = currentLabel();
    trigger.classList.toggle('has-value', !!nativeSelect.value);
    trigger.disabled = nativeSelect.disabled;
    const al = nativeSelect.getAttribute('aria-label');
    if (al) trigger.setAttribute('aria-label', al);
    if (searchInput) searchInput.placeholder = tr(searchPlaceholderKey);
    noResultEl.textContent = tr(noResultKey);
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen() ? close({ restoreFocus: true }) : open();
  });
  trigger.addEventListener('keydown', (e) => {
    if ((e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') && !isOpen()) {
      e.preventDefault();
      open();
    }
  });

  if (searchInput) searchInput.addEventListener('input', () => renderList(searchInput.value));

  focusEl().addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); moveActive(1); break;
      case 'ArrowUp':   e.preventDefault(); moveActive(-1); break;
      case 'Home':      e.preventDefault(); { const els = optionEls(); if (els.length) setActive(els[0].id); } break;
      case 'End':       e.preventDefault(); { const els = optionEls(); if (els.length) setActive(els[els.length - 1].id); } break;
      case 'Enter': {
        e.preventDefault();
        const a = activeId && document.getElementById(activeId);
        if (a) choose(a.dataset.value);
        break;
      }
      case 'Escape': e.preventDefault(); close({ restoreFocus: true }); break;
      case 'Tab': close(); break;
      default: break;
    }
  });

  listbox.addEventListener('mousedown', (e) => {
    const li = e.target.closest('.sucrerie-bridge__combobox-option');
    if (!li) return;
    e.preventDefault();
    choose(li.dataset.value);
  });
  listbox.addEventListener('mousemove', (e) => {
    const li = e.target.closest('.sucrerie-bridge__combobox-option');
    if (li && li.id !== activeId) setActive(li.id);
  });

  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    if (wrapper.contains(e.target)) return;
    close();
  });

  window.addEventListener('sucrerie-bridge:combobox-open', (e) => {
    if (e.detail?.uid !== uid && isOpen()) close();
  });

  sync();
  return { sync, open, close, wrapper };
}
