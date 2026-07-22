import { useDispatch, useSelector } from 'react-redux';

import { setOffset } from '../../../../redux/actions';
import { LIMIT } from '../../../../redux/types';
import styles from '../../../../styles/resulttable.module.css';

/**
 * Shows the "Showing X - Y of Z" result count and the results-per-page
 * selector for the search result table (found in standard search)
 */
export default function ResultsMeta(properties) {
  const offset = useSelector(state => state.search.offset);
  const limit = useSelector(state => state.search.limit);
  const dispatch = useDispatch();

  const handleLimitChange = event => {
    const newLimit = Number(event.target.value);
    dispatch({ type: LIMIT, payload: newLimit });
    dispatch(setOffset(0));
  };

  return (
    <div className={styles.pagemeta}>
      <div className={styles.count}>
        Showing{' '}
        <strong>
          {Math.min(properties.count, offset + 1)} -{' '}
          {Math.min(offset + limit, properties.count)}
        </strong>{' '}
        of {properties.count} result(s)
      </div>

      <div className={styles.limitgroup}>
        <label htmlFor="limit">Results per page:</label>
        <select
          id="limit"
          value={limit}
          onChange={handleLimitChange}
          className={styles.limitselect}
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
