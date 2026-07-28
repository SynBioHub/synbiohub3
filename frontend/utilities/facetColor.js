/**
 * Deterministically derives a solid dot color from a facet option's label,
 * so each option color without a maintained list.
 */
export function getFacetDotColor(label = '') {
  let hash = 0;
  for (let index = 0; index < label.length; index++) {
    hash = label.charCodeAt(index) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  return `hsl(${hue}, 55%, 45%)`;
}
