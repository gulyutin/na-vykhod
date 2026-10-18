export const CATEGORIES = {
  'base-top': 'Базовый верх',
  'mid-top': 'Утепляющий слой',
  shell: 'Куртка / защита',
  bottom: 'Низ',
  shoes: 'Обувь',
  head: 'Головной убор',
  hands: 'Перчатки',
  neck: 'Бафф / защита шеи',
};

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function summarizeForecast(hourly, startIndex, durationHours) {
  const count = Math.max(1, Math.ceil(number(durationHours, 1)));
  const end = Math.min(hourly.time.length, startIndex + count + 1);
  const indices = Array.from({ length: Math.max(0, end - startIndex) }, (_, i) => startIndex + i);
  if (!indices.length) throw new Error('Нет почасового прогноза на выбранное время.');

  const values = (field) => indices.map(i => number(hourly[field]?.[i]));
  // Open-Meteo timestamps hourly precipitation for the hour that just ended.
  const precipitationIndices = indices.slice(1);
  const precipValues = field => precipitationIndices.map(i => number(hourly[field]?.[i]));
  const temperatures = values('temperature_2m');
  const apparent = values('apparent_temperature');
  const precipitation = precipValues('precipitation');
  const probability = precipValues('precipitation_probability');
  const wind = values('wind_speed_10m');
  const gust = values('wind_gusts_10m');
  const codes = values('weather_code');
  const minAt = temperatures.indexOf(Math.min(...temperatures));
  const windAt = gust.indexOf(Math.max(...gust));
  const rainAt = probability.indexOf(Math.max(...probability));

  return {
    indices,
    tempMin: Math.min(...temperatures),
    tempMax: Math.max(...temperatures),
    apparentMin: Math.min(...apparent),
    precipitationTotal: precipitation.reduce((a, b) => a + b, 0),
    probabilityMax: probability.length ? Math.max(...probability) : 0,
    windMax: Math.max(...wind),
    gustMax: Math.max(...gust),
    codes,
    coldestTime: hourly.time[indices[minAt]],
    windiestTime: hourly.time[indices[windAt]],
    rainiestTime: probability.length ? hourly.time[precipitationIndices[rainAt]] : null,
  };
}

export function weatherLabel(code) {
  if (code === 0) return 'Ясно';
  if (code <= 3) return 'Облачно';
  if (code === 45 || code === 48) return 'Туман';
  if (code >= 51 && code <= 67) return 'Дождь';
  if (code >= 71 && code <= 77) return 'Снег';
  if (code >= 80 && code <= 82) return 'Ливень';
  if (code >= 85 && code <= 86) return 'Снегопад';
  if (code >= 95) return 'Гроза';
  return 'Переменная погода';
}

