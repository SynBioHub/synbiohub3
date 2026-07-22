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
  const totalPages = Math.ceil(properties.count / limit);
  const currentPage = Math.floor(offset / limit) + 1;

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

  const handlePageClick = pageNum => {
    dispatch(setOffset((pageNum - 1) * limit));
  };

  // Calculate visible page range (initial 5 pages, then 5 left + 4 right = total 10)
  const pageNumbers = [];
  const maxPagesToShow = 10;

  // Case 1: show first 5 pages if user is still near the beginning
  let startPage, endPage;
  if (currentPage <= 5) {
    startPage = 1;
    endPage = Math.min(totalPages, 5);
  }
  // Case 2: later pages: always show 5 pages to the left and 4 to the right (10 total)
  else {
    startPage = Math.max(1, currentPage - 5);
    endPage = Math.min(totalPages, currentPage + 4);

    // Adjust window if near the end so total 10 pages visible
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
  }

  // Push numbers to array
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className={styles.navigation}>
      <div className={styles.pagecluster}>
        {/* Previous */}
        <div
          role="button"
          className={`${styles.pagebubble} ${previous}`}
          onClick={() =>
            previous !== styles.disabled && dispatch(setOffset(offset - limit))
          }
        >
          «
        </div>

        {/* Page numbers */}
        <div className={styles.pagenumbers}>
          {pageNumbers.map(num => (
            <div
              key={num}
              role="button"
              onClick={() => handlePageClick(num)}
              className={`${styles.pagebubble} ${
                num === currentPage ? styles.pagebubbleactive : ''
              }`}
            >
              {num}
            </div>
          ))}
        </div>

        {/* Next */}
        <div
          role="button"
          className={`${styles.pagebubble} ${next}`}
          onClick={() =>
            next !== styles.disabled && dispatch(setOffset(offset + limit))
          }
        >
          »
        </div>
      </div>
    </div>
  );
}
