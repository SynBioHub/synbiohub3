import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import styles from '../styles/message.module.css';

export default function Message(properties) {
  const [promptUser, setPromptUser] = useState(true);

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
          <div className={styles.message}>
            {properties.message}
            <div className={styles.showmessageinputcontainer}>
              <input
                type="checkbox"
                className={styles.showmessageinput}
                onChange={event => setPromptUser(!event.target.checked)}
                checked={!promptUser}
              />
              <span>Do not show this message again</span>
            </div>
          </div>
        </div>
        <div className={styles.buttoncontainer}>
          <div
            className={`${styles.button} ${styles.cancel}`}
            role="button"
            onClick={() => properties.close(promptUser)}
          >
            Cancel
          </div>
          <div
            className={`${styles.button} ${styles.actionbutton}`}
            role="button"
            onClick={() => properties.action(promptUser)}
          >
            {properties.buttontext}
          </div>
        </div>
      </div>
    </div>
  );
}
