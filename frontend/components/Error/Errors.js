import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import styles from '../../styles/error.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import Error from './Error';
import ErrorNavigation from './ErrorNavigation';
import ErrorClearer from './ErrorClearer';

export default function Errors() {
  const [viewIndex, setViewIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const errors = useSelector(state => state.errors.errors);

  useEffect(() => {
    if (!errors || errors.length === 0) setViewIndex(0);
    else if (viewIndex > errors.length - 1) setViewIndex(errors.length - 1);
  }, [errors, viewIndex]);

  if (errors.length === 0) return null;

  const error = errors[viewIndex];
  const toggleExpand = () => setIsExpanded(!isExpanded);

  if (error.response && error.response.data === "Error: Cannot access other users' graphs.") {
    return (
      <div className={styles.smallErrorContainer}>
        <div className={styles.errorHeaderContainer}>
          <div className={styles.errorTitle}>
            <FontAwesomeIcon icon={faExclamationCircle} color="#f00" size="1x" />
            <h1 className={styles.header}>{error.message = "User token is expired. Please relog."}</h1>
          </div>
          <div>
            <ErrorClearer index={viewIndex} setIndex={setViewIndex} size={'relog'} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isExpanded ? styles.errorContainer : styles.smallErrorContainer}>
      <div className={styles.errorHeaderContainer}>
        <div className={styles.errorTitle}>
          <FontAwesomeIcon icon={faExclamationCircle} color="#f00" size="1x" />
          <h1 className={styles.header}>{error.message === "Network Error" ? "Backend Server Not Responding" : "Something went wrong"}</h1>
        </div>
        <div>
          {!isExpanded && (
            <>
              <ErrorClearer index={viewIndex} setIndex={setViewIndex} size={'small'} />
            </>
          )}
        </div>
        <button onClick={toggleExpand} className={styles.expandButton}>
          {isExpanded ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />}
        </button>
      </div>
      {isExpanded && (
        <>
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
            <ErrorClearer index={viewIndex} setIndex={setViewIndex} />
          </div>
        </>
      )}
    </div>
  );
}
