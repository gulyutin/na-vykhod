import { CATEGORIES, recommendOutfit, summarizeForecast, weatherLabel } from './logic.mjs';

const ROUTE_PLACE = Object.freeze({
  name: 'Караульная гора · часовня',
  latitude: 56.023605,
  longitude: 92.859616,
  route: true,
});
const WARDROBE_KEY = 'na-vykhod:wardrobe:v1';
const PLACE_KEY = 'na-vykhod:place:v1';
const ACTIVITY_KEY = 'na-vykhod:activity:v1';
const WEATHER_KEY = 'na-vykhod:weather:v1';
const CATEGORIES_SET = new Set(Object.keys(CATEGORIES));
const $ = id => document.getElementById(id);
const storage = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
};

const examples = [
  { name: 'Лёгкая спортивная футболка', category: 'base-top', warmth: 1 },
  { name: 'Термолонгслив', category: 'base-top', warmth: 3 },
  { name: 'Тонкий флис', category: 'mid-top', warmth: 2 },
  { name: 'Мембранная куртка', category: 'shell', warmth: 1, windproof: true, waterproof: true },
  { name: 'Ветровка', category: 'shell', warmth: 1, windproof: true },
  { name: 'Лёгкие тайтсы', category: 'bottom', warmth: 1 },
  { name: 'Тёплые тайтсы', category: 'bottom', warmth: 3 },
  { name: 'Беговые кроссовки', category: 'shoes', warmth: 1, activities: ['run'] },
  { name: 'Треккинговые кроссовки', category: 'shoes', warmth: 2, activities: ['hike'] },
  { name: 'Тонкая шапка', category: 'head', warmth: 2 },
  { name: 'Тонкие перчатки', category: 'hands', warmth: 1 },
  { name: 'Бафф', category: 'neck', warmth: 1 },
];

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function normalizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name ?? '').trim().slice(0, 80);
  if (!name || !CATEGORIES_SET.has(raw.category)) return null;
  const warmth = Math.min(3, Math.max(1, Math.round(Number(raw.warmth) || 1)));
  const activities = Array.isArray(raw.activities)
    ? raw.activities.filter(x => x === 'run' || x === 'hike')
    : ['run', 'hike'];
  return {
    id: String(raw.id || makeId()), name, category: raw.category, warmth,
    windproof: Boolean(raw.windproof), waterproof: Boolean(raw.waterproof),
    activities: activities.length ? [...new Set(activities)] : ['run', 'hike'],
    notes: String(raw.notes ?? '').trim().slice(0, 240),
    demo: Boolean(raw.demo),
  };
}

const savedItems = storage.get(WARDROBE_KEY);
const savedPlace = storage.get(PLACE_KEY);
const state = {
  wardrobe: Array.isArray(savedItems) ? savedItems.map(normalizeItem).filter(Boolean) : [],
  place: savedPlace && Number.isFinite(Number(savedPlace.latitude)) && Number.isFinite(Number(savedPlace.longitude))
    ? savedPlace : { ...ROUTE_PLACE },
  activity: storage.get(ACTIVITY_KEY) === 'run' ? 'run' : 'hike',
  forecast: null,
  fetchedAt: null,
  fromCache: false,
  selectedStart: null,
};

function setMessage(id, message, kind = '') {
  const element = $(id);
  if (!element) return;
  element.textContent = message;
  element.dataset.kind = kind;
}
function formatNumber(n, digits = 0) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(n);
}
function temp(n) {
  return `${n > 0 ? '+' : ''}${formatNumber(Math.round(n))}°`;
}
function formatTime(epoch, options = {}) {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: state.forecast?.timezone || 'Asia/Krasnoyarsk',
    hour: '2-digit', minute: '2-digit', ...options,
  }).format(new Date(epoch * 1000));
}
function currentHourIndex(times) {
  const now = Date.now() / 1000;
  let index = 0;
  for (let i = 0; i < times.length && times[i] <= now; i++) index = i;
  return index;
}
function setPlace(place) {
  state.place = place;
  state.selectedStart = null;
  storage.set(PLACE_KEY, place);
  $('placeLabel').textContent = place.name;
  $('weatherScope').textContent = place.route ? 'ПРОГНОЗ ПО МАРШРУТУ' : 'ПРОГНОЗ ДЛЯ МЕСТА';
  $('useKaraul').classList.toggle('chip-primary', Boolean(place.route));
  $('placeSuggestions').replaceChildren();
  $('placeQuery').value = '';
  fetchWeather();
}

