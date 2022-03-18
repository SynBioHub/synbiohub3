import { faMinusSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../../styles/view.module.css';

export default function Section(properties) {
  return (
    <div className={styles.section}>
      <div className={styles.sectiontitle}>{properties.title}</div>
      <div className={styles.minimize}>
        <FontAwesomeIcon
          icon={faMinusSquare}
          size="1x"
          className={styles.sectionminimizeicon}
        />
      </div>
      <div className={styles.sectionchildcontainer}>{properties.children}</div>
    </div>
  );
}
