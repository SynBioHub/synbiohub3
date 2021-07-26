import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/submit.module.css';

export default function OverwriteObjects() {
  return (
    <div className={styles.overwritecontainer}>
      <div className={styles.overwriteinputcontainer}>
        <input type="checkbox" />
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
    </div>
  );
}
