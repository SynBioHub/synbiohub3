import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getCanSubmitTo } from '../../../redux/actions';
import styles from '../../../styles/submit.module.css';
import InputField from '../ReusableComponents/InputField';
import CreatingCollectionLoader from './CreatingCollectionLoader';
import ErrorLogger from './ErrorLogger';
import NewCollectionButtons from './NewCollectionButtons';

export default function NewCollectionForm(properties) {
  const dispatch = useDispatch();
  const token = useSelector(state => state.user.token);
  const [name, setCollectionName] = useState('');
  const [description, setCollectionDescription] = useState('');
  const [id, setCollectionID] = useState('');
  const [version, setCollectionVersion] = useState('1');
  const [citations, setCollectionCitations] = useState('');

  const [needsVerification, setNeedsVerification] = useState('');

  const [creatingCollection, setCreatingCollection] = useState(false);

  const [errors, setErrors] = useState([]);

  const createCollection = async () => {
    properties.setCreateCollectionButtonText('Creating Collection');
    setCreatingCollection(true);
    const response = await postCollection(
      token,
      id,
      version,
      name,
      description,
      citations,
      0
    );
    if (response.status !== 200) {
      var messages = await response.text();
      messages = messages.charAt(0) !== '[' ? [messages] : JSON.parse(messages);
      setErrors(messages);
    } else {
      setErrors([]);
      dispatch(getCanSubmitTo());
      properties.setCreateCollectionButtonText('New Collection');
      properties.setCreateCollection(false);
    }
    setCreatingCollection(false);
  };

  if (creatingCollection) return <CreatingCollectionLoader />;
  return (
    <div className={styles.newcollectioncontainer}>
      <ErrorLogger errors={errors} />
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
      <NewCollectionButtons
        setCreateCollection={properties.setCreateCollection}
        setCreateCollectionButtonText={properties.setCreateCollectionButtonText}
        needsVerification={needsVerification}
        createCollection={createCollection}
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

const postCollection = async (
  token,
  id,
  version,
  name,
  description,
  citations,
  overwrite_merge
) => {
  const url = `${process.env.backendUrl}/submit`;
  var headers = {
    Accept: 'text/plain; charset=UTF-8',
    'X-authorization': token
  };

  const form = new FormData();
  form.append('id', id);
  form.append('version', version);
  form.append('name', name);
  form.append('description', description);
  form.append('citations', citations);
  form.append('overwrite_merge', `${overwrite_merge}`);

  return await fetch(url, {
    method: 'POST',
    headers,
    body: form
  });
};
