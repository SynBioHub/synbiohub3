import { useEffect, useState } from 'react';

import styles from '../../../styles/submit.module.css';

export default function SubmitHeader(properties) {
  const [animateSubmitIconClass, setAnimateSubmitIconClass] = useState('');

  useEffect(() => {
    setAnimateSubmitIconClass(styles.animatesubmit);
  });

  return (
    <div className={styles.introcontainer}>
      <div className={`${styles.submiticon} ${animateSubmitIconClass}`}>
        {properties.icon}
      </div>
      <h2 className={styles.introtitle}>{properties.title}</h2>
      <p className={styles.introexplanation}>{properties.description}</p>
    </div>
  );
}
