import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/submit.module.css';
import RequiredLabel from './RequiredLabel';

export default function NewCollectionForm(properties) {
  return (
    <div className={styles.newcollectioncontainer}>
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
        New Collection Information
      </label>
      <div>
        <RequiredLabel
          text="Name"
          for="collection name"
          value={properties.collectionName}
        />
        <input
          type="text"
          name="collection name"
          value={properties.collectionName}
          onChange={event => {
            properties.setCollectionName(event.target.value);
            properties.setCollectionID(
              convertToAlphaNumeric(event.target.value)
            );
          }}
          className={styles.submitinput}
          placeholder="A short title for your collection"
        />
      </div>
      <div>
        <RequiredLabel
          text="Description"
          for="collection description"
          value={properties.collectionDescription}
        />
        <textarea
          name="collection description"
          value={properties.collectionDescription}
          onChange={event =>
            properties.setCollectionDescription(event.target.value)
          }
          className={styles.submitinput}
          placeholder="The more you say, the easier it will be to find your design"
        />
      </div>
      <div className={styles.inlineinputcontainer}>
        <RequiredLabel
          text="ID"
          for="collection ID"
          value={properties.collectionID}
        />
        <input
          type="text"
          name="collection ID"
          value={properties.collectionID}
          onChange={event => properties.setCollectionID(event.target.value)}
          className={`${styles.submitinput} ${styles.idinput}`}
          placeholder="Alphanumeric and underscore characters only"
        />
      </div>
      <div className={styles.inlineinputcontainer} htmlFor="collection version">
        <RequiredLabel
          text="Version"
          for="collection version"
          value={properties.collectionVersion}
        />
        <input
          type="text"
          name="collection version"
          value={properties.collectionVersion}
          onChange={event =>
            properties.setCollectionVersion(event.target.value)
          }
          className={`${styles.submitinput} ${styles.versioninput}`}
          placeholder="Version"
        />
      </div>
      <div>
        <label
          className={`${styles.submitlabel} ${styles.submitlabeloptional}`}
          htmlFor="collection citations"
        >
          Citations (Optional)
        </label>
        <input
          type="text"
          name="collection citations"
          value={properties.collectionCitations}
          onChange={event => properties.setCollectionCitations(event.value)}
          className={styles.submitinput}
          placeholder="Pubmed IDs separated by commas, we'll do the rest!"
        />
      </div>
    </div>
  );
}

const convertToAlphaNumeric = string => {
  var regexExpr = /^[A-z]\w*$/;
  if (!regexExpr.test(string)) string = formatString(string);
  return string;
};

const formatString = string => {
  for (var index = 0; index < string.length; index++) {
    if (!/\d/.test(string.charAt(index))) {
      string = string.slice(Math.max(0, index));
      break;
    }
  }
  string = string.replace(/ /g, '_');
  string = string.replace(/\W+/g, '');
  return string;
};
