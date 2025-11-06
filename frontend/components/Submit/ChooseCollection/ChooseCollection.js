import { faInfoCircle, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setPromptNewCollection } from '../../../redux/actions';
import styles from '../../../styles/choosecollection.module.css';
import NewCollectionForm from '../NewCollection/NewCollectionForm';
import MajorLabel from '../ReusableComponents/MajorLabel';
import CollectionDisplay from './CollectionDisplay';

export default function ChooseCollection(properties) {
  const dispatch = useDispatch();
  const [filter, setFilter] = useState('');
  const createCollectionButtonText = useSelector(
    state => state.collectionCreate.buttonText
  );

  const selectedCollection = useSelector(
    state => state.submit.selectedCollection
  );

  const promptNewCollection = useSelector(
    state => state.collectionCreate.promptNewCollection
  );

  // Handle forceNewCollection prop - only update if it doesn't match current state
  useEffect(() => {
    if (properties.forceNewCollection === true && !promptNewCollection) {
      dispatch(setPromptNewCollection(true));
    } else if (properties.forceNewCollection === false && promptNewCollection) {
      dispatch(setPromptNewCollection(false));
    }
  }, [properties.forceNewCollection, promptNewCollection, dispatch]);

  // Don't show the label if it's empty
  const showLabel = properties.label && properties.label.trim() !== '';
  
  // Don't show create button if showCreateButton is false
  const showCreateButton = properties.showCreateButton !== false;

  return (
    <div>
      {showLabel && (
        <MajorLabel
          text={properties.label}
          link="https://wiki.synbiohub.org/userdocumentation/managingsubmitting/"
        />
      )}
      <div className={styles.inputandcreatecontainer}>
        {!promptNewCollection && (
          <div className={styles.searchInputWrapper}>
            <FontAwesomeIcon
              icon={faSearch}
              className={styles.searchIcon}
            />
            <input
              type="text"
              value={filter}
              className={`${styles.collectionfilter} ${
                promptNewCollection ? styles.collpasefilter : ''
              } ${selectedCollection ? styles.collectionfilteraactive : ''}`}
              placeholder={
                selectedCollection
                  ? `${selectedCollection.name}, version ${selectedCollection.version}`
                  : 'Filter by name, display ID, description, or version'
              }
              onChange={event => setFilter(event.target.value)}
            />
          </div>
        )}
        {showCreateButton && !promptNewCollection && (
          <div
            className={styles.newcollectionbutton}
            role="button"
            onClick={() => {
              setFilter('');
              dispatch(setPromptNewCollection(true));
            }}
          >
            <FontAwesomeIcon
              icon={faPlus}
              size="1x"
              className={styles.createcollectionbuttonicon}
            />
            {createCollectionButtonText}
          </div>
        )}
      </div>
      {!promptNewCollection ? (
        <CollectionDisplay filter={filter} setFilter={setFilter} />
      ) : (
        <NewCollectionForm hideCancel={properties.hideCancel} />
      )}
    </div>
  );
}
