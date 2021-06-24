import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import CollectionTypeSelector from '../components/SubmitComponents/CollectionTypeSelector';
import NewCollectionForm from '../components/SubmitComponents/NewCollectionForm';
import SubmissionStatusPanel from '../components/SubmitComponents/SubmissionStatusPanel';
import SubmitHeader from '../components/SubmitComponents/SubmitHeader';
import TopLevel from '../components/TopLevel';
import styles from '../styles/submit.module.css';

const NEW_COLLECTION = 'New Collection';

function Submit() {
  const [collectionType, setCollectionType] = useState(NEW_COLLECTION);

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
        <CollectionTypeSelector
          collectionType={collectionType}
          setCollectionType={setCollectionType}
        />
        {collectionType === NEW_COLLECTION && <NewCollectionForm />}
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
