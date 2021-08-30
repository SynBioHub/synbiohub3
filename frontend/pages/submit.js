import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

import ChooseCollection from '../components/SubmitComponents/ChooseCollection/ChooseCollection';
import UploadFileSection from '../components/SubmitComponents/FileComponents/UploadFileSection';
import OverwriteObjects from '../components/SubmitComponents/OverwriteObjects';
import SubmitHeader from '../components/SubmitComponents/ReusableComponents/SubmitHeader';
import SubmissionStatusPanel from '../components/SubmitComponents/SubmissionStatusPanel';
import SubmitButton from '../components/SubmitComponents/SubmitButton';
import TopLevel from '../components/TopLevel';
import { getCanSubmitTo } from '../redux/actions';
import styles from '../styles/submit.module.css';

function Submit() {
  const [files, setFiles] = useState([]);
  const [overwriteCollection, setOverwriteCollection] = useState(false);

  const showSubmitProgress = useSelector(
    state => state.submit.showSubmitProgress
  );

  const dispatch = useDispatch();
  dispatch(getCanSubmitTo());

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
            uploaded into an existing or new collection."
        />
        <UploadFileSection files={files} setFiles={setFiles} />
        <ChooseCollection label="Select Destination Collection" />
        <OverwriteObjects
          checked={overwriteCollection}
          setChecked={setOverwriteCollection}
        />
        <SubmitButton files={files} overwriteCollection={overwriteCollection} />
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
