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

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    dispatch({ type: LIMIT, payload: newLimit });
    dispatch(setOffset(0)); 
  };

  const handlePageClick = (pageNum) => {
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
    <div
      className={styles.navigation}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '0.75rem',
        fontFamily: 'inherit',
        fontSize: '0.95rem',
        color: '#333',
        flexWrap: 'wrap',
        paddingRight: '2rem',
      }}
    >
      {/* Previous */}
      <div
        role="button"
        className={`${styles.tablebutton} ${previous}`}
        onClick={() => previous !== styles.disabled && dispatch(setOffset(offset - limit))}
      >
        «
      </div>

      {/* Page numbers */}
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        {pageNumbers.map((num) => (
          <div
            key={num}
            role="button"
            onClick={() => handlePageClick(num)}
            style={{
              cursor: 'pointer',
              fontWeight: num === currentPage ? '700' : '400',
              color: num === currentPage ? '#D25627' : '#333',
              textDecoration: num === currentPage ? 'underline' : 'none',
            }}
          >
            {num}
          </div>
        ))}
      </div>

      {/* Next */}
      <div
        role="button"
        className={`${styles.tablebutton} ${next}`}
        onClick={() => next !== styles.disabled && dispatch(setOffset(offset + limit))}
      >
        »
      </div>

      {/* Showing X - Y of Z */}
      <div className={styles.count}>
        Showing {offset + 1} - {Math.min(offset + limit, properties.count)} of {properties.count} result(s)
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
            backgroundColor: '#ffffff',
            color: '#333',
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
