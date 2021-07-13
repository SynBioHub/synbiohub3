import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import styles from '../../../styles/choosecollection.module.css';

export default function CollectionDisplay(properties) {
  const canSubmitTo = useSelector(state => state.submit.canSubmitTo);

  const collections = [];
  for (const collection of canSubmitTo) {
    collections.push(
      <CollectionSelector
        key={collection.displayId + collection.name + collection.version}
        filter={properties.filter}
        selected={properties.selectedCollection}
        setSelected={properties.setSelectedCollection}
        collection={collection}
      />
    );
  }

  return (
    <div className={styles.tablecontainer}>
      <table className={styles.table} id={styles.results}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Version</th>
          </tr>
        </thead>
        <tbody>{collections}</tbody>
      </table>
    </div>
  );
}

function CollectionSelector(properties) {
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    setIsSelected(Object.is(properties.selected, properties.collection));
  }, [properties.selected]);

  if (
    !properties.collection ||
    !checkCollectionPassesFilter(properties.filter, properties.collection)
  )
    return null;

  return (
    <tr
      className={isSelected ? styles.selectedcollection : undefined}
      key={properties.collection.displayId}
      onClick={() => {
        properties.setSelected(properties.collection);
      }}
    >
      <td className={styles.headertext}>{properties.collection.name}</td>
      <td className={styles.headertext}>{properties.collection.description}</td>
      <td className={styles.headertext}>{properties.collection.version}</td>
    </tr>
  );
}

const checkCollectionPassesFilter = (filter, collection) => {
  return (
    collection.name.includes(filter) ||
    collection.displayId.includes(filter) ||
    collection.description.includes(filter) ||
    collection.version.includes(filter)
  );
};
