import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

import ChooseCollection from '../components/SubmitComponents/ChooseCollection/ChooseCollection';
import SubmissionStatusPanel from '../components/SubmitComponents/SubmissionStatusPanel';
import SubmitButton from '../components/SubmitComponents/SubmitButton';
import SubmitHeader from '../components/SubmitComponents/SubmitHeader';
import UploadFileSection from '../components/SubmitComponents/UploadFileSection';
import TopLevel from '../components/TopLevel';
import { getCanSubmitTo } from '../redux/actions';
import styles from '../styles/submit.module.css';

function Submit() {
  const [files, setFiles] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState({});

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
        <ChooseCollection
          selectedCollection={selectedCollection}
          setSelectedCollection={setSelectedCollection}
        />
        <SubmitButton
          newCollection={true}
          collectionName={selectedCollection.name}
          collectionDescription={selectedCollection.description}
          collectionID={selectedCollection.displayId}
          collectionVersion={selectedCollection.version}
          collectionCitations={selectedCollection.citations}
          files={files}
          needsVerification={false}
        />
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
