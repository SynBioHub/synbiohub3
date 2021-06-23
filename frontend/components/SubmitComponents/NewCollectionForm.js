import { useState } from 'react';

import styles from '../../styles/submit.module.css';
import ErrorLogger from './ErrorLogger';
import InputField from './InputField';
import MajorLabel from './MajorLabel';
import SubmitButton from './SubmitButton';
import UploadFileSection from './UploadFileSection';

export default function NewCollectionForm() {
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionID, setCollectionID] = useState('');
  const [collectionVersion, setCollectionVersion] = useState('1');
  const [collectionCitations, setCollectionCitations] = useState('');
  const [files, setFiles] = useState([]);

  const [needsVerification, setNeedsVerification] = useState('');

  return (
    <div className={styles.newcollectioncontainer}>
      <ErrorLogger />
      <MajorLabel
        text="New Collection Information"
        link="https://wiki.synbiohub.org/userdocumentation/managingsubmitting/"
      />
      <InputField
        labelText="Name"
        inputName="collection name"
        placeholder="A short title for your collection"
        value={collectionName}
        needsVerification={needsVerification}
        setNeedsVerification={setNeedsVerification}
        onChange={event => {
          setCollectionName(event.target.value);
          setCollectionID(convertToAlphanumeric(event.target.value));
        }}
      />
      <InputField
        labelText="Description"
        inputName="collection description"
        placeholder="The more you say, the easier it will be to find your design"
        value={collectionDescription}
        needsVerification={needsVerification}
        setNeedsVerification={setNeedsVerification}
        onChange={event => setCollectionDescription(event.target.value)}
        customInput="textarea"
      />
      <InputField
        labelText="ID"
        inputName="collection ID"
        placeholder="Alphanumeric and underscore characters only"
        value={collectionID}
        needsVerification={needsVerification}
        setNeedsVerification={setNeedsVerification}
        onChange={event =>
          setCollectionID(convertToAlphanumeric(event.target.value))
        }
        containerStyling={styles.inlineinputcontainer}
        customStyling={styles.idinput}
      />
      <InputField
        labelText="Version"
        inputName="collection version"
        placeholder="Version"
        value={collectionVersion}
        needsVerification={needsVerification}
        setNeedsVerification={setNeedsVerification}
        onChange={event => setCollectionVersion(event.target.value)}
        containerStyling={styles.inlineinputcontainer}
        customStyling={styles.versioninput}
      />
      <InputField
        labelText="Citations (Optional)"
        inputName="collection citations"
        placeholder="Pubmed IDs separated by commas, we'll do the rest!"
        value={collectionCitations}
        onChange={event => setCollectionCitations(event.value)}
      />
      <UploadFileSection
        files={files}
        setFiles={setFiles}
        fileRequired={false}
      />
      <SubmitButton
        collectionName={collectionName}
        collectionDescription={collectionDescription}
        collectionID={collectionID}
        collectionVersion={collectionVersion}
        collectionCitations={collectionCitations}
        files={files}
        needsVerification={needsVerification}
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
