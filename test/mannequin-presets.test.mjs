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
  assert.equal(preset(metrics(0, 71, 90), 'hike', 'snow'), 'mannequin-wet-zero');
  assert.equal(preset(metrics(0, 71, 90), 'run', 'snow'), 'mannequin-wet-zero-run');
  assert.equal(preset(metrics(10), 'run', 'trail'), 'mannequin-mild');
  assert.equal(preset(metrics(30, 61, 90), 'run', 'trail'), 'mannequin-hot-rain');
  assert.equal(preset(metrics(30, 61, 90), 'hike', 'trail'), 'mannequin-hot-rain-hike');
  assert.equal(preset(metrics(40), 'run', 'dry'), 'mannequin-hot');
  assert.equal(preset(metrics(-11), 'run', 'trail'), 'mannequin-softshell');
  assert.equal(preset(metrics(-35), 'hike', 'ice'), 'mannequin-frost-hike');
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
