import { faBook } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/submit.module.css';

export default function PublishCollectionButton(properties) {
  return (
    <div
      className={`${styles.submitbuttoncontainer} ${
        !properties.canSubmit && styles.disabledsubmitbutton
      }`}
      role="button"
      onClick={() => {
        if (!properties.canSubmit)
          alert(
            'You must select or create a destination collection to publish to.'
          );
        else properties.onClick();
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
