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
    if (
      !properties.collectionID ||
      !properties.collectionVersion ||
      !properties.collectionName ||
      !properties.collectionDescription
    ) {
      setCanSubmit(false); // input isn't verified
    } else setCanSubmit(true);
  }, [
    properties.collectionID,
    properties.collectionVersion,
    properties.collectionName,
    properties.collectionDescription
  ]);
  return (
    <div
      className={`${styles.submitbuttoncontainer} ${
        !canSubmit && styles.disabledsubmitbutton
      }`}
      role="button"
      onClick={() => {
        if (!canSubmit)
          alert(
            'You must fill out all required input fields before you can submit!'
          );
        else
          dispatch(
            submit(
              properties.collectionID,
              properties.collectionVersion,
              properties.collectionName,
              properties.collectionDescription,
              properties.collectionCitations,
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
