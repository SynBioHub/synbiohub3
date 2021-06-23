import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';

import styles from '../../styles/submit.module.css';

export default function SubmitHeader(properties) {
  const [animateSubmitIconClass, setAnimateSubmitIconClass] = useState('');

  useEffect(() => {
    setAnimateSubmitIconClass(styles.animatesubmit);
  });

  return (
    <div className={styles.introcontainer}>
      <FontAwesomeIcon
        icon={faCloudUploadAlt}
        size="3x"
        color="#00A1E4"
        className={`${styles.submiticon} ${animateSubmitIconClass}`}
      />
      <h2 className={styles.introtitle}>{properties.title}</h2>
      <p className={styles.introexplanation}>{properties.description}</p>
    </div>
  );
}
