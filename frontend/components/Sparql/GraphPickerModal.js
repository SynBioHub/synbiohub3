import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useMemo, useState } from 'react';

import modalStyles from '../../styles/modal.module.css';
import styles from '../../styles/sparql.module.css';
import {
  filterApplicationGraphs,
  filterGraphsBySearch,
  graphsFromSparqlBindings,
  LIST_GRAPHS_QUERY,
  usernameFromGraphUri
} from './sparqlShared';

/**
 * Lazy-loads the full graph list with a single SELECT DISTINCT query (no per-graph
 * COUNT(*)), then filters client-side. Avoids the classic SBH1 admin page hang.
 */
export default function GraphPickerModal({
  onClose,
  onSelect,
  fetchGraphs,
  uriPrefix,
  defaultGraph
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [graphs, setGraphs] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const results = await fetchGraphs(LIST_GRAPHS_QUERY);
        if (cancelled) return;
        const uris = filterApplicationGraphs(graphsFromSparqlBindings(results), {
          uriPrefix,
          defaultGraph
        }).sort((a, b) => a.localeCompare(b));
        setGraphs(uris);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load graphs');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchGraphs, uriPrefix, defaultGraph]);

  const filtered = useMemo(
    () => filterGraphsBySearch(graphs, search),
    [graphs, search]
  );

  return (
    <div className={modalStyles.outercontainer} role="dialog" aria-modal="true">
      <div className={`${modalStyles.container} ${styles.graphModal}`}>
        <div className={modalStyles.modalheader}>
          <h3 className={modalStyles.headertitle}>Select a graph</h3>
          <button
            type="button"
            className={styles.graphModalClose}
            onClick={onClose}
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <p className={styles.graphModalHint}>
          Search by username or any part of the graph URI. The full list is loaded once
          (no per-graph triple counts).
        </p>
        <div className={styles.graphModalSearch}>
          <FontAwesomeIcon icon={faSearch} className={styles.graphModalSearchIcon} />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by username or URI…"
            autoFocus
          />
        </div>
        {loading && <div className={styles.graphModalStatus}>Loading graphs…</div>}
        {error && <div className={styles.errormessage}>{error}</div>}
        {!loading && !error && (
          <ul className={styles.graphModalList}>
            {filtered.length === 0 && (
              <li className={styles.graphModalEmpty}>No graphs match.</li>
            )}
            {filtered.map(uri => {
              const user = usernameFromGraphUri(uri);
              return (
                <li key={uri}>
                  <button
                    type="button"
                    className={styles.graphModalItem}
                    onClick={() => onSelect(uri)}
                  >
                    {user && <span className={styles.graphModalUser}>{user}</span>}
                    <span className={styles.graphModalUri}>{uri}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
