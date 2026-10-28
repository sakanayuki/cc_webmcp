import './styles.css';

const THEME_KEY = 'kikoe-theme';
type Theme = 'light' | 'dark' | 'system';

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    /* storage unavailable: fall back to system */
  }
  return 'system';
}

function applyTheme(theme: Theme): void {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
}

function initTheme(): void {
  applyTheme(readTheme());
  const select = document.querySelector<HTMLSelectElement>('#theme-select');
  if (!select) return;
  select.hidden = false;
  select.value = readTheme();
  select.addEventListener('change', () => {
    const v = select.value as Theme;
    applyTheme(v);
    try {
      if (v === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, v);
    } catch {
      /* ignore */
    }
  });
}

/** Progressive enhancement: filter the static catalog list in place. */
function initCatalogFilter(): void {
  const form = document.querySelector<HTMLFormElement>('#product-search');
  const list = document.querySelector<HTMLElement>('#product-list');
  if (!form || !list) return;
  const status = document.querySelector<HTMLElement>('#search-status');
  const cards = Array.from(list.querySelectorAll<HTMLElement>('[data-product]'));

  const q = form.elements.namedItem('q') as HTMLInputElement;
  const category = form.elements.namedItem('category') as HTMLSelectElement;
  const maxPrice = form.elements.namedItem('maxPrice') as HTMLInputElement;
  const anc = form.elements.namedItem('anc') as HTMLInputElement;
  const inStock = form.elements.namedItem('inStock') as HTMLInputElement;

  const params = new URLSearchParams(location.search);
  q.value = params.get('q') ?? '';
  category.value = params.get('category') ?? '';
  maxPrice.value = params.get('maxPrice') ?? '';
  anc.checked = params.get('anc') === '1';
  inStock.checked = params.get('inStock') === '1';

  function apply(): void {
    const keyword = q.value.trim().toLowerCase();
    const max = Number(maxPrice.value);
    let shown = 0;
    for (const card of cards) {
      const d = card.dataset;
      const ok =
        (!keyword || (d.text ?? '').includes(keyword)) &&
        (!category.value || d.category === category.value) &&
        (!maxPrice.value || (Number.isFinite(max) && Number(d.price) <= max)) &&
        (!anc.checked || d.anc === '1') &&
        (!inStock.checked || d.stock !== '0');
      card.hidden = !ok;
      if (ok) shown += 1;
    }
    if (status) status.textContent = `${shown}件 / 全${cards.length}件`;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (q.value.trim()) next.set('q', q.value.trim());
    if (category.value) next.set('category', category.value);
    if (maxPrice.value) next.set('maxPrice', maxPrice.value);
    if (anc.checked) next.set('anc', '1');
    if (inStock.checked) next.set('inStock', '1');
    const qs = next.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
    apply();
  });
  form.addEventListener('input', () => apply());
  apply();
}

initTheme();
initCatalogFilter();
