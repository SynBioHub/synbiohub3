import { useState } from 'react';

import styles from '../../styles/submit.module.css';
import InputField from '../SubmitComponents/ReusableComponents/InputField';

export default function NewCollectionForm(properties) {
  const [name, setCollectionName] = useState(
    properties.filler ? properties.filler.name : ''
  );
  const [description, setCollectionDescription] = useState(
    properties.filler ? properties.filler.description : ''
  );
  const [id, setCollectionID] = useState(
    properties.filler ? properties.filler.displayId : ''
  );
  const [version, setCollectionVersion] = useState(
    properties.filler ? properties.filler.version : '1'
  );
  const [citations, setCollectionCitations] = useState(
    properties.filler ? properties.filler.citations : ''
  );

  const [needsVerification, setNeedsVerification] = useState('');

  return (
    <div className={styles.newcollectioncontainer}>
      <InputField
        labelText="Name"
        inputName="collection name"
        placeholder="A short title for your collection"
        value={name}
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
        value={description}
        needsVerification={needsVerification}
        setNeedsVerification={setNeedsVerification}
        onChange={event => setCollectionDescription(event.target.value)}
        customInput="textarea"
      />
      <InputField
        labelText="Display ID"
        inputName="collection ID"
        placeholder="Alphanumeric and underscore characters only"
        value={id}
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
        value={version}
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
        value={citations}
        onChange={event => setCollectionCitations(event.value)}
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
