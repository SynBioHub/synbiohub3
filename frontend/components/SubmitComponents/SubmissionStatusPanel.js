import {
  faArrowCircleLeft,
  faBookOpen,
  faCloudUploadAlt,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useDispatch, useSelector } from 'react-redux';

import { resetSubmit } from '../../redux/actions';
import styles from '../../styles/submit.module.css';
import FilesUploading from './FileComponents/FilesUploading';
import SubmitHeader from './ReusableComponents/SubmitHeader';

export default function SubmissionStatusPanel() {
  const fileFailed = useSelector(state => state.submit.fileFailed);
  const submitting = useSelector(state => state.submit.submitting);
  const [header, setHeader] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (submitting)
      setHeader(
        <SubmitHeader
          icon={<Loader color="#00A1E4" height={80} type="Puff" width={80} />}
          title="Uploading Submission"
          description="Please wait while your submission uploads to SynBioHub. You can view other pages while waiting; just don't close or refresh the app."
        />
      );
    else if (fileFailed) {
      setHeader(
        <SubmitHeader
          icon={
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              size="3x"
              color="#D25627"
            />
          }
          title="Some files failed to upload"
          description="Click on a file's warning icon to see why it failed to be uploaded."
        />
      );
    } else {
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
  }, [submitting, fileFailed]);

  return (
    <div className={styles.container}>
      <div className={styles.submitpanel}>
        {header}
        {!submitting && (
          <div className={styles.aftersubmitbuttonscontainer}>
            <div
              className={styles.aftersubmitbutton}
              role="button"
              onClick={() => dispatch(resetSubmit())}
            >
              <FontAwesomeIcon
                className={`${styles.aftersubmitbuttonicon} ${styles.aftersubmitbuttoniconleft}`}
                icon={faArrowCircleLeft}
                size="1x"
              />
              Back to Submit
            </div>
            <div className={styles.aftersubmitbutton}>
              View Submission
              <FontAwesomeIcon
                className={`${styles.aftersubmitbuttonicon} ${styles.aftersubmitbuttoniconright}`}
                icon={faBookOpen}
                size="1x"
              />
            </div>
          </div>
        )}
        <FilesUploading />
      </div>
    </div>
  );
}
