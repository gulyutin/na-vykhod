import assert from 'node:assert/strict';
import test from 'node:test';
import { PERSONAL_WARDROBE, refreshWardrobeColors } from '../wardrobe-defaults.mjs';

test('owner photo colors replace only former stock wording in a saved wardrobe', () => {
  const saved = [
    { name: 'Джемпер half-zip GRI Норд', warmth: 4,
      notes: 'Светлое какао, как кофе с молоком. Моя заметка о посадке.' },
    { name: 'Брюки мужские GRI Джеди', notes: 'Тёмно-синие. Моя заметка о размере.' },
    { name: 'Куртка мембранная Northland Glodis', notes: 'Сине-зелёная. Моя заметка.' },
    { name: 'Куртка софтшелл', notes: 'Сине-зелёная. Моя заметка.' },
    { name: 'Куртка для беговых лыж Nordway', notes: 'Яркая светло-синяя. Моя заметка.' },
    { name: 'Джемпер half-zip GRI Винд', notes: 'Свой цвет по моей оценке.' },
  ];
  refreshWardrobeColors(saved);
  assert.match(saved[0].notes, /^Светлый бежево-серый меланж\. Моя заметка о посадке\.$/u);
  assert.equal(saved[0].warmth, 4);
  assert.match(saved[1].notes, /^Тёмно-синие с заметным сине-фиолетовым оттенком\. Моя заметка о размере\.$/u);
  assert.match(saved[2].notes, /^Приглушённая тёмно-зелёная с бирюзовым оттенком\./u);
  assert.match(saved[3].notes, /^Тёмная сине-зелёная, петрольного оттенка\./u);
  assert.match(saved[4].notes, /^Ярко-синяя, кобальтового оттенка\./u);
  assert.equal(saved[5].notes, 'Свой цвет по моей оценке.');
  const afterFirstPass = saved.map(item => item.notes);
  refreshWardrobeColors(saved);
  assert.deepEqual(saved.map(item => item.notes), afterFirstPass);
});

test('new starter inventory uses the owner photo colors', () => {
  for (const name of ['Джемпер half-zip GRI Норд', 'Брюки мужские GRI Джеди',
    'Куртка мембранная Northland Glodis', 'Куртка софтшелл',
    'Куртка для беговых лыж Nordway']) {
    const item = PERSONAL_WARDROBE.find(candidate => candidate.name === name);
    assert.ok(item?.notes, `Missing color note for ${name}`);
    assert.ok(!/какао|светло-синяя|^Сине-зелёная\./u.test(item.notes), item.notes);
  }
});
