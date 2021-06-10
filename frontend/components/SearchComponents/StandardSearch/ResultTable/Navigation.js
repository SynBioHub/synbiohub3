import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setOffset } from '../../../../redux/actions';
import styles from '../../../../styles/resulttable.module.css';

/**
 * This component provides navigation (going through different offsets) for search
 * results in the search result table (found in standard search)
 */
export default function Navigation(properties) {
  const [previous, setPrevious] = useState(styles.disabled);
  const [next, setNext] = useState(styles.disabled);
  const offset = useSelector(state => state.search.offset);
  const limit = useSelector(state => state.search.limit);
  const dispatch = useDispatch();

  useEffect(() => {
    if (offset - limit >= 0) {
      setPrevious(styles.enabled);
    } else {
      setPrevious(styles.disabled);
    }

    if (offset + limit < properties.count) {
      setNext(styles.enabled);
    } else {
      setNext(styles.disabled);
    }
  }, [offset, properties.count, limit]);

  return (
    <div className={styles.navigation}>
      <div
        role="button"
        className={`${styles.tablebutton} ${previous}`}
        onClick={() => {
          if (previous !== styles.disabled) {
            dispatch(setOffset(offset - limit));
          }
        }}
      >
        «
      </div>

      <div className={styles.count}>
        <span className={styles.range}>
          {offset + 1}-{Math.min(offset + limit, properties.count)}
        </span>{' '}
        of {properties.count} result(s)
      </div>

      <div
        role="button"
        className={`${styles.tablebutton} ${next}`}
        onClick={() => {
          if (next !== styles.disabled) {
            dispatch(setOffset(offset + limit));
          }
        }}
      >
        »
      </div>
    </div>
  );
}
