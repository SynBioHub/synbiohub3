/**
 * Deterministically derives a pastel badge color (background/border/text) from
 * a type name, so each distinct type (Component, Sequence, Promoter, ...) gets
 * its own consistent, visually distinct color without needing a maintained list.
 */
export function getTypeColor(type = 'Unknown') {
  let hash = 0;
  for (let index = 0; index < type.length; index++) {
    hash = type.charCodeAt(index) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  return {
    background: `hsl(${hue}, 68%, 94%)`,
    border: `hsl(${hue}, 45%, 80%)`,
    color: `hsl(${hue}, 55%, 32%)`
  };
}
