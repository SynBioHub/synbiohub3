import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LIMIT } from '../../../../redux/types'; 
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

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    dispatch({ type: LIMIT, payload: newLimit });
    dispatch(setOffset(0)); 
  };

  return (
    <div className={styles.navigation}
    style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    color: '#333',
    flexWrap: 'wrap',
    paddingRight: '2rem',   //  shift everything slightly left
  }}
    >
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
          {Math.min(properties.count, offset + 1)}-
          {Math.min(offset + limit, properties.count)}
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
      {/* Results per page dropdown */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginLeft: '1rem',
          fontFamily: 'inherit',
        }}
      >
        <label htmlFor="limit" style={{ fontWeight: 500 }}>
          Results per page:
        </label>
        <select
          id="limit"
          value={limit}
          onChange={handleLimitChange}
          style={{
            fontFamily: 'inherit',
            fontSize: 'inherit',
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            backgroundColor: '#ffffff', // white background
            color: '#333'
          }}
          onFocus={(e) => (e.target.style.borderColor = '#D25627')}
          onBlur={(e) => (e.target.style.borderColor = '#ccc')}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
}
