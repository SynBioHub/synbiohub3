import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/submit.module.css';

export default function NewCollectionForm() {
  return (
    <div className={styles.newcollectioncontainer}>
      <label className={styles.sectionlabel}>
        <FontAwesomeIcon
          icon={faInfoCircle}
          size="1x"
          className={`${styles.submitinfoicon} ${styles.enlargeicononhover}`}
        />
        New Collection Information
      </label>
      <div>
        <label className={styles.submitlabel} htmlFor="collection name">
          Name
        </label>
        <input
          type="text"
          name="collection name"
          className={styles.submitinput}
          placeholder="A short title for your collection"
        />
      </div>
      <div>
        <label className={styles.submitlabel} htmlFor="collection description">
          Description
        </label>
        <textarea
          name="collection description"
          className={styles.submitinput}
          placeholder="The more you say, the easier it will be to find your design"
        />
      </div>
      <div className={styles.inlineinputcontainer}>
        <label className={styles.submitlabel} htmlFor="collection ID">
          ID
        </label>
        <input
          type="text"
          name="collection ID"
          className={`${styles.submitinput} ${styles.idinput}`}
          placeholder="Alphanumeric and underscore characters only"
        />
      </div>
      <div className={styles.inlineinputcontainer} htmlFor="collection version">
        <label className={styles.submitlabel}>Version</label>
        <input
          type="text"
          name="collection version"
          className={`${styles.submitinput} ${styles.versioninput}`}
          placeholder="Version"
        />
      </div>
      <div>
        <label
          className={`${styles.submitlabel} ${styles.submitlabeloptional}`}
          htmlFor="collection citations"
        >
          Citations (Optional)
        </label>
        <input
          type="text"
          name="collection citations"
          className={styles.submitinput}
          placeholder="Pubmed IDs separated by commas, we'll do the rest!"
        />
      </div>
    </div>
  );
}
