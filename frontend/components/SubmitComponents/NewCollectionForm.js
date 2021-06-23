import { useState } from 'react';

import styles from '../../styles/submit.module.css';
import ErrorLogger from './ErrorLogger';
import MajorLabel from './MajorLabel';
import SubmitButton from './SubmitButton';
import SubmitLabel from './SubmitLabel';
import UploadFile from './UploadFile';

export default function NewCollectionForm() {
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionID, setCollectionID] = useState('');
  const [collectionVersion, setCollectionVersion] = useState('1');
  const [collectionCitations, setCollectionCitations] = useState('');
  const [files, setFiles] = useState([]);

  return (
    <div className={styles.newcollectioncontainer}>
      <ErrorLogger />
      <MajorLabel
        text="New Collection Information"
        link="https://wiki.synbiohub.org/userdocumentation/managingsubmitting/"
      />
      <div>
        <SubmitLabel
          text="Name"
          for="collection name"
          value={collectionName}
          required={true}
        />
        <input
          type="text"
          name="collection name"
          value={collectionName}
          onChange={event => {
            setCollectionName(event.target.value);
            setCollectionID(convertToAlphanumeric(event.target.value));
          }}
          className={styles.submitinput}
          placeholder="A short title for your collection"
        />
      </div>
      <div>
        <SubmitLabel
          text="Description"
          for="collection description"
          value={collectionDescription}
          required={true}
        />
        <textarea
          name="collection description"
          value={collectionDescription}
          onChange={event => setCollectionDescription(event.target.value)}
          className={styles.submitinput}
          placeholder="The more you say, the easier it will be to find your design"
        />
      </div>
      <div className={styles.inlineinputcontainer}>
        <SubmitLabel
          text="ID"
          for="collection ID"
          value={collectionID}
          required={true}
        />
        <input
          type="text"
          name="collection ID"
          value={collectionID}
          onChange={event =>
            setCollectionID(convertToAlphanumeric(event.target.value))
          }
          className={`${styles.submitinput} ${styles.idinput}`}
          placeholder="Alphanumeric and underscore characters only"
        />
      </div>
      <div className={styles.inlineinputcontainer} htmlFor="collection version">
        <SubmitLabel
          text="Version"
          for="collection version"
          value={collectionVersion}
          required={true}
        />
        <input
          type="text"
          name="collection version"
          value={collectionVersion}
          onChange={event => setCollectionVersion(event.target.value)}
          className={`${styles.submitinput} ${styles.versioninput}`}
          placeholder="Version"
        />
      </div>
      <div>
        <SubmitLabel
          text="Citations (Optional)"
          for="collection citations"
          required={false}
        />
        <input
          type="text"
          name="collection citations"
          value={collectionCitations}
          onChange={event => setCollectionCitations(event.value)}
          className={styles.submitinput}
          placeholder="Pubmed IDs separated by commas, we'll do the rest!"
        />
      </div>
      <UploadFile files={files} setFiles={setFiles} fileRequired={false} />
      <SubmitButton
        collectionName={collectionName}
        collectionDescription={collectionDescription}
        collectionID={collectionID}
        collectionVersion={collectionVersion}
        collectionCitations={collectionCitations}
        files={files}
      />
    </div>
  );
}

const convertToAlphanumeric = string => {
  var regexExpr = /^[A-z]\w*$/;
  if (!regexExpr.test(string)) string = formatString(string);
  return string;
};

const formatString = string => {
  if (string.length > 0 && /\d/.test(string.charAt(0))) string = '_' + string;
  string = string.replace(/ /g, '_');
  string = string.replace(/\W+/g, '');
  return string;
};
