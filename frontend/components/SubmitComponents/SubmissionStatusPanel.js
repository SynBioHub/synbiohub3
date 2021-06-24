import {
  faArrowCircleLeft,
  faBookOpen,
  faCloudUploadAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useSelector } from 'react-redux';

import styles from '../../styles/submit.module.css';
import FilesUploading from './FilesUploading';
import SubmitHeader from './SubmitHeader';

export default function SubmissionStatusPanel() {
  const submitting = useSelector(state => state.submit.submitting);
  const [header, setHeader] = useState(null);

  useEffect(() => {
    if (submitting)
      setHeader(
        <SubmitHeader
          icon={<Loader color="#00A1E4" height={80} type="Puff" width={80} />}
          title="Uploading Submission"
          description="Please wait while your submission uploads to SynBioHub. You can view other pages while waiting; just don't close or refresh the app."
        />
      );
    else {
      setHeader(
        <SubmitHeader
          icon={
            <FontAwesomeIcon
              icon={faCloudUploadAlt}
              size="3x"
              color="#00A1E4"
            />
          }
          title="Submission Uploaded"
          description="Your submisson has been succesfully uploaded to SynBioHub."
        />
      );
    }
  }, [submitting]);

  return (
    <div className={styles.container}>
      <div className={styles.submitpanel}>
        {header}
        {!submitting && (
          <div className={styles.aftersubmitbuttonscontainer}>
            <div className={styles.aftersubmitbutton}>
              <FontAwesomeIcon
                className={`${styles.aftersubmitbuttonicon} ${styles.aftersubmitbuttoniconleft}`}
                icon={faArrowCircleLeft}
                size="1x"
              />
              Back to Submit
            </div>
            <div className={styles.aftersubmitbutton}>
              <FontAwesomeIcon
                className={`${styles.aftersubmitbuttonicon} ${styles.aftersubmitbuttoniconright}`}
                icon={faBookOpen}
                size="1x"
              />
              View Submission
            </div>
          </div>
        )}
        <FilesUploading />
      </div>
    </div>
  );
}
