import { useEffect, useState } from 'react';

import styles from '../../styles/submit.module.css';

export default function CollectionTypeSelector(properties) {
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
