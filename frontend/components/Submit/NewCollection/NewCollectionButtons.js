import {
  faArrowCircleLeft,
  faFolderPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch } from 'react-redux';

import { getCanSubmitTo, setPromptNewCollection } from '../../../redux/actions';
import styles from '../../../styles/choosecollection.module.css';

export default function NewCollectionButtons(properties) {
  const dispatch = useDispatch();
  const canCreate = !properties.needsVerification && properties.isUniqueName;
  return (
    <div className={styles.createcollectionbuttons}>
      <div
        className={`${styles.createcollectionbutton} ${styles.cancelbutton}`}
        role="button"
        onClick={() => {
          dispatch(getCanSubmitTo());
          dispatch(setPromptNewCollection(false));
        }}
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
          canCreate ? styles.createbuttonenabled : ''
        }`}
        role="button"
        onClick={() => {
          if (properties.needsVerification)
            alert(
              'You must fill out all required input fields (marked by orange labels) before you can create the collection.'
            );
          else if (!properties.isUniqueName)
            alert(
              'This collection name is already in use. Please choose a different name.'
            );
          else properties.postCollection();
        }}
      >
        {properties.title}
        <FontAwesomeIcon
          icon={faFolderPlus}
          size="1x"
          className={styles.createbuttonicon}
        />
      </div>
    </div>
  );
}
