import styles from '../../styles/submit.module.css';
import MajorLabel from './MajorLabel';
import SubmitLabel from './SubmitLabel';

export default function NewCollectionForm(properties) {
  return (
    <div className={styles.newcollectioncontainer}>
      <MajorLabel
        text="New Collection Information"
        link="https://wiki.synbiohub.org/userdocumentation/managingsubmitting/"
      />
      <div>
        <SubmitLabel
          text="Name"
          for="collection name"
          value={properties.collectionName}
          required={true}
        />
        <input
          type="text"
          name="collection name"
          value={properties.collectionName}
          onChange={event => {
            properties.setCollectionName(event.target.value);
            properties.setCollectionID(
              convertToAlphanumeric(event.target.value)
            );
          }}
          className={styles.submitinput}
          placeholder="A short title for your collection"
        />
      </div>
      <div>
        <SubmitLabel
          text="Description"
          for="collection description"
          value={properties.collectionDescription}
          required={true}
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
        <SubmitLabel
          text="ID"
          for="collection ID"
          value={properties.collectionID}
          required={true}
        />
        <input
          type="text"
          name="collection ID"
          value={properties.collectionID}
          onChange={event =>
            properties.setCollectionID(
              convertToAlphanumeric(event.target.value)
            )
          }
          className={`${styles.submitinput} ${styles.idinput}`}
          placeholder="Alphanumeric and underscore characters only"
        />
      </div>
      <div className={styles.inlineinputcontainer} htmlFor="collection version">
        <SubmitLabel
          text="Version"
          for="collection version"
          value={properties.collectionVersion}
          required={true}
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
        <SubmitLabel
          text="Citations (Optional)"
          for="collection citations"
          required={false}
        />
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
