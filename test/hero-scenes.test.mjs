import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { selectHeroScene } from '../hero-scenes.mjs';

const assetPath = filename => fileURLToPath(new URL(`../assets/${filename}.webp`, import.meta.url));
const weatherCodes = { clear: 0, cloud: 3, rain: 61, snow: 71 };
const thermalTemperatures = { hot: 40, mild: 15, cold: -10, frost: -40 };

test('every weather and temperature band has an image or a real fallback', () => {
  for (const [weather, code] of Object.entries(weatherCodes)) {
    for (const [thermal, temperature] of Object.entries(thermalTemperatures)) {
      const scene = selectHeroScene({
        codes: [code], tempMin: temperature, tempMax: temperature,
      });
      assert.equal(scene.weather, weather);
      assert.equal(scene.thermal, thermal);
      assert.equal(scene.outlookCode, code);
      assert.ok(existsSync(assetPath(scene.asset)) || existsSync(assetPath(scene.fallback)),
        `${weather}/${thermal} must have a usable image`);
    }
  }
});

test('the selected outing window controls scenes at both extreme bounds', () => {
  assert.equal(selectHeroScene({ codes: [0], tempMin: 24, tempMax: 40 }).asset, 'hero-clear-hot');
  assert.equal(selectHeroScene({ codes: [71], tempMin: -40, tempMax: -35 }).asset, 'hero-snow-frost');
  assert.equal(selectHeroScene({ codes: [95], tempMin: 35, tempMax: 40 }).asset, 'hero-rain-hot');
  assert.equal(selectHeroScene({ codes: [3], tempMin: -25, tempMax: -20 }).asset, 'hero-clear-frost');
});

test('the most consequential condition in the outing drives the scene and icon', () => {
  const scene = selectHeroScene({ codes: [0, 3, 61, 71], tempMin: -8, tempMax: -2 });
  assert.equal(scene.asset, 'hero-snow-cold');
  assert.equal(scene.outlookCode, 71);
});
