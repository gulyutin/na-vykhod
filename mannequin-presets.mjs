// Pick a photographed outfit whose visible silhouette best fits the selected
// pieces. The callouts always use the exact recommendation, including gaps.
export function selectMannequinPreset(result, metrics, activity) {
  const worn = result.wear ?? [];
  const named = category => worn.find(entry => entry.category === category)?.item?.name ?? '';
  const shell = named('shell').toLocaleLowerCase('ru-RU');
  const bottom = named('bottom').toLocaleLowerCase('ru-RU');
  const hasShorts = /шорт/u.test(bottom);
  const withPack = name => activity === 'hike' ? `${name}-hike` : name;

  if (/nordway/u.test(shell) || metrics.tempMin <= -20) return withPack('mannequin-frost');
  if (/софтшел/u.test(shell)) return withPack('mannequin-softshell');
  if (/uniqlo/u.test(shell))
    return withPack(metrics.tempMin >= 22 && hasShorts ? 'mannequin-hot-rain' : 'mannequin-wind');
  if (/northland/u.test(shell)) {
    if (metrics.tempMin >= 6) return withPack('mannequin-rain-mild');
    return activity === 'hike' ? 'mannequin-wet-zero' : 'mannequin-wet-zero-run';
  }
  if (hasShorts) return withPack('mannequin-hot');
  return withPack('mannequin-mild');
}