export function recommendOutfit(metrics, wardrobe, activity, durationHours) {
  const hike = activity === 'hike';
  const t = metrics.tempMin;
  const wet = metrics.probabilityMax >= 50 || metrics.precipitationTotal >= 0.3 ||
    metrics.codes.some(code => code >= 51);
  const wind = metrics.windMax >= 25 || metrics.gustMax >= 40;
  const snow = wet && t <= 1;
  const wear = [];
  const carry = [];
  const missing = [];
  const advice = [];
  const used = new Set();

  function pick(category, target, required = {}) {
    const candidates = wardrobe.filter(item => item.category === category &&
      (item.activities?.includes(activity) ?? true) && !used.has(item.id));
    candidates.sort((a, b) => {
      const score = item => Math.abs(item.warmth - target) * 3 +
        (item.warmth < target ? 2 : 0) +
        (required.waterproof && !item.waterproof ? 12 : 0) +
        (required.windproof && !item.windproof && !item.waterproof ? 8 : 0);
      return score(a) - score(b);
    });
    const item = candidates[0] ?? null;
    if (item) used.add(item.id);
    return item;
  }

  function add(targetList, category, label, warmth, required = {}) {
    const item = pick(category, warmth, required);
    targetList.push({ category, label, item });
    if (!item) missing.push(label);
    else if (required.waterproof && !item.waterproof) missing.push(`Влагозащитный слой вместо «${item.name}»`);
    else if (required.windproof && !item.windproof && !item.waterproof) missing.push(`Ветрозащитный слой вместо «${item.name}»`);
  }

  const baseWarmth = t >= 17 ? 1 : t >= 3 ? 2 : 3;
  const bottomWarmth = t >= 18 ? 1 : t >= 2 ? 2 : 3;
  add(wear, 'base-top', t >= 17 ? 'Лёгкий дышащий верх' : 'Влагоотводящий базовый верх', baseWarmth);
  add(wear, 'bottom', t >= 18 ? 'Лёгкий низ' : 'Тайтсы или брюки по погоде', bottomWarmth);
  add(wear, 'shoes', hike ? 'Обувь для подъёма' : 'Беговая обувь', wet && t <= 5 ? 2 : 1);

  const wearMid = hike ? t < -4 : t < -9;
  if (wearMid) add(wear, 'mid-top', 'Утепляющий слой', t < -12 ? 3 : 2);
  if (wet || wind || t < -6) {
    add(wear, 'shell', wet ? (snow ? 'Защита от мокрого снега' : 'Защита от дождя') : 'Защита от ветра', 1,
      wet ? { waterproof: true } : { windproof: true });
  }
  if (t <= 5 || (wet && t <= 12)) add(wear, 'head', 'Головной убор', t <= -8 ? 3 : t <= 0 ? 2 : 1);
  if (t <= 2 || (wind && t <= 8)) add(wear, 'hands', 'Перчатки', t <= -8 ? 3 : 1);
  if (t <= -9 || (wind && t <= 0)) add(wear, 'neck', 'Бафф / защита лица и шеи', t <= -12 ? 3 : 1);

  if (hike && !wearMid && (t <= 15 || durationHours >= 2)) {
    add(carry, 'mid-top', 'Сухой утепляющий слой на остановку и спуск', t <= 3 ? 3 : 2);
  }
  if (hike && !wet && !wind && t >= -6 && t <= 17) {
    const shell = pick('shell', 1, { windproof: true });
    if (shell) carry.push({ category: 'shell', label: 'Защита от ветра на вершине', item: shell });
  }

  if (hike) advice.push('На подъёме регулируйте слои, чтобы не вспотеть; на остановке сразу утеплитесь.');
  else advice.push('Начните чуть прохладно: при непрерывном беге тело быстро согреется.');
  if (wet && t <= 10) advice.push('В сырость избегайте хлопка и держите сухой слой для возвращения.');
  if (wind) advice.push('На открытой вершине порывы могут быть сильнее модельного прогноза.');
  if (t >= 27) advice.push('Выберите более прохладное время, возьмите воду и сократите нагрузку при перегреве.');
  if (t <= -15 || metrics.apparentMin <= -20) advice.push('Сильный холод: закройте открытые участки кожи и оцените, стоит ли выходить.');
  if (metrics.gustMax >= 60 || metrics.precipitationTotal >= 5) advice.push('Сильный ветер или осадки: проверьте условия перед выходом и возможность развернуться.');
  if (wardrobe.length === 0) advice.unshift('Добавьте свои вещи в гардероб, чтобы получить комплект по названиям.');

  const summary = hike
    ? (t <= 3 ? 'Для подъёма: тёплая база в движении и дополнительный слой в рюкзаке.'
      : 'Для подъёма: дышащая одежда в движении, запасной слой на остановку.')
    : (t <= 3 ? 'Для бега: утеплите базу и защитите открытые участки.'
      : 'Для бега: лёгкий комплект с защитой от погоды по необходимости.');

  return { wear, carry, missing: [...new Set(missing)], advice, summary,
    flags: { wet, wind, snow } };
}
