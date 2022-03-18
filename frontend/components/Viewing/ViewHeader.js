import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/view.module.css';

export default function ViewHeader(properties) {
  return (
    <div>
      <div className={styles.contentheader}>
        <h1 className={styles.maintitle}>{properties.name}</h1>
        <h1 className={styles.maintitleid}>({properties.displayId})</h1>
      </div>
      <div className={styles.contentinfo}>
        <FontAwesomeIcon
          icon={faDatabase}
          size="1x"
          className={styles.contentinfoicon}
        />
        {properties.type}
      </div>
      <div className={styles.description}>{properties.description}</div>
    </div>
  );
}
