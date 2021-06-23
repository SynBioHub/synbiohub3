import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/submit.module.css';

export default function MajorLabel(properties) {
  return (
    <label className={styles.sectionlabel}>
      <a href={properties.link} target="_blank" rel="noreferrer">
        <FontAwesomeIcon
          icon={faInfoCircle}
          size="1x"
          className={`${styles.submitinfoicon} ${styles.enlargeicononhover}`}
        />
      </a>
      {properties.text}
    </label>
  );
}
