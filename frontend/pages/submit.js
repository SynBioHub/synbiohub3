import { useState } from 'react';
import { useSelector } from 'react-redux';

import CollectionTypeSelector from '../components/SubmitComponents/CollectionTypeSelector';
import ErrorLogger from '../components/SubmitComponents/ErrorLogger';
import NewCollectionForm from '../components/SubmitComponents/NewCollectionForm';
import SubmitButton from '../components/SubmitComponents/SubmitButton';
import SubmitHeader from '../components/SubmitComponents/SubmitHeader';
import UploadFile from '../components/SubmitComponents/UploadFile';
import TopLevel from '../components/TopLevel';
import styles from '../styles/submit.module.css';

const NEW_COLLECTION = 'New Collecton';

function Submit() {
  const [collectionType, setCollectionType] = useState(NEW_COLLECTION);
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionID, setCollectionID] = useState('');
  const [collectionVersion, setCollectionVersion] = useState('1');
  const [collectionCitations, setCollectionCitations] = useState('');
  const [files, setFiles] = useState([]);

  const submitting = useSelector(state => state.submit.submitting);

  if (submitting) {
    return <div>Submitting</div>;
  }
  return (
    <div className={styles.container}>
      <div className={styles.submitpanel}>
        <SubmitHeader
          title="Tell us about your submission"
          description="SynBioHub organizes your uploads into collections. Parts can be
            uploaded into a new or existing collection."
        />
        <CollectionTypeSelector
          collectionType={collectionType}
          setCollectionType={setCollectionType}
        />
        <ErrorLogger />
        {collectionType === NEW_COLLECTION && (
          <NewCollectionForm
            collectionName={collectionName}
            setCollectionName={setCollectionName}
            collectionDescription={collectionDescription}
            setCollectionDescription={setCollectionDescription}
            collectionID={collectionID}
            setCollectionID={setCollectionID}
            collectionVersion={collectionVersion}
            setCollectionVersion={setCollectionVersion}
            collectionCitations={collectionCitations}
            setCollectionCitations={setCollectionCitations}
          />
        )}
        <UploadFile
          files={files}
          setFiles={setFiles}
          fileRequired={collectionType === NEW_COLLECTION ? false : true}
        />
        <SubmitButton
          collectionName={collectionName}
          collectionDescription={collectionDescription}
          collectionID={collectionID}
          collectionVersion={collectionVersion}
          collectionCitations={collectionCitations}
          files={files}
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
