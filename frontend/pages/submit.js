import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import TopLevel from '../components/TopLevel';
import styles from '../styles/submit.module.css';

function Submit() {
  return (
    <div className={styles.container}>
      <FontAwesomeIcon
        icon={faCloudUploadAlt}
        size="3x"
        color="#171D26"
        className={styles.submiticon}
      />
      <div className={styles.introcontainer}>
        <h2 className={styles.introtitle}>Submit to a Collection</h2>
        <p className={styles.introexplanation}>
          SynBioHub organizes your uploads into collections. Parts can be
          uploaded into a new or existing collection.
        </p>
      </div>
    </div>
  );
}

export default function SubmitWrapped() {
  return (
    <TopLevel>
      <Submit />
    </TopLevel>
  );
}
