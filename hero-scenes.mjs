// All scenes depict the same Karaulnaya Gora route. A sparse set of weather
// and temperature photographs is combined with the exact outfit in the UI.
export function weatherIconName(code) {
  if (code === 0) return 'sun';
  if (code <= 2) return 'partly';
  if (code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloud';
}

export function heroWeather(codes = []) {
  if (!codes.length) return 'cloud';
  const conditions = codes.map(weatherIconName);
  if (conditions.includes('snow')) return 'snow';
  if (conditions.some(condition => condition === 'rain' || condition === 'storm')) return 'rain';
  if (conditions.some(condition => condition === 'cloud' || condition === 'fog')) return 'cloud';
  return 'clear';
}

export function heroThermal(metrics) {
  // Winter scene wins if the outing crosses bands; otherwise show expected heat.
  if (metrics.tempMin <= -25) return 'frost';
  if (metrics.tempMin <= 0) return 'cold';
  if (metrics.tempMax >= 35) return 'extreme';
  if (metrics.tempMax >= 30) return 'hot';
  return 'mild';
}

export function heroAsset(weather, thermal) {
  if (thermal === 'mild') return `hero-${weather}`;
  const available = {
    extreme: { clear: 'hero-clear-hot', cloud: 'hero-cloud-hot', rain: 'hero-rain-extreme' },
    hot: { clear: 'hero-clear-hot', cloud: 'hero-cloud-hot', rain: 'hero-rain-hot' },
    cold: { clear: 'hero-clear-cold', cloud: 'hero-clear-cold', rain: 'hero-rain-cold', snow: 'hero-snow-cold' },
    frost: { clear: 'hero-clear-frost', cloud: 'hero-clear-frost', rain: 'hero-rain-cold', snow: 'hero-snow-frost' },
  };
  return available[thermal]?.[weather] || `hero-${weather}`;
}

export function selectHeroScene(metrics) {
  const codes = metrics.codes ?? [];
  const weather = heroWeather(codes);
  const thermal = heroThermal(metrics);
  const asset = heroAsset(weather, thermal);
  const fallback = `hero-${weather}`;
  const outlookCode = codes.find(code => {
    const condition = weatherIconName(code);
    return weather === 'snow' ? condition === 'snow'
      : weather === 'rain' ? condition === 'rain' || condition === 'storm'
        : weather === 'cloud' ? condition === 'cloud' || condition === 'fog' : true;
  }) ?? codes[0] ?? 3;
  return { weather, thermal, asset, fallback, outlookCode };
}
