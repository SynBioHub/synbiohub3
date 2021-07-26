import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../styles/message.module.css';

export default function Message(properties) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.messagecontainer}>
          <div>
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              size="2x"
              color="#D25627"
            />
          </div>
          <div className={styles.message}>{properties.message}</div>
        </div>
        <div className={styles.buttoncontainer}>
          <div
            className={`${styles.button} ${styles.cancel}`}
            role="button"
            onClick={() => properties.close()}
          >
            Cancel
          </div>
          <div
            className={`${styles.button} ${styles.actionbutton}`}
            role="button"
            onClick={() => properties.action()}
          >
            {properties.buttontext}
          </div>
        </div>
      </div>
    </div>
  );
}
