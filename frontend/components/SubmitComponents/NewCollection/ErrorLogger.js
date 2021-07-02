import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import styles from '../../../styles/submit.module.css';

export default function ErrorLogger() {
  const errors = useSelector(
    state => state.collectionCreate.creatingCollectionErrors
  );
  const [errorLogs, setErrorLogs] = useState(null);
  useEffect(() => {
    if (errors)
      setErrorLogs(errors.map(error => <ErrorLog error={error} key={error} />));
  }, [errors]);
  return errors.length > 0 ? (
    <React.Fragment>{errorLogs}</React.Fragment>
  ) : null;
}

function ErrorLog(properties) {
  return (
    <div className={styles.errormessage}>
      <FontAwesomeIcon
        icon={faExclamationTriangle}
        size="1x"
        color="#D25627"
        className={styles.errormessageicon}
      />
      {properties.error}
    </div>
  );
}
