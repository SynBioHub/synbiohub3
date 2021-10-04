import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { submit } from '../../redux/actions';
import styles from '../../styles/submit.module.css';

export default function SubmitButton(properties) {
  const dispatch = useDispatch();
  const selectedCollection = useSelector(
    state => state.submit.selectedCollection
  );
  const [canSubmit, setCanSubmit] = useState();
  useEffect(() => {
    setCanSubmit(!(properties.files.length === 0 || !selectedCollection));
  }, [selectedCollection, properties.files]);

  return (
    <div
      className={`${styles.submitbuttoncontainer} ${
        !canSubmit && styles.disabledsubmitbutton
      }`}
      role="button"
      onClick={() => {
        if (!canSubmit)
          alert(
            'You must select one or more files and a destination collection before you can submit.'
          );
        else
          dispatch(
            submit(
              selectedCollection.uri,
              properties.files,
              properties.overwriteCollection ? 1 : 0,
              properties.addingToCollection ? true : false
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
