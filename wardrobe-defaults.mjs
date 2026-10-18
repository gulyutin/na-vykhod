// Starter inventory supplied by the owner. Warmth is an editable planning estimate (1–4).
// Weather protection is enabled only where the model/description supports it.
export const PERSONAL_WARDROBE = [
  {
    name: 'Джемпер half-zip GRI Норд', category: 'mid-top', warmth: 2, firstLayer: true,
    activities: ['run', 'hike'],
    notes: 'Светлый бежево-серый меланж. Средняя теплота по вашей оценке; тонкий флисовый джемпер.',
  },
  {
    name: 'Джемпер half-zip GRI Винд', category: 'mid-top', warmth: 1, firstLayer: true,
    activities: ['run', 'hike'],
    notes: 'Тёмно-синий. Тонкий флисовый джемпер, но ощутимо тёплый; самый лёгкий из ваших трёх джемперов по личной оценке. Ветрозащиту модели стоит уточнить.',
  },
  {
    name: 'Брюки мужские GRI Джеди', category: 'bottom', warmth: 2,
    activities: ['run', 'hike'],
    notes: 'Тёмно-синие с заметным сине-фиолетовым оттенком. Средняя теплота среди ваших брюк по личной оценке.',
  },
  {
    name: 'Брюки Demix', category: 'bottom', warmth: 1,
    activities: ['run', 'hike'],
    notes: 'Светло-серые. Самые лёгкие из ваших брюк по личной оценке.',
  },
  {
    name: 'Брюки для беговых лыж Madshus', category: 'bottom', warmth: 3,
    activities: ['run', 'hike'],
    notes: 'Чёрные. Самые тёплые из ваших брюк по личной оценке; защита от осадков не подтверждена.',
  },
  {
    name: 'Термобельё — верх', category: 'base-top', warmth: 2,
    activities: ['run', 'hike'],
    notes: 'Часть указанного комплекта; модель и плотность неизвестны. Уточните теплоту.',
  },
  {
    name: 'Термобельё — низ', category: 'base-bottom', warmth: 2,
    activities: ['run', 'hike'],
    notes: 'Часть указанного комплекта; модель и плотность неизвестны. Уточните теплоту.',
  },
  {
    name: 'Шапка Madshus', category: 'head', warmth: 1,
    activities: ['run', 'hike'],
    notes: 'Лёгкая спортивная шапка; оцените теплоту по ощущениям.',
  },
  {
    name: 'Куртка мембранная Northland Glodis', category: 'shell', warmth: 2,
    windproof: true, waterproof: true, activities: ['run', 'hike'],
    notes: 'Приглушённая тёмно-зелёная с бирюзовым оттенком. Средняя теплота по вашей оценке; мембранная защита от осадков и ветра.',
  },
  {
    name: 'Оранжевая ветровка Uniqlo', category: 'shell', warmth: 1,
    windproof: true, waterproof: false, activities: ['run', 'hike'],
    notes: 'Очень тонкая; защита от дождя не подтверждена.',
  },
  {
    name: 'Шапка флисовая', category: 'head', warmth: 2,
    activities: ['run', 'hike'],
    notes: 'Хаки. Теплота оценена ориентировочно; плотность флиса не указана.',
  },
  {
    name: 'Куртка софтшелл', category: 'shell', warmth: 3,
    windproof: true, waterproof: false, activities: ['run', 'hike'],
    notes: 'Тёмная сине-зелёная, петрольного оттенка. Теплее мембраны Northland и легче лыжной Nordway по вашей оценке. Ветрозащита ориентировочная; защита от дождя не подтверждена.',
  },
  {
    name: 'Куртка для беговых лыж Nordway', category: 'shell', warmth: 4,
    windproof: true, waterproof: true,
    activities: ['run', 'hike'],
    notes: 'Ярко-синяя, кобальтового оттенка. Самая тёплая из ваших курток; мембрана 3K/3K, в сильный дождь защита ограничена.',
  },
  {
    name: 'Джемпер флисовый Glissade', category: 'mid-top', warmth: 3,
    activities: ['run', 'hike'],
    notes: 'Светло-серый, тонкий флис без пушистого ворса. Самый тёплый из ваших джемперов по личной оценке.',
  },
  {
    name: 'Шорты Athlex', category: 'bottom', warmth: 1,
    activities: ['run', 'hike'],
    notes: 'Чёрные. Лёгкий низ для тепла.',
  },
  {
    name: 'ASICS GEL-FujiSetsu 3 G-TX', category: 'shoes', warmth: 2,
    waterproof: true, activities: ['run', 'hike'], surfaces: ['ice'],
    notes: 'Чёрные с зелёными вставками и шнурками. Зимний трейл и лёд; мембрана GORE-TEX. Проверьте состояние шипов перед выходом.',
  },
  {
    name: 'ASICS Gel-Sonoma 8', category: 'shoes', warmth: 1,
    activities: ['run', 'hike'], surfaces: ['trail', 'dry', 'snow'],
    notes: 'Чёрные с мятными вставками и шнурками. Для грунта и снега на асфальте; на гололёде сцепления может быть недостаточно.',
  },
  {
    name: 'ASICS Novablast 5', category: 'shoes', warmth: 1,
    activities: ['run'], surfaces: ['dry'],
    notes: 'Оранжевая лимитированная версия Tokyo. Шоссейные кроссовки для сухого покрытия.',
  },
  {
    name: 'Бейсболка ASICS', category: 'head', warmth: 1,
    activities: ['run', 'hike'],
    notes: 'Лёгкая кепка для солнца; модель и цвет не указаны.',
  },
  {
    name: 'Тёплый бафф', category: 'neck', warmth: 2,
    activities: ['run', 'hike'],
    notes: 'Тёплая защита шеи; модель и материал не указаны.',
  },
  {
    name: 'Лёгкий бафф «Большая волна»', category: 'neck', warmth: 1,
    activities: ['run', 'hike'],
    notes: 'Тонкий бафф с сине-белым рисунком в духе «Большой волны в Канагаве».',
  },
  {
    name: 'Балаклава флисовая', category: 'head', warmth: 3,
    coversNeck: true, activities: ['run', 'hike'],
    notes: 'Синяя. Для мороза: закрывает голову, лицо и шею; теплота ориентировочная.',
  },
  {
    name: 'Перчатки тонкие беговые', category: 'hands', warmth: 1,
    activities: ['run', 'hike'],
    notes: 'Лёгкие перчатки для прохлады; модель не указана.',
  },
  {
    name: 'Тёплые варежки GRI (тип Полар)', category: 'hands', warmth: 3,
    activities: ['run', 'hike'],
    notes: 'Тёмно-синие с оттенком индиго, как брюки Джеди. По описанию похожи на варежки GRI Полар; точную модель уточните при случае.',
  },
];

