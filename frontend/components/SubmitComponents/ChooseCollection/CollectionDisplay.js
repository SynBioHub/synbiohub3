import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setSelectedCollection } from '../../../redux/actions';
import styles from '../../../styles/choosecollection.module.css';

export default function CollectionDisplay(properties) {
  const canSubmitTo = useSelector(state => state.submit.canSubmitTo);

  const collections = [];
  for (const collection of canSubmitTo) {
    collections.push(
      <CollectionSelector
        key={collection.displayId + collection.name + collection.version}
        filter={properties.filter}
        setFilter={properties.setFilter}
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
  const dispatch = useDispatch();

  const selectedCollection = useSelector(
    state => state.submit.selectedCollection
  );

  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    if (selectedCollection)
      setIsSelected(
        shallowEqualCollection(selectedCollection, properties.collection)
      );
  }, [selectedCollection, properties.collection]);

  if (
    !properties.collection ||
    !checkCollectionPassesFilter(properties.filter, properties.collection)
  )
    return null;

  return (
    <tr
      className={`${isSelected ? styles.selectedcollection : ''}`}
      key={properties.collection.displayId}
      onClick={() => {
        dispatch(setSelectedCollection(properties.collection));
        properties.setFilter('');
      }}
    >
      <td className={styles.name}>{properties.collection.name}</td>
      <td>{properties.collection.description}</td>
      <td>{properties.collection.version}</td>
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

const shallowEqualCollection = (collection1, collection2) => {
  return (
    collection1.displayId === collection2.displayId &&
    collection1.name === collection2.name &&
    collection1.version === collection2.version
  );
};
