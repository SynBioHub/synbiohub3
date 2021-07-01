import {
  faArrowCircleLeft,
  faFolderPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../../styles/choosecollection.module.css';

export default function NewCollectionButtons(properties) {
  return (
    <div className={styles.createcollectionbuttons}>
      <div
        className={`${styles.createcollectionbutton} ${styles.cancelbutton}`}
        role="button"
        onClick={() => properties.setCreateCollection(false)}
      >
        <FontAwesomeIcon
          icon={faArrowCircleLeft}
          size="1x"
          className={styles.cancelbuttonicon}
        />
        Cancel
      </div>
      <div
        className={`${styles.createcollectionbutton} ${styles.createbutton} ${
          properties.needsVerification ? '' : styles.createbuttonenabled
        }`}
        role="button"
        onClick={() => {
          if (properties.needsVerification)
            alert(
              'You must fill out all required input fields (marked by orange labels) before you can create the collection.'
            );
        }}
      >
        Create
        <FontAwesomeIcon
          icon={faFolderPlus}
          size="1x"
          className={styles.createbuttonicon}
        />
      </div>
    </div>
  );
}
