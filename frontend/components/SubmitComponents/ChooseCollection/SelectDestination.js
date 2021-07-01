import { faHandPointLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import styles from '../../../styles/choosecollection.module.css';
import CollectionSelect from './CollectionDropdown';

export default function SelectDestination() {
  const [selected, setSelected] = useState();
  const [selectedDisplayName, setSelectedDisplayName] = useState('');

  const [selectCollectionOpen, setSelectCollectionOpen] = useState(false);

  const canSubmitTo = useSelector(state => state.submit.canSubmitTo);

  useEffect(() => {
    if (selected) setSelectedDisplayName(selected.name);
    else setSelectedDisplayName('Select an existing collection');
  }, [selected]);
  return (
    <div className={styles.selectdestinationcontainer}>
      <div
        role="button"
        className={`${styles.selectdestinationbutton} ${
          selectCollectionOpen && styles.selectdestinationbuttonactive
        }`}
        onClick={() => setSelectCollectionOpen(!selectCollectionOpen)}
      >
        <div
          className={`${styles.selectdestinationbuttontext} ${
            !selected
              ? styles.selectdestinationbuttoninactive
              : styles.selectdestinationbuttonfilled
          }`}
        >
          {selectedDisplayName}
        </div>
        <div
          className={`${styles.selectdestinationbuttoniconcontainer} ${
            selectCollectionOpen && styles.selectdestinationbuttoniconopen
          }`}
        >
          <FontAwesomeIcon icon={faHandPointLeft} size="1x" />
        </div>
      </div>
      {selectCollectionOpen && (
        <CollectionSelect
          canSubmitTo={canSubmitTo}
          selected={selected}
          setSelected={setSelected}
          setSelectCollectionOpen={setSelectCollectionOpen}
        />
      )}
    </div>
  );
}
