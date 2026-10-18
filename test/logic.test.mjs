import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendOutfit, summarizeForecast } from '../logic.mjs';
import { PERSONAL_WARDROBE } from '../wardrobe-defaults.mjs';

const item = (name, category, warmth = 1, extra = {}) => ({
  id: name, name, category, warmth, windproof: false, waterproof: false,
  activities: ['run', 'hike'], ...extra,
});

test('weather window takes the coldest hour, highest gust and precipitation across the outing', () => {
  const hourly = {
    time: [100, 200, 300, 400],
    temperature_2m: [8, 5, 2, 7],
    apparent_temperature: [7, 3, -1, 6],
    precipitation: [0, 0.4, 0.7, 0],
    precipitation_probability: [10, 60, 80, 5],
    wind_speed_10m: [10, 20, 30, 8],
    wind_gusts_10m: [15, 34, 49, 10],
    weather_code: [1, 61, 61, 1],
  };
  const result = summarizeForecast(hourly, 1, 2);
  assert.equal(result.tempMin, 2);
  assert.equal(result.gustMax, 49);
  assert.equal(result.probabilityMax, 80);
  assert.equal(result.precipitationTotal, 0.7);
  assert.deepEqual(result.indices, [1, 2, 3]);
});

test('near-freezing wet hike wears a shell and thin layer, with another layer in the pack', () => {
  const wardrobe = [
    item('Термолонгслив', 'base-top', 3),
    item('Тонкий джемпер', 'mid-top', 1),
    item('Флис', 'mid-top', 2),
    item('Мембрана', 'shell', 1, { windproof: true, waterproof: true }),
    item('Тайтсы', 'bottom', 3),
    item('Ботинки', 'shoes', 2),
    item('Шапка', 'head', 2),
    item('Перчатки', 'hands', 1),
  ];
  const metrics = { tempMin: 1, tempMax: 4, apparentMin: -3, probabilityMax: 80,
    precipitationTotal: 1, windMax: 28, gustMax: 45, codes: [61] };
  const result = recommendOutfit(metrics, wardrobe, 'hike', 2);
  assert.equal(result.wear.find(x => x.category === 'shell').item.name, 'Мембрана');
  assert.equal(result.wear.find(x => x.category === 'mid-top').item.name, 'Тонкий джемпер');
  assert.equal(result.carry.find(x => x.category === 'mid-top').item.name, 'Флис');
  assert.equal(result.missing.length, 0);
});

test('personal kit near zero uses Nord directly under membrane, and colder weather adds thermals', () => {
  const wardrobe = PERSONAL_WARDROBE.map((entry, index) => ({ ...entry, id: String(index) }));
  const metrics = { tempMin: -1, tempMax: 1, apparentMin: -3, probabilityMax: 0,
    precipitationTotal: 0, windMax: 7, gustMax: 21, codes: [0] };
  const nearZero = recommendOutfit(metrics, wardrobe, 'hike', 2, 'dry');
  assert.equal(nearZero.wear.find(x => x.category === 'base-top').item.name, 'Джемпер half-zip GRI Норд');
  assert.ok(!nearZero.wear.some(x => x.category === 'mid-top'));
  assert.equal(nearZero.wear.find(x => x.category === 'shell').item.name, 'Куртка мембранная Northland Glodis');
  const nearZeroRun = recommendOutfit({ ...metrics, tempMin: -0.4 }, wardrobe, 'run', 2, 'snow');
  assert.equal(nearZeroRun.wear.find(x => x.category === 'base-top').item.name, 'Джемпер half-zip GRI Норд');
  assert.ok(!nearZeroRun.wear.some(x => x.category === 'mid-top'));
  assert.equal(nearZeroRun.wear.find(x => x.category === 'shell').item.name, 'Куртка мембранная Northland Glodis');
  const colder = recommendOutfit({ ...metrics, tempMin: -8, tempMax: -6, apparentMin: -11 },
    wardrobe, 'hike', 2, 'dry');
  assert.equal(colder.wear.find(x => x.category === 'shell').item.name, 'Куртка софтшелл');
  assert.equal(colder.wear.find(x => x.category === 'base-top').item.name, 'Термобельё — верх');
});

test('warm dry run does not add shell or cold-weather accessories', () => {
  const metrics = { tempMin: 22, tempMax: 24, apparentMin: 22, probabilityMax: 5,
    precipitationTotal: 0, windMax: 8, gustMax: 12, codes: [1] };
  const result = recommendOutfit(metrics, [], 'run', 1);
  assert.deepEqual(result.wear.map(x => x.category), ['base-top', 'bottom', 'shoes', 'head']);
  assert.equal(result.wear.find(x => x.category === 'head').item, null);
  assert.equal(result.carry.length, 0);
});

