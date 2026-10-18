import { CATEGORIES, includeCurrentConditions, recommendOutfit, summarizeForecast, weatherLabel } from './logic.mjs?v=10';
import { PERSONAL_WARDROBE, refreshWardrobeColors } from './wardrobe-defaults.mjs?v=10';
import { selectHeroScene, weatherIconName } from './hero-scenes.mjs?v=10';
import { selectMannequinPreset } from './mannequin-presets.mjs?v=10';

const ROUTE_PLACE = Object.freeze({
  name: 'Караульная гора · часовня',
  latitude: 56.023605,
  longitude: 92.859616,
  route: true,
});
const WARDROBE_KEY = 'na-vykhod:wardrobe:v1';
const PERSONAL_SEED_KEY_V1 = 'na-vykhod:personal-seed:2026-10-18';
const PERSONAL_SEED_KEY_V2 = 'na-vykhod:personal-seed:v2:2026-10-18';
const PERSONAL_SEED_KEY_V3 = 'na-vykhod:personal-seed:v3:2026-10-18';
const PERSONAL_SEED_KEY_V4 = 'na-vykhod:personal-seed:v4:2026-10-18';
const PERSONAL_SEED_KEY_V5 = 'na-vykhod:personal-seed:v5:2026-10-18';
const PERSONAL_SEED_KEY_V6 = 'na-vykhod:personal-seed:v6:2026-10-18';
const PERSONAL_SEED_KEY_V7 = 'na-vykhod:personal-seed:v7:2026-10-18';
const PERSONAL_SEED_KEY_V8 = 'na-vykhod:personal-seed:v8:2026-10-18';
const PERSONAL_SEED_KEY_V9 = 'na-vykhod:personal-seed:v9:2026-10-18';
const PLACE_KEY = 'na-vykhod:place:v1';
const ACTIVITY_KEY = 'na-vykhod:activity:v1';
const SURFACE_KEY = 'na-vykhod:surface:v1';
const WEATHER_KEY = 'na-vykhod:weather:v1';
const CATEGORIES_SET = new Set(Object.keys(CATEGORIES));
const $ = id => document.getElementById(id);
const ITEM_IMAGES = new Map([
  ['Джемпер half-zip GRI Винд', 'gri-wind.webp'],
  ['Джемпер half-zip GRI Норд', 'gri-nord.webp'],
  ['Джемпер флисовый Glissade', 'glissade-fleece.webp'],
  ['Брюки Demix', 'demix-pants.webp'],
  ['Брюки мужские GRI Джеди', 'gri-jedy.webp'],
  ['Брюки для беговых лыж Madshus', 'madshus-pants.webp'],
  ['Термобельё — верх', 'thermal-top.webp'],
  ['Термобельё — низ', 'thermal-bottom.webp'],
  ['Шапка Madshus', 'madshus-hat.webp'],
  ['Куртка мембранная Northland Glodis', 'northland-glodis.webp'],
  ['Куртка софтшелл', 'softshell-jacket.webp'],
  ['Оранжевая ветровка Uniqlo', 'uniqlo-windbreaker.webp'],
  ['Шапка флисовая', 'fleece-hat.webp'],
  ['Куртка для беговых лыж Nordway', 'nordway-ski-jacket.webp'],
  ['Шорты Athlex', 'athlex-shorts.webp'],
  ['ASICS GEL-FujiSetsu 3 G-TX', 'asics-fujisetsu.webp'],
  ['ASICS Gel-Sonoma 8', 'asics-sonoma.webp'],
  ['ASICS Novablast 5', 'asics-novablast.webp'],
  ['Бейсболка ASICS', 'asics-cap.webp'],
  ['Тёплый бафф', 'insulated-buff.webp'],
  ['Лёгкий бафф «Большая волна»', 'warm-buff.webp'],
  ['Балаклава флисовая', 'fleece-balaclava.webp'],
  ['Перчатки тонкие беговые', 'running-gloves.webp'],
  ['Тёплые варежки GRI (тип Полар)', 'gri-mittens.webp'],
]);
const LEGACY_NAMES = new Map([
  ['Брюки мужские Demix · арт. 130180DMX-V3-44-46', 'Брюки Demix'],
  ['Брюки для беговых лыж Madshus · 124830M01-99-52', 'Брюки для беговых лыж Madshus'],
  ['Шапка Madshus · 131923M01-99-one size', 'Шапка Madshus'],
  ['Куртка мембранная Northland Glodis · 129343N16-N4-52', 'Куртка мембранная Northland Glodis'],
  ['Оранжевая ветровка Uniqlo · тип 444550COL62', 'Оранжевая ветровка Uniqlo'],
  ['Куртка софтшелл (модель не указана)', 'Куртка софтшелл'],
  ['Куртка для беговых лыж Nordway · 138174NDW-AB-52', 'Куртка для беговых лыж Nordway'],
  ['Джемпер флисовый Glissade, серый · тип 138587GSD-BA-52', 'Джемпер флисовый Glissade'],
  ['Шорты Athlex · тип 133110A31-99-46', 'Шорты Athlex'],
  ['Бафф тёплый', 'Тёплый бафф'],
]);
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
  const warmth = Math.min(4, Math.max(1, Math.round(Number(raw.warmth) || 1)));
  const activities = Array.isArray(raw.activities)
    ? raw.activities.filter(x => x === 'run' || x === 'hike')
    : ['run', 'hike'];
  const allowedSurfaces = new Set(['dry', 'trail', 'snow', 'ice']);
  const surfaces = raw.category === 'shoes'
    ? (Array.isArray(raw.surfaces) ? raw.surfaces.filter(x => allowedSurfaces.has(x)) : ['dry'])
    : [];
  return {
    id: String(raw.id || makeId()), name, category: raw.category, warmth,
    windproof: Boolean(raw.windproof), waterproof: Boolean(raw.waterproof),
    coversNeck: Boolean(raw.coversNeck),
    firstLayer: raw.category === 'mid-top' && Boolean(raw.firstLayer),
    activities: activities.length ? [...new Set(activities)] : ['run', 'hike'],
    surfaces: raw.category === 'shoes' ? ([...new Set(surfaces)].length ? [...new Set(surfaces)] : ['dry']) : [],
    notes: String(raw.notes ?? '').trim().slice(0, 280),
    demo: Boolean(raw.demo),
  };
}

