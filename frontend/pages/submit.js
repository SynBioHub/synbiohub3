import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import ChooseCollection from '../components/SubmitComponents/ChooseCollection/ChooseCollection';
import SubmissionStatusPanel from '../components/SubmitComponents/SubmissionStatusPanel';
import SubmitHeader from '../components/SubmitComponents/SubmitHeader';
import UploadFileSection from '../components/SubmitComponents/UploadFileSection';
import TopLevel from '../components/TopLevel';
import styles from '../styles/submit.module.css';

function Submit() {
  const [files, setFiles] = useState([]);

  const showSubmitProgress = useSelector(
    state => state.submit.showSubmitProgress
  );

  if (showSubmitProgress) {
    return <SubmissionStatusPanel />;
  }
  return (
    <div className={styles.container}>
      <div className={styles.submitpanel}>
        <SubmitHeader
          icon={
            <FontAwesomeIcon
              icon={faCloudUploadAlt}
              size="3x"
              color="#00A1E4"
            />
          }
          title="Tell us about your submission"
          description="SynBioHub organizes your uploads into collections. Parts can be
            uploaded into a new or existing collection."
        />
        <UploadFileSection files={files} setFiles={setFiles} />
        <ChooseCollection />
      </div>
    </div>
  );
}

export default function SubmitWrapped() {
  return (
    <TopLevel>
      <Submit />
    </TopLevel>
  );
}
