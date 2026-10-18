// Pick a photographed outfit whose visible silhouette best fits the selected
// pieces. The callouts always use the exact recommendation, including gaps.
export function selectMannequinPreset(result, metrics, activity) {
  const worn = result.wear ?? [];
  const named = category => worn.find(entry => entry.category === category)?.item?.name ?? '';
  const shell = named('shell').toLocaleLowerCase('ru-RU');
  const bottom = named('bottom').toLocaleLowerCase('ru-RU');
  const headwear = worn.find(entry => entry.category === 'head')?.item;
  const sunCap = headwear && /бейсболк|кепк/iu.test(headwear.name);
  const thinHat = headwear && !headwear.coversNeck && headwear.warmth <= 1 && !sunCap;
  const fleeceHat = headwear && !headwear.coversNeck && headwear.warmth === 2;
  const hasShorts = /шорт/u.test(bottom);
  const withPack = name => activity === 'hike' ? `${name}-hike` : name;

  if (/nordway/u.test(shell) || metrics.tempMin <= -20) {
    const base = withPack('mannequin-frost');
    return thinHat ? `${base}-thin-hat` : fleeceHat ? `${base}-fleece-hat` : base;
  }
  if (/софтшел/u.test(shell)) {
    const base = withPack('mannequin-softshell');
    return thinHat ? `${base}-thin-hat` : base;
  }
  if (/uniqlo/u.test(shell)) {
    const base = withPack(metrics.tempMin >= 22 && hasShorts ? 'mannequin-hot-rain' : 'mannequin-wind');
    if (base.includes('mannequin-wind'))
      return sunCap ? `${base}-cap` : thinHat ? `${base}-thin-hat` : base;
    return base;
  }
  if (/northland/u.test(shell)) {
    if (metrics.tempMin >= 6) {
      const base = withPack('mannequin-rain-mild');
      return thinHat ? `${base}-thin-hat` : base;
    }
    const base = activity === 'hike' ? 'mannequin-wet-zero' : 'mannequin-wet-zero-run';
    return thinHat ? `${base}-thin-hat` : base;
  }
  if (hasShorts) return withPack('mannequin-hot');
  const base = withPack('mannequin-mild');
  return sunCap ? `${base}-cap` : thinHat ? `${base}-thin-hat` : base;
}