const savedItems = storage.get(WARDROBE_KEY);
function seedPersonalWardrobe(items) {
  const wardrobe = Array.isArray(items) ? items.map(normalizeItem).filter(Boolean) : [];
  if (storage.get(PERSONAL_SEED_KEY_V9) === true) return wardrobe;
  if (storage.get(PERSONAL_SEED_KEY_V8) === true) {
    refreshWardrobeColors(wardrobe);
    if (storage.set(WARDROBE_KEY, wardrobe)) storage.set(PERSONAL_SEED_KEY_V9, true);
    return wardrobe;
  }
  const hadV6 = storage.get(PERSONAL_SEED_KEY_V6) === true;
  const hadV4 = storage.get(PERSONAL_SEED_KEY_V4) === true;
  const defaults = PERSONAL_WARDROBE.map(normalizeItem).filter(Boolean);
  const isSameItem = (a, b) => a.category === b.category &&
    a.name.toLocaleLowerCase('ru-RU') === b.name.toLocaleLowerCase('ru-RU');
  const newAccessories = new Set(['Бейсболка ASICS', 'Тёплый бафф', 'Балаклава флисовая',
    'Перчатки тонкие беговые', 'Тёплые варежки GRI (тип Полар)']);
  if (hadV4 || storage.get(PERSONAL_SEED_KEY_V3) === true) {
    // Existing browser edits stay intact; only the newly reported jacket is added below.
  } else if (storage.get(PERSONAL_SEED_KEY_V2) === true) {
    const uniqlo = defaults.find(item => item.name.startsWith('Оранжевая ветровка Uniqlo'));
    const oldUniqlo = wardrobe.find(item => item.category === 'shell' &&
      /^(Очень тонкая ветровка Uniqlo|Ветровка Uniqlo)/i.test(item.name));
    if (uniqlo && oldUniqlo) Object.assign(oldUniqlo, { ...uniqlo, id: oldUniqlo.id });
    for (const item of defaults.filter(item => newAccessories.has(item.name))) {
      if (!wardrobe.some(existing => isSameItem(existing, item))) wardrobe.push(item);
    }
  } else if (storage.get(PERSONAL_SEED_KEY_V1) === true) {
    // Upgrade only starter items still present; intentionally leave removed items removed.
    for (const item of wardrobe) {
      const updated = defaults.find(candidate => isSameItem(item, candidate));
      if (!updated) continue;
      item.warmth = updated.warmth;
      item.windproof = updated.windproof;
      item.waterproof = updated.waterproof;
      item.surfaces = [...updated.surfaces];
      item.coversNeck = updated.coversNeck;
      item.notes = updated.notes;
    }
    const uniqlo = defaults.find(item => item.name.startsWith('Оранжевая ветровка Uniqlo'));
    if (uniqlo && !wardrobe.some(item => isSameItem(item, uniqlo))) wardrobe.push(uniqlo);
    for (const item of defaults.filter(item => newAccessories.has(item.name))) {
      if (!wardrobe.some(existing => isSameItem(existing, item))) wardrobe.push(item);
    }
  } else {
    for (const item of defaults) {
      if (!wardrobe.some(existing => isSameItem(existing, item))) wardrobe.push(item);
    }
  }
  for (const item of wardrobe) {
    const newName = LEGACY_NAMES.get(item.name);
    if (newName) {
      item.name = newName;
      const updated = defaults.find(candidate => isSameItem(item, candidate));
      if (updated) item.notes = updated.notes;
    }
  }
  const colorHints = new Map([
    ['Джемпер half-zip GRI Винд', 'Тёмно-синий'],
    ['Шапка флисовая', 'Хаки'],
    ['ASICS GEL-FujiSetsu 3 G-TX', 'Чёрные с зелёными вставками и шнурками'],
    ['ASICS Gel-Sonoma 8', 'Чёрные с мятными вставками и шнурками'],
    ['ASICS Novablast 5', 'Оранжевая лимитированная версия Tokyo'],
    ['Балаклава флисовая', 'Синяя'],
    ['Тёплые варежки GRI (тип Полар)', 'Тёмно-синие'],
  ]);
  for (const item of wardrobe) {
    const hint = colorHints.get(item.name);
    if (hint && !item.notes.toLocaleLowerCase('ru-RU').includes(hint.toLocaleLowerCase('ru-RU')))
      item.notes = `${hint}. ${item.notes}`;
  }
  const softshell = defaults.find(item => item.name === 'Куртка софтшелл');
  if (softshell && !wardrobe.some(item => isSameItem(item, softshell))) wardrobe.push(softshell);
  const lightBuff = defaults.find(item => item.name === 'Лёгкий бафф «Большая волна»');
  if (lightBuff && !wardrobe.some(item => isSameItem(item, lightBuff))) wardrobe.push(lightBuff);
  const nordway = wardrobe.find(item => item.name === 'Куртка для беговых лыж Nordway');
  if (nordway?.warmth === 3) nordway.warmth = 4;
  if (!hadV6) {
    for (const item of wardrobe) {
      if (item.category === 'mid-top' &&
        ['Джемпер half-zip GRI Винд', 'Джемпер half-zip GRI Норд'].includes(item.name)) item.firstLayer = true;
    }
  }
  const revisedNotes = new Map([
    ['Джемпер half-zip GRI Винд', ['Тёмно-синий. Самый лёгкий из ваших джемперов; ветрозащиту модели стоит уточнить.',
      'Тёмно-синий. Тонкий флисовый джемпер, но ощутимо тёплый; самый лёгкий из ваших трёх джемперов по личной оценке. Ветрозащиту модели стоит уточнить.']],
    ['Джемпер half-zip GRI Норд', ['Какао. Средняя теплота по вашей оценке; флисовый средний слой.',
      'Светлый бежево-серый меланж. Средняя теплота по вашей оценке; тонкий флисовый джемпер.']],
    ['Куртка для беговых лыж Nordway', ['Голубая. Самая тёплая из ваших курток; мембрана 3K/3K, в сильный дождь защита ограничена.',
      'Ярко-синяя, кобальтового оттенка. Самая тёплая из ваших курток; мембрана 3K/3K, в сильный дождь защита ограничена.']],
    ['Джемпер флисовый Glissade', ['Светло-серый. Самый тёплый из ваших джемперов по личной оценке.',
      'Светло-серый, тонкий флис без пушистого ворса. Самый тёплый из ваших джемперов по личной оценке.']],
  ]);
  for (const item of wardrobe) {
    const revision = revisedNotes.get(item.name);
    if (revision && item.notes === revision[0]) item.notes = revision[1];
  }
  refreshWardrobeColors(wardrobe);
  if (storage.set(WARDROBE_KEY, wardrobe)) {
    storage.set(PERSONAL_SEED_KEY_V2, true);
    storage.set(PERSONAL_SEED_KEY_V3, true);
    storage.set(PERSONAL_SEED_KEY_V4, true);
    storage.set(PERSONAL_SEED_KEY_V5, true);
    storage.set(PERSONAL_SEED_KEY_V6, true);
    storage.set(PERSONAL_SEED_KEY_V7, true);
    storage.set(PERSONAL_SEED_KEY_V8, true);
    storage.set(PERSONAL_SEED_KEY_V9, true);
  }
  return wardrobe;
}
const savedPlace = storage.get(PLACE_KEY);
const state = {
  wardrobe: seedPersonalWardrobe(savedItems),
  place: savedPlace && Number.isFinite(Number(savedPlace.latitude)) && Number.isFinite(Number(savedPlace.longitude))
    ? savedPlace : { ...ROUTE_PLACE },
  activity: storage.get(ACTIVITY_KEY) === 'run' ? 'run' : 'hike',
  surface: ['dry', 'trail', 'snow', 'ice'].includes(storage.get(SURFACE_KEY)) ? storage.get(SURFACE_KEY) : 'dry',
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
let heroImageRequest = 0;
function renderHeroWeather(metrics) {
  const { weather, thermal, asset, fallback, outlookCode } = selectHeroScene(metrics);
  const hero = document.querySelector('.hero-art');
  if (hero) {
    hero.dataset.weather = weather;
    hero.dataset.thermal = thermal;
  }
  if (hero && hero.dataset.scene !== asset) {
    const request = ++heroImageRequest;
    const fallbackUrl = `assets/${fallback}.webp?v=10`;
    hero.dataset.scene = asset;
    hero.style.setProperty('--hero-scene', `url("${fallbackUrl}")`);
    if (asset !== fallback) {
      const source = `assets/${asset}.webp?v=10`;
      const image = new Image();
      image.onload = () => {
        if (request === heroImageRequest) hero.style.setProperty('--hero-scene', `url("${source}")`);
      };
      image.onerror = () => {
        // A missing variant must never leave a broken hero background.
        if (request === heroImageRequest) hero.dataset.scene = fallback;
      };
      image.src = source;
    }
  }
  return outlookCode;
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
function syncPlaceShortcuts(place) {
  const onRoute = Boolean(place.route);
  const atCurrentLocation = place.name === 'Моё местоположение';
  $('useKaraul').classList.toggle('chip-primary', onRoute);
  $('useKaraul').setAttribute('aria-pressed', String(onRoute));
  $('useLocation').classList.toggle('chip-primary', atCurrentLocation);
  $('useLocation').setAttribute('aria-pressed', String(atCurrentLocation));
}
function setPlace(place) {
  state.place = place;
  state.selectedStart = null;
  storage.set(PLACE_KEY, place);
  $('placeLabel').textContent = place.name;
  $('weatherScope').textContent = place.route ? 'ПРОГНОЗ ПО МАРШРУТУ' : 'ПРОГНОЗ ДЛЯ МЕСТА';
  syncPlaceShortcuts(place);
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
  $('lookPanel').hidden = true;
  $('heroOutfit').hidden = true;
  document.querySelector('.hero-art').dataset.warning = 'false';
  $('lookEmpty').hidden = false;
  $('lookEmpty').textContent = 'Загружаем прогноз для комплекта.';
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
      $('lookEmpty').textContent = 'Не удалось получить прогноз для комплекта. Обновите погоду.';
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
  const leavingNow = state.selectedStart === firstIndex;
  const windowHours = duration + (state.selectedStart === firstIndex ? 1 : 0);
  let metrics;
  try {
    metrics = summarizeForecast(state.forecast.hourly, state.selectedStart, windowHours);
    if (leavingNow) metrics = includeCurrentConditions(metrics, current);
  }
  catch (error) {
    setMessage('weatherStatus', error.message, 'error');
    $('weatherPanel').hidden = true;
    $('recommendationPanel').hidden = true;
    $('heroOutfit').hidden = true;
    return;
  }
  $('weatherPanel').hidden = false;
  const hourly = state.forecast.hourly;
  const atStart = field => leavingNow ? current[field] : hourly[field][state.selectedStart];
  const outlookCode = renderHeroWeather(metrics);
  $('weatherTemp').textContent = temp(atStart('temperature_2m'));
  $('weatherDescription').textContent = weatherLabel(outlookCode);
  $('weatherIconUse').setAttribute('href', `#wx-${weatherIconName(outlookCode)}`);
  $('weatherFeels').textContent = temp(atStart('apparent_temperature'));
  $('weatherWind').textContent = `${formatNumber(atStart('wind_speed_10m'))} км/ч`;
  $('weatherGust').textContent = `${formatNumber(metrics.gustMax)} км/ч`;
  $('weatherRain').textContent = `${formatNumber(metrics.probabilityMax)}% · ${formatNumber(metrics.precipitationTotal, 1)} мм`;
  $('weatherRange').textContent = `${temp(metrics.tempMin)}…${temp(metrics.tempMax)}`;
  const updated = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(state.fetchedAt);
  $('weatherUpdated').textContent = state.fromCache ? `сохранён в ${updated}` : updated;
  renderHourly(state.forecast.hourly, metrics.indices);
  renderRecommendation(metrics, duration, outlookCode);
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

function renderRecommendation(metrics, duration, outlookCode) {
  const result = recommendOutfit(metrics, state.wardrobe, state.activity, duration, state.surface);
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
  renderHeroOutfit(result, metrics, outlookCode);
  renderLook(result, metrics);
}

function renderHeroOutfit(result, metrics, outlookCode) {
  const list = $('heroOutfitItems');
  list.replaceChildren();
  for (const entry of result.wear) {
    const item = document.createElement('li');
    item.className = `hero-outfit-item${entry.item ? '' : ' hero-outfit-item--missing'}`;
    const media = document.createElement('span');
    media.className = 'hero-outfit-item__media';
    const imageName = entry.item && ITEM_IMAGES.get(entry.item.name);
    if (imageName) {
      const image = document.createElement('img');
      image.src = `assets/items/${imageName}?v=10`;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      media.append(image);
    } else media.textContent = entry.item ? 'ВЕЩЬ' : '＋';
    const name = document.createElement('span');
    name.className = 'hero-outfit-item__name';
    name.textContent = entry.item?.name ?? entry.label;
    item.append(media, name);
    list.append(item);
  }
  const activity = state.activity === 'hike' ? 'ПОДЪЁМ С РЮКЗАКОМ' : 'ПРОБЕЖКА';
  $('heroOutfitWeather').textContent = `${activity} · ${temp(metrics.tempMin)}…${temp(metrics.tempMax)} · ${weatherLabel(outlookCode)}`;
  const unsafe = /^Экстремальн/u.test(result.summary);
  $('heroOutfit').dataset.warning = String(unsafe);
  document.querySelector('.hero-art').dataset.warning = String(unsafe);
  $('heroOutfitKicker').textContent = unsafe ? 'ВЫХОД ЛУЧШЕ ОТЛОЖИТЬ' : 'КОМПЛЕКТ НА ВЫХОД';
  const missingCount = result.wear.filter(entry => !entry.item).length;
  $('heroOutfitNote').textContent = unsafe ? result.summary : missingCount
    ? `Не хватает вещей: ${missingCount}. Подробности ниже.`
    : result.missing.length ? 'Есть уточнения по комплекту — проверь их ниже.'
      : 'По выбранному прогнозу и твоему гардеробу.';
  $('heroOutfit').hidden = false;
}

function addLookItems(listId, entries, emptyText) {
  const list = $(listId);
  list.replaceChildren();
  if (!entries.length) {
    const li = document.createElement('li');
    li.textContent = emptyText;
    li.className = 'look-list-empty';
    list.append(li);
    return;
  }
  for (const entry of entries) {
    const li = document.createElement('li');
    li.textContent = entry.item?.name ?? `${entry.label} — нет в гардеробе`;
    if (!entry.item) li.className = 'look-list-missing';
    list.append(li);
  }
}

function renderLook(result, metrics) {
  const figure = $('lookFigure');
  figure.replaceChildren();
  const preset = selectMannequinPreset(result, metrics, state.activity);
  figure.dataset.preset = preset;
  const image = document.createElement('img');
  image.className = 'mannequin-photo';
  image.src = `assets/${preset}.webp?v=10`;
  image.alt = 'Реалистичная иллюстрация одетого манекена по выбранной погоде';
  image.width = 800;
  image.height = 1100;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.onerror = () => {
    image.onerror = null;
    image.src = 'assets/mannequin-wet-zero.webp?v=10';
  };
  figure.append(image);
  const roles = {
    head: ['Голова', 'left'], neck: ['Шея', 'right'],
    'base-top': ['Первый слой', 'left'], 'mid-top': ['Средний слой', 'right'],
    shell: ['Куртка', 'left'], hands: ['Руки', 'right'],
    'base-bottom': ['Термобельё', 'left'], bottom: ['Низ', 'right'],
    shoes: ['Обувь', 'right'],
  };
  for (const entry of result.wear) {
    const [role, side] = roles[entry.category] ?? ['Вещь', 'right'];
    const callout = document.createElement('div');
    callout.className = `mannequin-callout mannequin-callout--${entry.category}`;
    callout.dataset.side = side;
    if (!entry.item) callout.classList.add('mannequin-callout--missing');
    const roleLabel = document.createElement('span');
    roleLabel.className = 'mannequin-callout__role';
    roleLabel.textContent = entry.item ? role : `${role} · нужно добавить`;
    const name = document.createElement('strong');
    name.className = 'mannequin-callout__name';
    name.textContent = entry.item?.name ?? entry.label;
    callout.append(roleLabel, name);
    figure.append(callout);
  }
  $('lookActivity').textContent = state.activity === 'hike' ? 'ПОДЪЁМ С РЮКЗАКОМ' : 'БЕГ';
  $('lookWeather').textContent = `${temp(metrics.tempMin)}…${temp(metrics.tempMax)} · ${state.place.name}`;
  addLookItems('lookWornList', result.wear, 'По этому прогнозу комплект не собран.');
  addLookItems('lookPackList', result.carry, 'Дополнительные вещи не нужны.');
  $('lookCaveat').textContent = result.missing.length
    ? `Нужно уточнить или добавить: ${result.missing.join('; ')}.`
    : 'Манекен иллюстрирует комплект по погоде; точные выбранные вещи указаны в выносках. Отдельные детали изображения могут отличаться.';
  $('lookPanel').hidden = false;
  $('lookEmpty').hidden = true;
}

function wardrobeMessage(message, kind = '') { setMessage('wardrobeMessage', message, kind); }
function saveWardrobe(message = 'Гардероб сохранён в этом браузере.') {
  const saved = storage.set(WARDROBE_KEY, state.wardrobe);
  wardrobeMessage(saved ? message : 'Не удалось сохранить данные браузера. Выгрузите гардероб в JSON.', saved ? '' : 'error');
  renderWardrobe();
  if (state.forecast) renderForecast();
}
function warmthLabel(value) { return ['лёгкая', 'средняя', 'тёплая', 'очень тёплая'][value - 1] || 'лёгкая'; }
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
  const categoryOrder = Object.keys(CATEGORIES);
  const sorted = [...state.wardrobe].sort((a, b) =>
    categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) || a.warmth - b.warmth);
  for (const item of sorted) {
    const row = document.createElement('div');
    row.className = 'wardrobe-item';
    const imageName = ITEM_IMAGES.get(item.name);
    if (imageName) {
      row.classList.add('has-image');
      const media = document.createElement('div');
      media.className = 'wardrobe-item__media';
      const image = document.createElement('img');
      image.src = `assets/items/${imageName}?v=10`;
      image.alt = `Иллюстрация: ${item.name}`;
      image.loading = 'lazy';
      image.decoding = 'async';
      media.append(image);
      row.append(media);
    }
    const info = document.createElement('div');
    info.className = 'wardrobe-item__info';
    const name = document.createElement('strong');
    name.textContent = item.name;
    const meta = document.createElement('small');
    meta.textContent = [CATEGORIES[item.category], warmthLabel(item.warmth),
      item.waterproof ? 'от дождя' : item.windproof ? 'от ветра' : null,
      item.coversNeck ? 'закрывает шею' : null,
      item.firstLayer ? 'можно первым слоем' : null,
      item.activities.length === 1 ? (item.activities[0] === 'run' ? 'для бега' : 'для подъёма') : null,
      item.demo ? 'пример' : null].filter(Boolean).join(' · ');
    info.append(name, meta);
    if (item.notes) {
      const note = document.createElement('small');
      note.className = 'wardrobe-item__note';
      note.textContent = item.notes;
      info.append(note);
    }
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
  $('itemSurfaceDry').checked = true;
  $('itemSurfaceTrail').checked = false;
  $('itemSurfaceSnow').checked = false;
  $('itemSurfaceIce').checked = false;
  $('itemFirstLayer').checked = false;
  syncShoeSurfaceField();
}
function syncShoeSurfaceField() {
  $('shoeSurfaceField').hidden = $('itemCategory').value !== 'shoes';
  $('firstLayerField').hidden = $('itemCategory').value !== 'mid-top';
}
function editItem(item) {
  $('itemId').value = item.id;
  $('itemName').value = item.name;
  $('itemCategory').value = item.category;
  $('itemWarmth').value = String(item.warmth);
  $('itemWindproof').checked = item.windproof;
  $('itemWaterproof').checked = item.waterproof;
  $('itemFirstLayer').checked = item.firstLayer;
  $('itemRun').checked = item.activities.includes('run');
  $('itemHike').checked = item.activities.includes('hike');
  $('itemNotes').value = item.notes;
  $('itemSurfaceDry').checked = item.surfaces?.includes('dry') ?? true;
  $('itemSurfaceTrail').checked = item.surfaces?.includes('trail') ?? false;
  $('itemSurfaceSnow').checked = item.surfaces?.includes('snow') ?? false;
  $('itemSurfaceIce').checked = item.surfaces?.includes('ice') ?? false;
  syncShoeSurfaceField();
  $('cancelEdit').hidden = false;
  $('itemForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('itemName').focus();
}

function bindWardrobe() {
  $('itemCategory').addEventListener('change', syncShoeSurfaceField);
  syncShoeSurfaceField();
  $('itemForm').addEventListener('submit', event => {
    event.preventDefault();
    const activities = [];
    if ($('itemRun').checked) activities.push('run');
    if ($('itemHike').checked) activities.push('hike');
    if (!activities.length) { wardrobeMessage('Выберите хотя бы один вид активности.', 'error'); return; }
    const id = $('itemId').value || makeId();
    const previous = state.wardrobe.find(x => x.id === id);
    const surfaces = [['dry', 'itemSurfaceDry'], ['trail', 'itemSurfaceTrail'],
      ['snow', 'itemSurfaceSnow'], ['ice', 'itemSurfaceIce']]
      .filter(([, field]) => $(field).checked).map(([value]) => value);
    if ($('itemCategory').value === 'shoes' && !surfaces.length) {
      wardrobeMessage('Выберите хотя бы одно покрытие для обуви.', 'error');
      return;
    }
    const raw = {
      id, name: $('itemName').value, category: $('itemCategory').value,
      warmth: $('itemWarmth').value, windproof: $('itemWindproof').checked,
      waterproof: $('itemWaterproof').checked, activities, notes: $('itemNotes').value,
      firstLayer: $('itemFirstLayer').checked,
      coversNeck: previous?.coversNeck,
      surfaces,
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
  $('surfaceSelect').value = state.surface;
  $('surfaceSelect').addEventListener('change', () => {
    state.surface = $('surfaceSelect').value;
    storage.set(SURFACE_KEY, state.surface);
    if (state.forecast) renderForecast();
  });
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
  syncPlaceShortcuts(state.place);
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
