import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { recommendOutfit } from '../logic.mjs';
import { selectMannequinPreset } from '../mannequin-presets.mjs';
import { PERSONAL_WARDROBE } from '../wardrobe-defaults.mjs';

const wardrobe = PERSONAL_WARDROBE.map((item, index) => ({ ...item, id: String(index) }));
const metrics = (temperature, code = 0, probability = 0) => ({
  tempMin: temperature, tempMax: temperature + 2, apparentMin: temperature - 2,
  probabilityMax: probability, precipitationTotal: probability ? 1 : 0,
  windMax: 12, gustMax: 22, codes: [code],
});
const preset = (weather, activity, surface) => {
  const result = recommendOutfit(weather, wardrobe, activity, activity === 'run' ? 1 : 3, surface);
  return selectMannequinPreset(result, weather, activity);
};

test('realistic mannequin follows jacket, activity, shorts and cold', () => {
  assert.equal(preset(metrics(0, 71, 90), 'hike', 'snow'), 'mannequin-wet-zero-thin-hat');
  assert.equal(preset(metrics(0, 71, 90), 'run', 'snow'), 'mannequin-wet-zero-run-thin-hat');
  assert.equal(preset(metrics(10), 'run', 'trail'), 'mannequin-mild');
  assert.equal(preset(metrics(30, 61, 90), 'run', 'trail'), 'mannequin-hot-rain');
  assert.equal(preset(metrics(30, 61, 90), 'hike', 'trail'), 'mannequin-hot-rain-hike');
  assert.equal(preset(metrics(40), 'run', 'dry'), 'mannequin-hot');
  assert.equal(preset(metrics(-11), 'run', 'trail'), 'mannequin-softshell-thin-hat');
  assert.equal(preset(metrics(-35), 'hike', 'ice'), 'mannequin-frost-hike');
});

test('mannequin headwear follows thin, fleece and balaclava recommendations', () => {
  assert.equal(preset(metrics(4), 'run', 'dry'), 'mannequin-mild-thin-hat');
  assert.equal(preset({ ...metrics(4), windMax: 28, gustMax: 45 }, 'run', 'dry'), 'mannequin-wind-thin-hat');
  assert.equal(preset(metrics(7, 61, 90), 'run', 'trail'), 'mannequin-rain-mild-thin-hat');
  assert.equal(preset(metrics(7, 61, 90), 'hike', 'trail'), 'mannequin-rain-mild-hike-thin-hat');
  assert.equal(preset(metrics(-12), 'hike', 'trail'), 'mannequin-softshell-hike');
  assert.equal(preset(metrics(-14), 'run', 'trail'), 'mannequin-frost-thin-hat');
  assert.equal(preset(metrics(-18), 'run', 'trail'), 'mannequin-frost-fleece-hat');
  assert.equal(preset(metrics(-18), 'hike', 'trail'), 'mannequin-frost-hike-fleece-hat');
  assert.equal(preset(metrics(-24), 'run', 'trail'), 'mannequin-frost');
  assert.equal(preset(metrics(20), 'hike', 'dry'), 'mannequin-mild-hike-cap');
  assert.equal(preset({ ...metrics(20), windMax: 28, gustMax: 45 }, 'hike', 'dry'), 'mannequin-wind-hike-cap');
});

test('every selected mannequin preset is an available photo', () => {
  const temperatures = [-40, -25, -15, -11, -2, 0, 7, 10, 20, 26, 32, 40];
  const weatherCodes = [[0, 0], [61, 90], [71, 90]];
  for (const temperature of temperatures) {
    for (const [code, probability] of weatherCodes) {
      for (const activity of ['run', 'hike']) {
        const weather = metrics(temperature, code, probability);
        const result = recommendOutfit(weather, wardrobe, activity, 2, code === 71 ? 'snow' : 'trail');
        const asset = selectMannequinPreset(result, weather, activity);
        const path = fileURLToPath(new URL(`../assets/${asset}.webp`, import.meta.url));
        assert.ok(existsSync(path), `${asset} missing for ${temperature} ${code} ${activity}`);
      }
    }
  }
});
