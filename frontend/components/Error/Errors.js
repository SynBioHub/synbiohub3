import { useSelector } from 'react-redux';
import { useState } from 'react';
import styles from '../../styles/error.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import Error from './Error';
import ErrorNavigation from './ErrorNavigation';
import ErrorClearer from './ErrorClearer';

/**
 * This component renders all errors in the store.
 * @returns
 */
export default function Errors({ errorsOverride }) {
  const [viewIndex, setViewIndex] = useState(0);
  const errors = errorsOverride || useSelector(state => state.errors.errors);
  if (errors.length === 0) return null;
  const error = errors[viewIndex];
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorHeaderContainer}>
        <div className={styles.errorTitle}>
          <FontAwesomeIcon icon={faExclamationCircle} color="#f00" size="1x" />
          <h1 className={styles.header}>Something went wrong</h1>
        </div>
      </div>
      <Error error={error} />
      <div className={styles.errorFooterContainer}>
        <div className={styles.sideBySide}>
          <ErrorNavigation
            index={viewIndex}
            length={errors.length}
            setIndex={setViewIndex}
          />
          <div className={styles.errorIndex}>
            Error {viewIndex + 1} of {errors.length}
          </div>
        </div>
        <ErrorClearer />
      </div>
    </div>
  );
}
