import { faInfoCircle, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import styles from '../../../styles/choosecollection.module.css';
import MajorLabel from '../MajorLabel';
import NewCollectionForm from '../NewCollection/NewCollectionForm';
import CollectionDisplay from './CollectionDisplay';

export default function ChooseCollection(properties) {
  const [filter, setFilter] = useState('');
  const [createCollection, setCreateCollection] = useState(false);

  return (
    <div>
      <MajorLabel
        text="Select Destination Collection"
        link="https://wiki.synbiohub.org/userdocumentation/managingsubmitting/"
      />
      <div className={styles.inputandcreatecontainer}>
        <input
          type="text"
          className={`${styles.collectionfilter} ${
            createCollection ? styles.collpasefilter : ''
          }`}
          placeholder={
            properties.selectedCollection.name
              ? `${properties.selectedCollection.name}, version ${properties.selectedCollection.version}`
              : 'Filter by name, ID, description, or version'
          }
          onChange={event => setFilter(event.target.value)}
        />
        <div
          className={`${styles.newcollectionbutton} ${
            createCollection ? styles.newcollectionbuttonactive : ''
          }`}
          role="button"
          onClick={() => {
            setFilter('');
            setCreateCollection(true);
          }}
        >
          <FontAwesomeIcon
            icon={!createCollection ? faPlus : faInfoCircle}
            size="1x"
            className={styles.createcollectionbuttonicon}
          />
          {!createCollection
            ? 'New Collection'
            : 'Tell us about your collection'}
        </div>
      </div>
      {!createCollection ? (
        <CollectionDisplay
          filter={filter}
          selectedCollection={properties.selectedCollection}
          setSelectedCollection={properties.setSelectedCollection}
        />
      ) : (
        <NewCollectionForm setCreateCollection={setCreateCollection} />
      )}
    </div>
  );
}
