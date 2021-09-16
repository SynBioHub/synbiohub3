import {
  faHandPointer,
  faPlusCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useState } from 'react';
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

  if (!properties.showPublishModal) {
    return null;
  }

  return (
    <div className={styles.outercontainer}>
      <div className={styles.container}>
        <div className={styles.modalheader}>
          <div className={styles.headertitle}>
            <span>Publish</span> <code>{properties.toPublish[0].name}</code>
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
        {selected === 'to Existing' ? (
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
              dataRowDisplay={collection => (
                <tr key={collection.displayId}>
                  <td>
                    <code>{collection.name}</code>
                  </td>
                  <td>{collection.displayId}</td>
                  <td>{collection.version}</td>
                </tr>
              )}
            />
          </div>
        ) : (
          <NewCollectionForm filler={properties.toPublish[0]} />
        )}
        <PublishCollectionButton />
      </div>
    </div>
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
