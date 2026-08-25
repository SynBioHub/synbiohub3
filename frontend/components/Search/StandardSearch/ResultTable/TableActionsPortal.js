import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portals the result table's bulk-action buttons into the slot SearchHeader
 * always renders in its tab row, so every page that uses ResultTable gets
 * the buttons up there for free without needing its own dedicated row.
 */
export default function TableActionsPortal(properties) {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    setTarget(document.querySelector('#search-header-table-actions'));
  }, []);

  if (!target) return null;
  return createPortal(properties.children, target);
}
