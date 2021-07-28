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
    setIsSelected(Object.is(selectedCollection, properties.collection));
  }, [selectedCollection]);

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
        dispatch(setSelectedCollection(properties.collection));
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
