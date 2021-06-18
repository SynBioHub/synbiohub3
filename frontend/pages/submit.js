import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';

import TopLevel from '../components/TopLevel';
import styles from '../styles/submit.module.css';

function Submit() {
  const [animateSubmitIconClass, setAnimateSubmitIconClass] = useState('');
  useEffect(() => {
    setAnimateSubmitIconClass(styles.animatesubmit);
  });
  return (
    <div className={styles.container}>
      <div className={styles.submitpanel}>
        <div className={styles.introcontainer}>
          <FontAwesomeIcon
            icon={faCloudUploadAlt}
            size="3x"
            color="#00A1E4"
            className={`${styles.submiticon} ${animateSubmitIconClass}`}
          />
          <h2 className={styles.introtitle}>Submit</h2>
          <p className={styles.introexplanation}>
            Upload your parts into a new or existing collection.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SubmitWrapped() {
  return (
    <TopLevel>
      <Submit />
    </TopLevel>
  );
}