function weatherUrl() {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  const variables = 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m';
  url.searchParams.set('latitude', state.place.latitude);
  url.searchParams.set('longitude', state.place.longitude);
  url.searchParams.set('current', variables);
  url.searchParams.set('hourly', `${variables},precipitation_probability`);
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('timeformat', 'unixtime');
  url.searchParams.set('forecast_days', '2');
  return url;
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

async function fetchWeather() {
  const requestedPlace = `${state.place.latitude},${state.place.longitude}`;
  setMessage('weatherStatus', 'Загружаю прогноз…');
  $('weatherPanel').hidden = true;
  $('recommendationPanel').hidden = true;
  $('refreshWeather').disabled = true;
  try {
    const data = await fetchJson(weatherUrl());
    if (!data.current || !data.hourly?.time?.length) throw new Error('Пустой ответ погоды');
    if (requestedPlace !== `${state.place.latitude},${state.place.longitude}`) return;
    state.forecast = data;
    state.fetchedAt = Date.now();
    state.fromCache = false;
    storage.set(WEATHER_KEY, { place: requestedPlace, data, fetchedAt: state.fetchedAt });
    setMessage('weatherStatus', 'Прогноз для выбранного места');
    prepareStartTimes();
    renderForecast();
  } catch (error) {
    if (requestedPlace !== `${state.place.latitude},${state.place.longitude}`) return;
    const cached = storage.get(WEATHER_KEY);
    if (cached?.place === requestedPlace && Date.now() - cached.fetchedAt < 6 * 60 * 60 * 1000 && cached.data?.hourly) {
      state.forecast = cached.data;
      state.fetchedAt = cached.fetchedAt;
      state.fromCache = true;
      setMessage('weatherStatus', 'Сеть недоступна. Показан сохранённый прогноз.', 'warning');
      prepareStartTimes();
      renderForecast();
    } else {
      $('weatherPanel').hidden = true;
      $('recommendationPanel').hidden = true;
      setMessage('weatherStatus', 'Не удалось получить прогноз. Проверьте интернет и обновите погоду.', 'error');
      setMessage('recommendationStatus', 'Для рекомендации нужен прогноз погоды.');
    }
  } finally { $('refreshWeather').disabled = false; }
}

function prepareStartTimes() {
  const select = $('startSelect');
  const hourly = state.forecast.hourly;
  const now = Math.floor(Date.now() / 1000);
  const first = currentHourIndex(hourly.time);
  const indices = hourly.time.map((_, i) => i).filter(i => i >= first && hourly.time[i] <= now + 12 * 3600);
  select.replaceChildren();
  for (const [offset, i] of indices.entries()) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = offset === 0 ? 'Сейчас' : formatTime(hourly.time[i], { weekday: 'short' });
    select.append(option);
  }
  if (!indices.length) {
    const option = new Option('Нет прогноза на сегодня', '');
    select.append(option);
  }
  const selected = indices.includes(state.selectedStart) ? state.selectedStart : indices[0];
  state.selectedStart = selected;
  select.value = String(selected ?? '');
}

function renderHourly(hourly, indices) {
  const container = $('weatherHourly');
  container.replaceChildren();
  for (const i of indices.slice(0, -1).slice(0, 6)) {
    const card = document.createElement('div');
    card.className = 'hour-chip';
    const hour = document.createElement('strong');
    hour.textContent = formatTime(hourly.time[i]);
    const degrees = document.createElement('span');
    degrees.textContent = temp(hourly.temperature_2m[i]);
    const rain = document.createElement('small');
    rain.textContent = `осадки ${formatNumber(hourly.precipitation_probability[i + 1] ?? 0)}%`;
    card.append(hour, degrees, rain);
    container.append(card);
  }
}

