import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';

import styles from '../../styles/defaulttable.module.css';

export default function TableButton(properties) {
  const [buttonClass, setButtonClass] = useState(styles.disabled);

  useEffect(() => {
    setButtonClass(properties.enabled ? styles.enabled : styles.disabled);
  }, [properties.enabled]);

  return (
    <div
      className={`${styles.tablebutton} ${buttonClass} ${styles.rightspace}`}
      role="button"
      onClick={() => {
        if (properties.enabled) properties.onClick();
      }}
    >
      <span className={styles.buttonicon}>
        <FontAwesomeIcon icon={properties.icon} color="#00000" size="1x" />
      </span>
      {properties.title}
    </div>
  );
}
