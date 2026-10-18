import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendOutfit, summarizeForecast } from '../logic.mjs';

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

test('cold wet hike selects rain shell and puts insulation in pack', () => {
  const wardrobe = [
    item('Термолонгслив', 'base-top', 3),
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
  assert.equal(result.carry.find(x => x.category === 'mid-top').item.name, 'Флис');
  assert.equal(result.missing.length, 0);
});

test('warm dry run does not add shell or cold-weather accessories', () => {
  const metrics = { tempMin: 22, tempMax: 24, apparentMin: 22, probabilityMax: 5,
    precipitationTotal: 0, windMax: 8, gustMax: 12, codes: [1] };
  const result = recommendOutfit(metrics, [], 'run', 1);
  assert.deepEqual(result.wear.map(x => x.category), ['base-top', 'bottom', 'shoes']);
  assert.equal(result.carry.length, 0);
});

test('missing rain protection is explicit even when a windbreaker is available', () => {
  const metrics = { tempMin: 7, tempMax: 9, apparentMin: 5, probabilityMax: 65,
    precipitationTotal: 0.7, windMax: 10, gustMax: 18, codes: [61] };
  const result = recommendOutfit(metrics, [item('Ветровка', 'shell', 1, { windproof: true })], 'run', 1);
  assert.ok(result.missing.some(x => x.includes('Влагозащитный слой')));
});
