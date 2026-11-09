import { useEffect, useState } from 'react';

import styles from '../../styles/view.module.css';

/**
 * Collapsible localStorage dump for inspecting keys/values on view pages.
 */
export default function LocalStorageDebug() {
  const [entries, setEntries] = useState([]);

  const refresh = () => {
    if (typeof window === 'undefined' || !window.localStorage) {
      setEntries([]);
      return;
    }

    const next = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      next.push({ key, value: localStorage.getItem(key) });
    }
    next.sort((a, b) => a.key.localeCompare(b.key));
    setEntries(next);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <details className={styles.localStorageDebug} onToggle={event => {
      if (event.target.open) {
        refresh();
      }
    }}>
      <summary className={styles.localStorageDebugSummary}>
        localStorage ({entries.length})
      </summary>
      <div className={styles.localStorageDebugBody}>
        <button
          type="button"
          className={styles.localStorageDebugRefresh}
          onClick={refresh}
        >
          Refresh
        </button>
        {entries.length === 0 ? (
          <p className={styles.localStorageDebugEmpty}>localStorage is empty.</p>
        ) : (
          <pre className={styles.localStorageDebugPre}>
            {entries
              .map(({ key, value }) => `${key}\n${value}`)
              .join('\n\n')}
          </pre>
        )}
      </div>
    </details>
  );
}
