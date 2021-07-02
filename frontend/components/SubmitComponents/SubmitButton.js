import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { submit } from '../../redux/actions';
import styles from '../../styles/submit.module.css';

export default function SubmitButton(properties) {
  const dispatch = useDispatch();
  const [canSubmit, setCanSubmit] = useState(false);
  useEffect(() => {
    setCanSubmit(!properties.needsVerification);
  }, [properties.needsVerification]);

  return (
    <div
      className={`${styles.submitbuttoncontainer} ${
        !canSubmit && styles.disabledsubmitbutton
      }`}
      role="button"
      onClick={() => {
        if (!canSubmit)
          alert(
            'You must fill out all required input fields before you can submit.'
          );
        else
          dispatch(
            submit(
              false,
              properties.collection.displayId,
              properties.collection.version,
              properties.collection.name,
              properties.collection.description,
              '',
              properties.files
            )
          );
      }}
    >
      <FontAwesomeIcon
        icon={faCloudUploadAlt}
        size="1x"
        color="#F2E86D"
        className={styles.submitbuttonicon}
      />
      Submit
    </div>
  );
}
