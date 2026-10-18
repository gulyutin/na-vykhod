export const CATEGORIES = {
  'base-top': 'Базовый верх',
  'base-bottom': 'Термобельё под брюки',
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

// The hourly point at the start of "now" may lag behind the live observation.
export function includeCurrentConditions(metrics, current) {
  if (!current) return metrics;
  const observed = (field) => Number(current[field]);
  const finite = (field) => current[field] != null && Number.isFinite(observed(field));
  const currentTemperature = observed('temperature_2m');
  const currentGust = observed('wind_gusts_10m');
  const code = observed('weather_code');
  return {
    ...metrics,
    tempMin: finite('temperature_2m') ? Math.min(metrics.tempMin, currentTemperature) : metrics.tempMin,
    tempMax: finite('temperature_2m') ? Math.max(metrics.tempMax, currentTemperature) : metrics.tempMax,
    apparentMin: finite('apparent_temperature')
      ? Math.min(metrics.apparentMin, observed('apparent_temperature')) : metrics.apparentMin,
    windMax: finite('wind_speed_10m')
      ? Math.max(metrics.windMax, observed('wind_speed_10m')) : metrics.windMax,
    gustMax: finite('wind_gusts_10m') ? Math.max(metrics.gustMax, currentGust) : metrics.gustMax,
    precipitationTotal: finite('precipitation')
      ? Math.max(metrics.precipitationTotal, Math.max(0, observed('precipitation')))
      : metrics.precipitationTotal,
    codes: finite('weather_code') ? [code, ...metrics.codes] : metrics.codes,
    coldestTime: finite('temperature_2m') && currentTemperature < metrics.tempMin
      ? current.time ?? metrics.coldestTime : metrics.coldestTime,
    windiestTime: finite('wind_gusts_10m') && currentGust > metrics.gustMax
      ? current.time ?? metrics.windiestTime : metrics.windiestTime,
  };
}

export function weatherLabel(code) {
  if (code === 0) return 'Ясно';
  if (code === 1 || code === 2) return 'Переменная облачность';
  if (code === 3) return 'Облачно';
  if (code === 45 || code === 48) return 'Туман';
  if (code >= 51 && code <= 67) return 'Дождь';
  if (code >= 71 && code <= 77) return 'Снег';
  if (code >= 80 && code <= 82) return 'Ливень';
  if (code >= 85 && code <= 86) return 'Снегопад';
  if (code >= 95) return 'Гроза';
  return 'Переменная погода';
}

export function recommendOutfit(metrics, wardrobe, activity, durationHours, surface = 'dry') {
  const hike = activity === 'hike';
  const t = metrics.tempMin;
  const codes = metrics.codes ?? [];
  const snowyCode = codes.some(code => (code >= 71 && code <= 77) || code === 85 || code === 86);
  const rainyCode = codes.some(code => (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) || code >= 95);
  const wet = metrics.probabilityMax >= 50 || metrics.precipitationTotal >= 0.3 ||
    snowyCode || rainyCode;
  // Dry snow in sustained frost calls for wind protection, not necessarily a rain shell.
  const waterproofNeeded = rainyCode || (wet && (t > -3 || metrics.tempMax >= -1));
  const wind = metrics.windMax >= 25 || metrics.gustMax >= 40;
  const feelsCold = t > 1 && t <= 12 && metrics.apparentMin <= 2 &&
    metrics.apparentMin <= t - 5;
  const extremeCold = t <= -30 || metrics.apparentMin <= -35;
  const extremeHeat = metrics.tempMax >= 35;
  const hotRain = wet && t >= (hike ? 25 : 22);
  const lightRainShell = rainyCode && hotRain && !extremeHeat;
  const snow = snowyCode || (wet && t <= 1 && !rainyCode);
  const wear = [];
  const carry = [];
  const missing = [];
  const advice = [];
  const used = new Set();

  function pick(category, target, required = {}) {
    const mayWearJumperFirst = category === 'base-top' &&
      t >= (hike || waterproofNeeded || wind ? -3 : -8) && t <= 16;
    const candidates = wardrobe.filter(item => (item.category === category ||
      (mayWearJumperFirst && item.category === 'mid-top' && item.firstLayer)) &&
      (item.activities?.includes(activity) ?? true) && !used.has(item.id) &&
      (required.minWarmth == null || item.warmth >= required.minWarmth));
    candidates.sort((a, b) => {
      const score = item => Math.abs(item.warmth - target) * 3 +
        (item.warmth < target ? 2 : 0) +
        (required.waterproof && !item.waterproof ? 12 : 0) +
        (required.windproof && !item.windproof && !item.waterproof ? 8 : 0) +
        (required.surface && item.surfaces?.length && !item.surfaces.includes(required.surface) ? 30 : 0) +
        (required.surface === 'dry' && activity === 'run' &&
          item.surfaces?.length === 1 && item.surfaces[0] === 'dry' ? -2 : 0) +
        (required.surface === 'dry' && activity === 'hike' &&
          item.surfaces?.includes('trail') ? -1 : 0) +
        (required.sunCap && !/бейсболк|кепк/i.test(item.name) ? 20 : 0) +
        (mayWearJumperFirst && item.category === 'mid-top' ? -4 : 0) +
        (category === 'bottom' && /шорт/i.test(item.name) ?
          (t >= (hike ? 23 : 20) ? -4 : t <= 16 ? 12 : 0) : 0);
      return score(a) - score(b);
    });
    const item = candidates[0] ?? null;
    if (item) used.add(item.id);
    return item;
  }

  function add(targetList, category, label, warmth, required = {}) {
    const item = pick(category, warmth, required);
    const unsuitableSurface = required.surface && item?.surfaces?.length &&
      !item.surfaces.includes(required.surface);
    const unsuitableWarmth = category === 'base-top' && warmth === 1 &&
      !required.permitWarmerFirstLayer && item?.warmth > 1;
    const unsuitableCap = required.sunCap && item && !/бейсболк|кепк/i.test(item.name);
    targetList.push({ category, label, item: unsuitableSurface || unsuitableWarmth || unsuitableCap ? null : item });
    if (!item) missing.push(label);
    else if (unsuitableSurface)
      missing.push(`Обувь для покрытия «${surface === 'ice' ? 'лёд / гололёд' : surface === 'snow' ? 'снег на асфальте' : surface === 'trail' ? 'грунт / мокро' : 'сухая лестница'}» вместо «${item.name}»`);
    else if (unsuitableWarmth)
      missing.push(`Лёгкий верх для тепла вместо «${item.name}»`);
    else if (unsuitableCap) missing.push(`Кепка от солнца вместо «${item.name}»`);
    else if (required.waterproof && !item.waterproof) missing.push(`Влагозащитный слой вместо «${item.name}»`);
    else if (required.windproof && !item.windproof && !item.waterproof) missing.push(`Ветрозащитный слой вместо «${item.name}»`);
    else if (category === 'shoes' && t <= -15 && item.warmth < 2)
      missing.push(`Нет подтверждённой тёплой обуви для сильного мороза на этом покрытии; «${item.name}» показаны как доступная пара`);
    return unsuitableSurface || unsuitableWarmth || unsuitableCap ? null : item;
  }

  // A dense shell can trap heat during a hot outing, even in rain or wind.
  const shellNeeded = (wet && !hotRain) || lightRainShell ||
    (wind && t < (hike ? 22 : 20)) ||
    feelsCold || t <= (hike ? 3 : 1);
  // Near zero, a shell supplies the outer warmth; start with the lightest
  // garment the owner permits directly against the skin.
  const lightFirstLayer = shellNeeded && t >= -3 && t <= 3;
  const baseWarmth = lightFirstLayer ? 1 : t >= 10 ? 1 : t >= 3 ? 2 : 3;
  const bottomWarmth = t >= 3 ? 1 : t >= -8 ? 2 : 3;
  const firstTop = add(wear, 'base-top', t >= 17 ? 'Лёгкий дышащий верх' : 'Первый слой на тело',
    baseWarmth, { permitWarmerFirstLayer: lightFirstLayer });
  if (t <= (hike ? -5 : -8))
    add(wear, 'base-bottom', 'Термобельё под брюки', t <= -15 ? 3 : 2);
  add(wear, 'bottom', t >= 18 ? 'Лёгкий низ' : 'Основной слой для ног', bottomWarmth);
  add(wear, 'shoes', hike ? 'Обувь для подъёма' : 'Беговая обувь', surface === 'ice' ? 2 : 1,
    { surface });

  const jumperIsFirstLayer = firstTop?.category === 'mid-top';
  const wearMid = (hike ? t <= 3 : t <= 0) && !jumperIsFirstLayer;
  if (wearMid) add(wear, 'mid-top', 'Утепляющий слой', t <= -12 ? 3 : t <= -4 ? 2 : 1);
  if (shellNeeded) {
    const shellWarmth = lightRainShell ? 1 : t <= -14 ? 4 : t <= -5 ? 3 :
      t <= 1 || (hike && t <= 3) || (waterproofNeeded && t <= 5) ? 2 : 1;
    const shellLabel = waterproofNeeded
      ? (snow ? 'Защита от мокрого снега' : 'Защита от дождя')
      : snow ? 'Защита от снега и ветра' : 'Защита от холода и ветра';
    const shell = add(wear, 'shell', shellLabel, shellWarmth,
      waterproofNeeded && !lightRainShell ? { waterproof: true } : { windproof: true });
    if (lightRainShell && shell && !shell.waterproof)
      missing.push(`У «${shell.name}» не подтверждена защита от сильного дождя`);
  }
  let headwear = null;
  if (t <= 5 || (wet && t <= 12))
    headwear = add(wear, 'head', 'Головной убор', t <= -15 ? 3 : t <= 0 ? 2 : 1);
  else if (t >= 20 && metrics.codes.some(code => code <= 2))
    headwear = add(wear, 'head', 'Кепка от солнца', 1, { sunCap: true });
  if (t <= 2 || (wind && t <= 8)) add(wear, 'hands', 'Перчатки', t <= -8 ? 3 : 1);
  if ((t <= -9 || (wind && t <= 0)) && !headwear?.coversNeck)
    add(wear, 'neck', 'Бафф / защита лица и шеи', t <= -8 ? 2 : 1);

  const wornJumper = wear.find(entry => entry.item?.category === 'mid-top')?.item;
  const warmerThanWorn = wornJumper ? { minWarmth: wornJumper.warmth + 1 } : {};

  if (hike && !wearMid && (t <= 15 || (durationHours >= 2 && t < 25))) {
    add(carry, 'mid-top', 'Сухой утепляющий слой на остановку и спуск',
      t <= 3 ? 3 : 2, warmerThanWorn);
  }
  if (hike && wearMid && t <= 5) {
    add(carry, 'mid-top', 'Дополнительный слой на остановку и спуск',
      t <= -8 ? 3 : 2, warmerThanWorn);
  }
  if (hike && !wet && !wind && t >= -6 && t <= 17 &&
    !wear.some(entry => entry.category === 'shell' && entry.item)) {
    const shell = pick('shell', 1, { windproof: true });
    if (shell) carry.push({ category: 'shell', label: 'Защита от ветра на вершине', item: shell });
  }

  if (hike) advice.push('На подъёме регулируйте слои, чтобы не вспотеть; на остановке сразу утеплитесь.');
  else advice.push('Начните чуть прохладно: при непрерывном беге тело быстро согреется.');
  if (wet && t <= 10) advice.push('В сырость избегайте хлопка и держите сухой слой для возвращения.');
  if (wind) advice.push('На открытой вершине порывы могут быть сильнее модельного прогноза.');
  if (surface === 'ice') advice.push('На льду выбирайте обувь с надёжным сцеплением; очищенная сухая лестница требует другой пары.');
  if (surface === 'snow') advice.push('Для снега на асфальте подойдут трейловые кроссовки; при гололёде переключите покрытие на лёд.');
  if (snow && surface === 'dry') advice.push('Если на лестнице появился снег или лёд, переключите покрытие в параметрах выхода.');
  if (codes.some(code => [56, 57, 66, 67].includes(code)) && surface !== 'ice')
    advice.push('Ледяной дождь может быстро покрыть лестницу льдом: проверьте покрытие и при необходимости выберите «лёд / гололёд».');
  if (surface === 'trail' && wet) advice.push('На мокром грунте и ступенях проверяйте сцепление подошвы.');
  if (t <= -15 && wear.find(entry => entry.category === 'shoes')?.item?.warmth < 2)
    advice.push('Выбранная обувь не отмечена как зимняя: проверьте теплоту носков и стоп во время выхода.');
  if (metrics.tempMax >= 27) advice.push('Выберите более прохладное время, возьмите воду и сократите нагрузку при перегреве.');
  if (t <= -15 || metrics.apparentMin <= -20) advice.push('Сильный холод: закройте открытые участки кожи и оцените, стоит ли выходить.');
  if (extremeCold) {
    missing.push('Нет подтверждённого комплекта для экстремального мороза: нужна проверенная тёплая обувь и защита всех открытых участков кожи');
    advice.unshift('Экстремальный мороз: перенесите пробежку или подъём; перечисленные вещи не подтверждены для таких условий.');
  }
  if (extremeHeat)
    advice.unshift('Экстремальная жара: перенесите бег или подъём на более прохладное время; одежда не устраняет риск перегрева.');
  if (hotRain)
    advice.push('В тёплый дождь плотная мембрана может перегреть: выбирайте лёгкую защиту и следите за грозой.');
  if (lightRainShell)
    advice.push('В жару расстегните или снимите лёгкую ветровку, если становится душно.');
  if (metrics.gustMax >= 60 || metrics.precipitationTotal >= 5) advice.push('Сильный ветер или осадки: проверьте условия перед выходом и возможность развернуться.');
  if (wardrobe.length === 0) advice.unshift('Добавьте свои вещи в гардероб, чтобы получить комплект по названиям.');

  const extraLayerPacked = carry.some(entry => entry.category === 'mid-top' && entry.item);
  let summary;
  if (extremeCold)
    summary = 'Экстремальный мороз: ваш комплект не подтверждён для выхода; перенесите пробежку или подъём.';
  else if (extremeHeat)
    summary = 'Экстремальная жара: перенесите пробежку или подъём на более прохладное время.';
  else if (hike && t <= 3)
    summary = extraLayerPacked
      ? 'Для подъёма: тёплая база в движении и дополнительный слой в рюкзаке.'
      : 'Для подъёма: тёплые слои в движении; на остановку нужен дополнительный сухой слой.';
  else if (hike)
    summary = 'Для подъёма: дышащая одежда в движении, запасной слой на остановку.';
  else
    summary = t <= 3
      ? 'Для бега: утеплите базу и защитите открытые участки.'
      : 'Для бега: лёгкий комплект с защитой от погоды по необходимости.';

  return { wear, carry, missing: [...new Set(missing)], advice, summary,
    flags: { wet, wind, snow } };
}
