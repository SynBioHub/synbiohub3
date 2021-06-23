import Loader from 'react-loader-spinner';

import styles from '../../styles/submit.module.css';
import SubmitHeader from './SubmitHeader';

export default function SubmissionStatusPanel() {
  return (
    <div className={styles.container}>
      <div className={styles.submitpanel}>
        <SubmitHeader
          icon={<Loader color="#00A1E4" height={80} type="Puff" width={80} />}
          title="Uploading Submission"
          description="Please wait while your submission uploads to SynBioHub. You can view other pages while waiting; just don't close or refresh the app."
        />
      </div>
    </div>
  );
}
