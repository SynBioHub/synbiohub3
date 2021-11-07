import { faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../../styles/login.module.css';

export default function SaveButton(properties) {
  return (
    <div
      role="button"
      className={styles.submitbutton}
      onClick={() => properties.onClick()}
    >
      <FontAwesomeIcon
        icon={faSave}
        size="1x"
        className={styles.submiticon}
        color="#D25627"
      />{' '}
      Save Information
    </div>
  );
}
