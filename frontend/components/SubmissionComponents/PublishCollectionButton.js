import { faBook } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import styles from '../../styles/submit.module.css';

export default function PublishCollectionButton() {
  const selectedCollection = useSelector(
    state => state.submit.selectedCollection
  );
  const [canSubmit, setCanSubmit] = useState();
  useEffect(() => {
    setCanSubmit(selectedCollection ? true : false);
  }, [selectedCollection]);

  return (
    <div
      className={`${styles.submitbuttoncontainer} ${
        !canSubmit && styles.disabledsubmitbutton
      }`}
      role="button"
      onClick={() => {
        if (!canSubmit)
          alert(
            'You must select or create a destination collection to publish to.'
          );
      }}
    >
      <FontAwesomeIcon
        icon={faBook}
        size="1x"
        color="#F2E86D"
        className={styles.submitbuttonicon}
      />
      Publish
    </div>
  );
}