// Refresh only stock color wording; keep every other browser edit intact.
const COLOR_NOTE_REVISIONS = new Map([
  ['Джемпер half-zip GRI Норд', [
    ['Какао. Светлое какао, как кофе с молоком.', 'Светлый бежево-серый меланж.'],
    ['Светлое какао, как кофе с молоком.', 'Светлый бежево-серый меланж.'],
    ['Какао.', 'Светлый бежево-серый меланж.'],
  ]],
  ['Брюки мужские GRI Джеди', [
    ['Тёмно-синие.', 'Тёмно-синие с заметным сине-фиолетовым оттенком.'],
  ]],
  ['Куртка мембранная Northland Glodis', [
    ['Сине-зелёная.', 'Приглушённая тёмно-зелёная с бирюзовым оттенком.'],
  ]],
  ['Куртка софтшелл', [
    ['Сине-зелёная.', 'Тёмная сине-зелёная, петрольного оттенка.'],
  ]],
  ['Куртка для беговых лыж Nordway', [
    ['Яркая светло-синяя.', 'Ярко-синяя, кобальтового оттенка.'],
    ['Голубая.', 'Ярко-синяя, кобальтового оттенка.'],
  ]],
  ['Тёплые варежки GRI (тип Полар)', [
    ['Тёмно-синие, как брюки Джеди.', 'Тёмно-синие с оттенком индиго, как брюки Джеди.'],
  ]],
]);

export function refreshWardrobeColors(wardrobe) {
  for (const item of wardrobe) {
    for (const [oldColor, newColor] of COLOR_NOTE_REVISIONS.get(item.name) ?? []) {
      if (item.notes?.startsWith(oldColor)) {
        item.notes = newColor + item.notes.slice(oldColor.length);
        break;
      }
    }
  }
  return wardrobe;
}