function renderForecast() {
  if (!state.forecast) return;
  const current = state.forecast.current;
  const duration = Number($('durationSelect').value) || 2;
  const firstIndex = currentHourIndex(state.forecast.hourly.time);
  const windowHours = duration + (state.selectedStart === firstIndex ? 1 : 0);
  let metrics;
  try { metrics = summarizeForecast(state.forecast.hourly, state.selectedStart, windowHours); }
  catch (error) {
    setMessage('weatherStatus', error.message, 'error');
    $('weatherPanel').hidden = true;
    $('recommendationPanel').hidden = true;
    return;
  }
  $('weatherPanel').hidden = false;
  $('weatherTemp').textContent = temp(current.temperature_2m);
  $('weatherDescription').textContent = weatherLabel(current.weather_code);
  $('weatherFeels').textContent = temp(current.apparent_temperature);
  $('weatherWind').textContent = `${formatNumber(current.wind_speed_10m)} км/ч`;
  $('weatherGust').textContent = `${formatNumber(metrics.gustMax)} км/ч`;
  $('weatherRain').textContent = `${formatNumber(metrics.probabilityMax)}% · ${formatNumber(metrics.precipitationTotal, 1)} мм`;
  $('weatherRange').textContent = `${temp(metrics.tempMin)}…${temp(metrics.tempMax)}`;
  const updated = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(state.fetchedAt);
  $('weatherUpdated').textContent = state.fromCache ? `сохранён в ${updated}` : updated;
  renderHourly(state.forecast.hourly, metrics.indices);
  renderRecommendation(metrics, duration);
}

function renderOutfitList(id, entries) {
  const list = $(id);
  list.replaceChildren();
  if (!entries.length) {
    const li = document.createElement('li');
    li.className = 'empty-item';
    li.textContent = 'Дополнительные вещи не нужны по этому прогнозу.';
    list.append(li);
    return;
  }
  for (const entry of entries) {
    const li = document.createElement('li');
    li.className = `outfit-item${entry.item ? '' : ' is-missing'}`;
    const title = document.createElement('strong');
    title.textContent = entry.item?.name ?? entry.label;
    const detail = document.createElement('span');
    detail.textContent = entry.item ? entry.label : 'Добавьте подходящую вещь в гардероб';
    li.append(title, detail);
    list.append(li);
  }
}

function renderRecommendation(metrics, duration) {
  const result = recommendOutfit(metrics, state.wardrobe, state.activity, duration);
  $('recommendationPanel').hidden = false;
  $('summaryText').textContent = result.summary;
  const parts = [
    `${temp(metrics.tempMin)}…${temp(metrics.tempMax)} на время выхода`,
    result.flags.wet ? `осадки до ${formatNumber(metrics.probabilityMax)}%` : null,
    result.flags.wind ? `порывы до ${formatNumber(metrics.gustMax)} км/ч` : null,
  ].filter(Boolean);
  setMessage('recommendationStatus', parts.join(' · '));
  renderOutfitList('wearList', result.wear);
  renderOutfitList('packList', result.carry);
  const adviceList = $('adviceList');
  adviceList.replaceChildren();
  for (const phrase of result.advice) {
    const li = document.createElement('li');
    li.textContent = phrase;
    adviceList.append(li);
  }
  const missingList = $('missingList');
  missingList.replaceChildren();
  if (result.missing.length) {
    for (const role of result.missing) {
      const li = document.createElement('li');
      li.textContent = role;
      missingList.append(li);
    }
    missingList.parentElement.hidden = false;
  } else missingList.parentElement.hidden = true;
}

