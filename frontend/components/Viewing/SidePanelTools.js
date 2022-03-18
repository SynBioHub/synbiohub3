import {
  faCloudDownloadAlt,
  faDatabase,
  faQuoteRight,
  faShareSquare,
  faTrashAlt,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/view.module.css';

export default function SidePanelTools(properties) {
  return (
    <div className={styles.subheader}>
      <div className={styles.id}>
        <FontAwesomeIcon
          icon={faDatabase}
          size="1x"
          className={styles.contentinfoicon}
        />
        {properties.type}
      </div>
      <div className={styles.actionicons}>
        <FontAwesomeIcon
          icon={faShareSquare}
          size="1x"
          className={styles.actionicon}
        />
        <FontAwesomeIcon
          icon={faCloudDownloadAlt}
          size="1x"
          className={styles.actionicon}
        />
        <FontAwesomeIcon
          icon={faQuoteRight}
          size="1x"
          className={styles.actionicon}
        />
        <FontAwesomeIcon
          icon={faUserPlus}
          size="1x"
          className={styles.actionicon}
        />
        <FontAwesomeIcon
          icon={faTrashAlt}
          size="1x"
          className={styles.actionicon}
        />
      </div>
    </div>
  );
}
