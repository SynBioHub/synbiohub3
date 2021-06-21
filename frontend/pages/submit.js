import {
  faCloudUploadAlt,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import CollectionTypeSelector from '../components/SubmitComponents/CollectionTypeSelector';
import FileDropzone from '../components/SubmitComponents/FileDropzone';
import NewCollectionForm from '../components/SubmitComponents/NewCollectionForm';
import SelectedFileView from '../components/SubmitComponents/SelectedFileView';
import TopLevel from '../components/TopLevel';
import { submit } from '../redux/actions';
import styles from '../styles/submit.module.css';

function Submit() {
  const [animateSubmitIconClass, setAnimateSubmitIconClass] = useState('');
  const [collectionType, setCollectionType] = useState('New Collection');
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionID, setCollectionID] = useState('');
  const [collectionVersion, setCollectionVersion] = useState('1');
  const [collectionCitations, setCollectionCitations] = useState('');
  const [files, setFiles] = useState([]);
  useEffect(() => {
    setAnimateSubmitIconClass(styles.animatesubmit);
  });

  const dispatch = useDispatch();
  return (
    <div className={styles.container}>
      <div className={styles.submitpanel}>
        <div className={styles.introcontainer}>
          <FontAwesomeIcon
            icon={faCloudUploadAlt}
            size="3x"
            color="#00A1E4"
            className={`${styles.submiticon} ${animateSubmitIconClass}`}
          />
          <h2 className={styles.introtitle}>Tell us about your submission</h2>
          <p className={styles.introexplanation}>
            SynBioHub organizes your uploads into collections. Parts can be
            uploaded into a new or existing collection.
          </p>
        </div>
        <div className={styles.collectiontypecontainer}>
          <div className={styles.collectionsubmitto}>Submit to</div>
          <div className={styles.collectiontypes}>
            <CollectionTypeSelector
              type="New Collection"
              selectedType={collectionType}
              setType={setCollectionType}
            />
            <CollectionTypeSelector
              type="Existing Collection"
              selectedType={collectionType}
              setType={setCollectionType}
            />
          </div>
        </div>
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
        <div className={styles.uploadcontainer}>
          <label className={styles.sectionlabel}>
            <a
              href="https://wiki.synbiohub.org/userdocumentation/managingsubmitting/"
              target="_blank"
              rel="noreferrer"
            >
              <FontAwesomeIcon
                icon={faInfoCircle}
                size="1x"
                className={`${styles.submitinfoicon} ${styles.enlargeicononhover}`}
              />
            </a>
            Upload Design File
          </label>
          <label
            className={`${styles.submitlabel} ${styles.submitlabeloptional}`}
          >
            SBOL &middot; GENBANK &middot; GFF3 &middot; FASTA &middot; ZIP
            (Optional)
          </label>
          <FileDropzone setFiles={setFiles} />
          <SelectedFileView files={files} />
        </div>
        <div
          className={styles.submitbuttoncontainer}
          role="button"
          onClick={() => {
            dispatch(
              submit(
                collectionID,
                collectionVersion,
                collectionName,
                collectionDescription,
                collectionCitations
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