function wardrobeMessage(message, kind = '') { setMessage('wardrobeMessage', message, kind); }
function saveWardrobe(message = 'Гардероб сохранён в этом браузере.') {
  const saved = storage.set(WARDROBE_KEY, state.wardrobe);
  wardrobeMessage(saved ? message : 'Не удалось сохранить данные браузера. Выгрузите гардероб в JSON.', saved ? '' : 'error');
  renderWardrobe();
  if (state.forecast) renderForecast();
}
function warmthLabel(value) { return ['лёгкая', 'средняя', 'тёплая'][value - 1] || 'лёгкая'; }
function renderWardrobe() {
  const list = $('wardrobeList');
  list.replaceChildren();
  const count = state.wardrobe.length;
  $('wardrobeCount').textContent = `${count} ${count % 10 === 1 && count % 100 !== 11 ? 'вещь' :
    [2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100) ? 'вещи' : 'вещей'}`;
  $('removeExamples').hidden = !state.wardrobe.some(item => item.demo);
  if (!count) {
    const empty = document.createElement('p');
    empty.className = 'empty-wardrobe';
    empty.textContent = 'Пока пусто. Добавьте свои вещи или загрузите примеры и замените их названия.';
    list.append(empty);
    return;
  }
  const sorted = [...state.wardrobe].sort((a, b) => Object.keys(CATEGORIES).indexOf(a.category) - Object.keys(CATEGORIES).indexOf(b.category));
  for (const item of sorted) {
    const row = document.createElement('div');
    row.className = 'wardrobe-item';
    const info = document.createElement('div');
    info.className = 'wardrobe-item__info';
    const name = document.createElement('strong');
    name.textContent = item.name;
    const meta = document.createElement('small');
    meta.textContent = [CATEGORIES[item.category], warmthLabel(item.warmth),
      item.waterproof ? 'от дождя' : item.windproof ? 'от ветра' : null,
      item.activities.length === 1 ? (item.activities[0] === 'run' ? 'для бега' : 'для подъёма') : null,
      item.demo ? 'пример' : null].filter(Boolean).join(' · ');
    info.append(name, meta);
    const actions = document.createElement('div');
    actions.className = 'wardrobe-item-actions';
    for (const [action, label] of [['edit', 'Изменить'], ['delete', 'Удалить']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.action = action;
      button.dataset.id = item.id;
      button.textContent = label;
      actions.append(button);
    }
    row.append(info, actions);
    list.append(row);
  }
}

function resetItemForm() {
  $('itemForm').reset();
  $('itemId').value = '';
  $('itemRun').checked = true;
  $('itemHike').checked = true;
  $('cancelEdit').hidden = true;
}
function editItem(item) {
  $('itemId').value = item.id;
  $('itemName').value = item.name;
  $('itemCategory').value = item.category;
  $('itemWarmth').value = String(item.warmth);
  $('itemWindproof').checked = item.windproof;
  $('itemWaterproof').checked = item.waterproof;
  $('itemRun').checked = item.activities.includes('run');
  $('itemHike').checked = item.activities.includes('hike');
  $('itemNotes').value = item.notes;
  $('cancelEdit').hidden = false;
  $('itemForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('itemName').focus();
}

function bindWardrobe() {
  $('itemForm').addEventListener('submit', event => {
    event.preventDefault();
    const activities = [];
    if ($('itemRun').checked) activities.push('run');
    if ($('itemHike').checked) activities.push('hike');
    if (!activities.length) { wardrobeMessage('Выберите хотя бы один вид активности.', 'error'); return; }
    const id = $('itemId').value || makeId();
    const raw = {
      id, name: $('itemName').value, category: $('itemCategory').value,
      warmth: $('itemWarmth').value, windproof: $('itemWindproof').checked,
      waterproof: $('itemWaterproof').checked, activities, notes: $('itemNotes').value,
    };
    const item = normalizeItem(raw);
    if (!item) { wardrobeMessage('Укажите название и тип вещи.', 'error'); return; }
    const index = state.wardrobe.findIndex(x => x.id === id);
    if (index >= 0) state.wardrobe[index] = item;
    else state.wardrobe.push(item);
    saveWardrobe(index >= 0 ? 'Вещь обновлена.' : 'Вещь добавлена.');
    resetItemForm();
  });
  $('cancelEdit').addEventListener('click', resetItemForm);
  $('wardrobeList').addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const item = state.wardrobe.find(x => x.id === button.dataset.id);
    if (!item) return;
    if (button.dataset.action === 'edit') editItem(item);
    if (button.dataset.action === 'delete' && confirm(`Удалить «${item.name}» из гардероба?`)) {
      state.wardrobe = state.wardrobe.filter(x => x.id !== item.id);
      saveWardrobe('Вещь удалена.');
      if ($('itemId').value === item.id) resetItemForm();
    }
  });
  $('addExamples').addEventListener('click', () => {
    let added = 0;
    for (const example of examples) {
      if (state.wardrobe.some(item => item.name === example.name && item.category === example.category)) continue;
      state.wardrobe.push(normalizeItem({ ...example, id: makeId(), demo: true }));
      added++;
    }
    saveWardrobe(added ? `Добавлено ${added} примеров. Замените названия на свои вещи.` : 'Примеры уже добавлены.');
  });
  $('removeExamples').addEventListener('click', () => {
    const count = state.wardrobe.filter(item => item.demo).length;
    state.wardrobe = state.wardrobe.filter(item => !item.demo);
    saveWardrobe(`Убрано ${count} примеров; ваши вещи сохранены.`);
  });
  $('exportWardrobe').addEventListener('click', () => {
    const data = JSON.stringify({ version: 1, items: state.wardrobe }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `na-vykhod-garderob-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  });
  $('importWardrobe').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Файл больше 1 МБ.');
      const parsed = JSON.parse(await file.text());
      const source = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(source) || source.length > 500) throw new Error('Неверный формат гардероба.');
      const imported = source.map(normalizeItem).filter(Boolean);
      if (!imported.length) throw new Error('В файле не найдено вещей.');
      let added = 0;
      for (const item of imported) {
        if (state.wardrobe.some(x => x.name === item.name && x.category === item.category)) continue;
        item.id = makeId();
        state.wardrobe.push(item);
        added++;
      }
      saveWardrobe(`Импортировано ${added} вещей; совпадающие названия пропущены.`);
    } catch (error) { wardrobeMessage(error.message || 'Не удалось прочитать файл.', 'error'); }
    event.target.value = '';
  });
}

function bindControls() {
  document.querySelectorAll('[data-activity]').forEach(button => {
    button.addEventListener('click', () => {
      state.activity = button.dataset.activity;
      storage.set(ACTIVITY_KEY, state.activity);
      document.querySelectorAll('[data-activity]').forEach(b => {
        b.setAttribute('aria-pressed', String(b === button));
        b.classList.toggle('is-selected', b === button);
      });
      if (state.forecast) renderForecast();
    });
  });
  document.querySelectorAll('[data-activity]').forEach(b => {
    const selected = b.dataset.activity === state.activity;
    b.setAttribute('aria-pressed', String(selected));
    b.classList.toggle('is-selected', selected);
  });
  $('placeLabel').textContent = state.place.name;
  $('weatherScope').textContent = state.place.route ? 'ПРОГНОЗ ПО МАРШРУТУ' : 'ПРОГНОЗ ДЛЯ МЕСТА';
  $('useKaraul').classList.toggle('chip-primary', Boolean(state.place.route));
  $('useKaraul').addEventListener('click', () => setPlace({ ...ROUTE_PLACE }));
  $('useLocation').addEventListener('click', () => {
    if (!navigator.geolocation) { setMessage('weatherStatus', 'Геолокация недоступна в этом браузере.', 'error'); return; }
    setMessage('weatherStatus', 'Определяю местоположение…');
    navigator.geolocation.getCurrentPosition(position => {
      setPlace({ name: 'Моё местоположение', latitude: position.coords.latitude, longitude: position.coords.longitude, route: false });
    }, () => setMessage('weatherStatus', 'Геолокация не получена. Выберите город или Караульную гору.', 'error'),
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });
  $('placeSearch').addEventListener('submit', async event => {
    event.preventDefault();
    const query = $('placeQuery').value.trim();
    if (query.length < 2) { setMessage('weatherStatus', 'Введите хотя бы 2 буквы города.'); return; }
    setMessage('weatherStatus', 'Ищу место…');
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', query);
    url.searchParams.set('count', '5');
    url.searchParams.set('language', 'ru');
    url.searchParams.set('format', 'json');
    try {
      const data = await fetchJson(url);
      const results = $('placeSuggestions');
      results.replaceChildren();
      if (!data.results?.length) { setMessage('weatherStatus', 'Место не найдено. Уточните запрос.'); return; }
      for (const place of data.results) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'place-option';
        button.textContent = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
        button.addEventListener('click', () => setPlace({ name: button.textContent, latitude: place.latitude, longitude: place.longitude, route: false }));
        results.append(button);
      }
      setMessage('weatherStatus', 'Выберите место из списка.');
    } catch { setMessage('weatherStatus', 'Поиск места недоступен. Попробуйте ещё раз.', 'error'); }
  });
  $('startSelect').addEventListener('change', () => {
    state.selectedStart = Number($('startSelect').value);
    renderForecast();
  });
  $('durationSelect').addEventListener('change', renderForecast);
  $('refreshWeather').addEventListener('click', fetchWeather);
}

bindControls();
bindWardrobe();
renderWardrobe();
fetchWeather();
