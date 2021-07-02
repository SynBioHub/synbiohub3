import { useEffect, useState } from 'react';

import styles from '../../../styles/choosecollection.module.css';

export default function CollectionSelect(properties) {
  const [filter, setFilter] = useState('');
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    const collectionsToDisplay = [];
    for (const collection of properties.canSubmitTo) {
      if (checkCollectionPassesFilter(filter, collection))
        collectionsToDisplay.push(
          <tr
            className={
              Object.is(properties.selected, collection) &&
              styles.selectedcollection
            }
            key={collection.displayId}
            onClick={() => {
              properties.setSelected(collection);
              properties.setSelectCollectionOpen(false);
            }}
          >
            <td className={styles.headertext}>{collection.name}</td>
            <td className={styles.headertext}>{collection.description}</td>
            <td className={styles.headertext}>{collection.version}</td>
          </tr>
        );
    }
    setCollections(collectionsToDisplay);
  }, [filter, properties.canSubmitTo]);
  return (
    <div className={styles.absolutepositionofdropdown}>
      <div className={styles.collectionselect}>
        <input
          type="text"
          className={styles.collectionfilter}
          placeholder="Filter by name, display ID, description, or version"
          onChange={event => setFilter(event.target.value)}
        />
        {collections.length > 0 ? (
          <div className={styles.tablecontainer}>
            <table className={styles.table} id={styles.results}>
              <thead>
                <th>Name</th>
                <th>Description</th>
                <th>Version</th>
              </thead>
              <tbody>{collections}</tbody>
            </table>
          </div>
        ) : (
          <div className={styles.nocollections}>No collections found</div>
        )}
      </div>
    </div>
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