test('sunny warm day chooses baseball cap ahead of a winter hat', () => {
  const metrics = { tempMin: 23, tempMax: 25, apparentMin: 23, probabilityMax: 0,
    precipitationTotal: 0, windMax: 8, gustMax: 11, codes: [0] };
  const result = recommendOutfit(metrics, [
    item('Шапка Madshus', 'head', 1), item('Бейсболка ASICS', 'head', 1),
  ], 'run', 1);
  assert.equal(result.wear.find(x => x.category === 'head').item.name, 'Бейсболка ASICS');
});

test('missing rain protection is explicit even when a windbreaker is available', () => {
  const metrics = { tempMin: 7, tempMax: 9, apparentMin: 5, probabilityMax: 65,
    precipitationTotal: 0.7, windMax: 10, gustMax: 18, codes: [61] };
  const result = recommendOutfit(metrics, [item('Ветровка', 'shell', 1, { windproof: true })], 'run', 1);
  assert.ok(result.missing.some(x => x.includes('Влагозащитный слой')));
});

test('shoe choice follows the route surface and cold layers stay separate', () => {
  const metrics = { tempMin: -10, tempMax: -8, apparentMin: -14, probabilityMax: 0,
    precipitationTotal: 0, windMax: 12, gustMax: 20, codes: [1] };
  const wardrobe = [
    item('Термобельё — низ', 'base-bottom', 2),
    item('Брюки', 'bottom', 2),
    item('Шипованные ASICS', 'shoes', 2, { surfaces: ['ice'] }),
    item('Дорожные ASICS', 'shoes', 1, { surfaces: ['dry'] }),
  ];
  const ice = recommendOutfit(metrics, wardrobe, 'run', 1, 'ice');
  const dry = recommendOutfit(metrics, wardrobe, 'run', 1, 'dry');
  assert.equal(ice.wear.find(x => x.category === 'shoes').item.name, 'Шипованные ASICS');
  assert.equal(dry.wear.find(x => x.category === 'shoes').item.name, 'Дорожные ASICS');
  assert.ok(dry.wear.some(x => x.category === 'base-bottom'));
  assert.ok(dry.wear.some(x => x.category === 'bottom'));
  const noIceShoes = recommendOutfit(metrics, wardrobe.filter(x => x.name !== 'Шипованные ASICS'), 'run', 1, 'ice');
  assert.equal(noIceShoes.wear.find(x => x.category === 'shoes').item, null);
  assert.ok(noIceShoes.missing.some(x => x.includes('Обувь для покрытия')));
});

test('hot weather prefers the listed shorts over light trousers', () => {
  const metrics = { tempMin: 26, tempMax: 28, apparentMin: 26, probabilityMax: 0,
    precipitationTotal: 0, windMax: 7, gustMax: 10, codes: [0] };
  const wardrobe = [item('Брюки GRI Джеди', 'bottom', 1), item('Шорты Athlex', 'bottom', 1)];
  const result = recommendOutfit(metrics, wardrobe, 'run', 1, 'dry');
  assert.equal(result.wear.find(x => x.category === 'bottom').item.name, 'Шорты Athlex');
});

test('snowy asphalt uses trail shoes while ice uses spikes', () => {
  const metrics = { tempMin: -2, tempMax: 0, apparentMin: -5, probabilityMax: 70,
    precipitationTotal: 0.4, windMax: 9, gustMax: 15, codes: [71] };
  const wardrobe = [
    item('ASICS Gel-Sonoma 8', 'shoes', 1, { surfaces: ['dry', 'trail', 'snow'] }),
    item('ASICS GEL-FujiSetsu 3 G-TX', 'shoes', 2, { surfaces: ['ice'] }),
  ];
  const snow = recommendOutfit(metrics, wardrobe, 'run', 1, 'snow');
  const ice = recommendOutfit(metrics, wardrobe, 'run', 1, 'ice');
  assert.equal(snow.wear.find(x => x.category === 'shoes').item.name, 'ASICS Gel-Sonoma 8');
  assert.equal(ice.wear.find(x => x.category === 'shoes').item.name, 'ASICS GEL-FujiSetsu 3 G-TX');
});

test('balaclava replaces a separate buff in deep frost', () => {
  const metrics = { tempMin: -18, tempMax: -16, apparentMin: -24, probabilityMax: 0,
    precipitationTotal: 0, windMax: 12, gustMax: 19, codes: [2] };
  const wardrobe = [
    item('Флисовая балаклава', 'head', 3, { coversNeck: true }),
    item('Тёплый бафф', 'neck', 2),
    item('Варежки GRI', 'hands', 3),
  ];
  const result = recommendOutfit(metrics, wardrobe, 'run', 1, 'ice');
  assert.equal(result.wear.find(x => x.category === 'head').item.name, 'Флисовая балаклава');
  assert.ok(!result.wear.some(x => x.category === 'neck'));
  assert.equal(result.wear.find(x => x.category === 'hands').item.name, 'Варежки GRI');
});
