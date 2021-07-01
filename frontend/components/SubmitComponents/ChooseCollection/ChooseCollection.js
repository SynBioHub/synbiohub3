import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import styles from '../../../styles/choosecollection.module.css';
import MajorLabel from '../MajorLabel';
import CollectionDisplay from './CollectionDisplay';

export default function ChooseCollection(properties) {
  const [filter, setFilter] = useState('');

  return (
    <div>
      <MajorLabel
        text="Select Destination Collection"
        link="https://wiki.synbiohub.org/userdocumentation/managingsubmitting/"
      />
      <div className={styles.inputandcreatecontainer}>
        <input
          type="text"
          className={styles.collectionfilter}
          placeholder="Filter by name, ID, description, or version"
          onChange={event => setFilter(event.target.value)}
        />
        <div className={styles.newcollectionbutton}>
          <FontAwesomeIcon
            icon={faPlus}
            size="1x"
            className={styles.createcollectionbuttonicon}
          />
          New Collection
        </div>
      </div>
      <CollectionDisplay
        filter={filter}
        selectedCollection={properties.selectedCollection}
        setSelectedCollection={properties.setSelectedCollection}
      />
    </div>
  );
}
