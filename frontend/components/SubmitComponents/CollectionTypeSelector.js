import { useEffect, useState } from 'react';

import styles from '../../styles/submit.module.css';

export default function CollectionTypeSelector(properties) {
  return (
    <div className={styles.collectiontypecontainer}>
      <div className={styles.collectionsubmitto}>Submit to</div>
      <div className={styles.collectiontypes}>
        <TypeSelectorButton
          type="New Collection"
          selectedType={properties.collectionType}
          setType={properties.setCollectionType}
        />
        <TypeSelectorButton
          type="Existing Collection"
          selectedType={properties.collectionType}
          setType={properties.setCollectionType}
        />
      </div>
    </div>
  );
}

export function TypeSelectorButton(properties) {
  const [activeTypeIndicatorClass, setActiveTypeIndicatorClass] = useState(
    styles.notselectedcollectiontype
  );
  useEffect(() => {
    if (properties.selectedType === properties.type)
      setActiveTypeIndicatorClass(styles.selectedcollectiontype);
    else setActiveTypeIndicatorClass(styles.notselectedcollectiontype);
  }, [properties.selectedType]);
  return (
    <div
      role="navigation"
      onClick={() => {
        properties.setType(properties.type);
      }}
      className={`${styles.collectiontypebutton} ${activeTypeIndicatorClass}`}
    >
      {properties.type}
    </div>
  );
}
