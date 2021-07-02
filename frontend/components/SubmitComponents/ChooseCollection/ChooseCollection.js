import { faInfoCircle, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setPromptNewCollection } from '../../../redux/actions';
import styles from '../../../styles/choosecollection.module.css';
import NewCollectionForm from '../NewCollection/NewCollectionForm';
import MajorLabel from '../ReusableComponents/MajorLabel';
import CollectionDisplay from './CollectionDisplay';

export default function ChooseCollection(properties) {
  const dispatch = useDispatch();
  const [filter, setFilter] = useState('');
  const [createCollectionButtonText, setCreateCollectionButtonText] =
    useState('New Collection');

  const promptNewCollection = useSelector(
    state => state.collectionCreate.promptNewCollection
  );

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
            promptNewCollection ? styles.collpasefilter : ''
          }`}
          placeholder={
            properties.selectedCollection
              ? `${properties.selectedCollection.name}, version ${properties.selectedCollection.version}`
              : 'Filter by name, display ID, description, or version'
          }
          onChange={event => setFilter(event.target.value)}
        />
        <div
          className={`${styles.newcollectionbutton} ${
            promptNewCollection ? styles.newcollectionbuttonactive : ''
          }`}
          role="button"
          onClick={() => {
            setFilter('');
            setCreateCollectionButtonText('Tell us about your collection');
            dispatch(setPromptNewCollection(true));
            properties.setSelectedCollection();
          }}
        >
          <FontAwesomeIcon
            icon={!promptNewCollection ? faPlus : faInfoCircle}
            size="1x"
            className={styles.createcollectionbuttonicon}
          />
          {createCollectionButtonText}
        </div>
      </div>
      {!promptNewCollection ? (
        <CollectionDisplay
          filter={filter}
          selectedCollection={properties.selectedCollection}
          setSelectedCollection={properties.setSelectedCollection}
        />
      ) : (
        <NewCollectionForm
          setCreateCollectionButtonText={setCreateCollectionButtonText}
        />
      )}
    </div>
  );
}
