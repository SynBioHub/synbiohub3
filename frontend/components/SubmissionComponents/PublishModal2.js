import {
  faHandPointer,
  faPlusCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import styles from '../../styles/modal.module.css';
import SelectorButton from '../ReusableComponents/SelectorButton';
import Table from '../ReusableComponents/Table/Table';
import PublishCollectionButton from './PublishCollectionButton';
import NewCollectionForm from './PublishNewCollectionForm';

const EXISTING = 'to Existing';
const NEW = 'as New';

export default function PublishModal(properties) {
  const { collections, loading } = useRootCollections();
  const [selected, setSelected] = useState(EXISTING);
  const [selectedCollection, setSelectedCollection] = useState();
  const [collectionIndex, setCollectionIndex] = useState(0);

  if (!properties.showPublishModal) {
    return null;
  }

  const collectionSelectors = properties.toPublish.map((collection, index) => {
    return (
      <div
        className={`${styles.collectionSelector} ${
          collectionIndex === index ? styles.collectionSelectorSelected : ''
        }`}
        key={collection.displayId}
        onClick={() => setCollectionIndex(index)}
        role="button"
      >
        {collection.name}
      </div>
    );
  });

  return (
    <div className={styles.outercontainer}>
      <div className={styles.container}>
        <div className={styles.sticktotop}>
          <div className={styles.top}>
            <div className={styles.collectionSelectors}>
              {collectionSelectors}
            </div>
            <div
              className={styles.closebutton}
              onClick={() => {
                properties.setShowPublishModal(false);
              }}
              role="button"
            >
              <FontAwesomeIcon
                icon={faTimesCircle}
                color="#D25627"
                className={styles.closeicon}
              />
              Close
            </div>
          </div>
          <div className={styles.modalheader}>
            <div className={styles.headertitle}>
              <span>Publish</span>{' '}
              <code>{properties.toPublish[collectionIndex].name}</code>
              <span></span>
              <div className={styles.optionscontainer}>
                <SelectorButton
                  name={EXISTING}
                  selected={selected}
                  icon={faHandPointer}
                  onClick={() => setSelected(EXISTING)}
                />
                <SelectorButton
                  name={NEW}
                  selected={selected}
                  icon={faPlusCircle}
                  onClick={() => setSelected(NEW)}
                />
              </div>
              <span>Collection</span>
            </div>
          </div>
        </div>
        {selected === 'to Existing' ? (
          <div>
            <div className={styles.tablecontainer}>
              <Table
                data={collections}
                loading={loading}
                title="Select Collection to Publish To"
                hideCount={true}
                numberShownLabel=" "
                searchable={['name', 'description', 'version']}
                headers={['Name', 'Description', 'Version']}
                sortOptions={options}
                defaultSortOption={options[0]}
                sortMethods={sortMethods}
                updateRowsWhen={selectedCollection}
                dataRowDisplay={collection => (
                  <CollectionDisplay
                    collection={collection}
                    selectedCollection={selectedCollection}
                    onClick={() => setSelectedCollection(collection)}
                  />
                )}
              />
            </div>
            <PublishCollectionButton
              canSubmit={selectedCollection}
              onClick={() => {}}
            />
          </div>
        ) : (
          <NewCollectionForm filler={properties.toPublish[collectionIndex]} />
        )}
      </div>
    </div>
  );
}

function CollectionDisplay(properties) {
  const [style, setStyle] = useState();
  useEffect(() => {
    if (
      properties.selectedCollection &&
      properties.selectedCollection.displayId ===
        properties.collection.displayId
    )
      setStyle(styles.selectedCollection);
    else setStyle('');
  }, [properties.selectedCollection]);
  return (
    <tr
      className={`${styles.trhover} ${style}`}
      key={properties.collection.displayId}
      onClick={properties.onClick}
    >
      <td>
        <code>{properties.collection.name}</code>
      </td>
      <td>{properties.collection.displayId}</td>
      <td>{properties.collection.version}</td>
    </tr>
  );
}

const options = [
  { value: 'name', label: 'Name' },
  { value: 'displayId', label: 'ID' }
];

const sortMethods = {
  name: function (collection1, collection2) {
    return (collection1.name > collection2.name && 1) || -1;
  },
  displayId: function (collection1, collection2) {
    return (collection1.displayId > collection2.displayId && 1) || -1;
  }
};

const useRootCollections = () => {
  const { data, error } = useSWR(
    [`${process.env.backendUrl}/rootCollections`],
    fetcher
  );
  return {
    collections: data,
    loading: !error && !data,
    error: error
  };
};

const fetcher = url =>
  axios
    .get(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain'
      }
    })
    .then(response => response.data);
