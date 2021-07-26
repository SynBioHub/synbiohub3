import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import styles from '../../styles/submit.module.css';
import Message from '../Message';

export default function OverwriteObjects() {
  const [warnUser, setWarnUser] = useState(false);
  const [checked, setChecked] = useState(false);
  return (
    <div className={styles.overwritecontainer}>
      <div className={styles.overwriteinputcontainer}>
        <input
          type="checkbox"
          checked={checked}
          onChange={event => {
            if (event.target.checked) setWarnUser(true);
            else setChecked(false);
          }}
        />
        <div className={styles.overwritemessage}>
          Overwrite Existing Collection
        </div>
      </div>
      <div>
        <a
          href="https://wiki.synbiohub.org/userdocumentation/managingsubmitting#411-creating-a-new-collection"
          target="_blank"
          rel="noreferrer"
        >
          <FontAwesomeIcon
            icon={faInfoCircle}
            size="1x"
            className={`${styles.submitinfoicon} ${styles.enlargeicononhover}`}
            color="#00A1E4"
          />
        </a>
      </div>
      {warnUser ? (
        <Message
          message="Are you sure you want to overwrite existing objects in the collection? All objects currently existing in the collection will be lost."
          buttontext="Confirm"
          close={() => {
            setChecked(false);
            setWarnUser(false);
          }}
          action={() => {
            setChecked(true);
            setWarnUser(false);
          }}
        />
      ) : null}
    </div>
  );
}
