import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';

import {
  makePublicCollection,
  setPromptNewCollection,
  setSelectedCollection
} from '../../redux/actions';
import styles from '../../styles/modal.module.css';
import Loading from '../ReusableComponents/Loading';
import ChooseCollection from '../SubmitComponents/ChooseCollection/ChooseCollection';
import PublishCollectionButton from './PublishCollectionButton';

export default function PublishModal(properties) {
  const { collections, loading, error } = useRootCollections();

  const dispatch = useDispatch();

  const [filteredCollections, setFilteredCollections] = useState();

  const publishing = useSelector(state => state.submit.publishing);

  const promptNewCollection = useSelector(
    state => state.collectionCreate.promptNewCollection
  );

  const [label, setLabel] = useState(
    'Select Existing Collection to Publish to'
  );

  useEffect(() => {
    if (properties.toPublish)
      setFilteredCollections(
        properties.toPublish.filter(submission => submission !== undefined)
      );
  }, [properties.toPublish]);

  useEffect(() => {
    if (filteredCollections && filteredCollections.length === 0)
      properties.setShowPublishModal(false);
  }, [filteredCollections]);

  useEffect(() => {
    if (promptNewCollection) {
      setLabel('Review Collection Information for Publishing');
    } else setLabel('Select Existing Collection to Publish to');
  }, [promptNewCollection]);

  if (!properties.showPublishModal) return null;

  if (loading || publishing) {
    return (
      <BasicLayout setShowPublishModal={properties.setShowPublishModal}>
        <div className={styles.loadercontainer}>
          <Loading />
        </div>
      </BasicLayout>
    );
  } else if (error) {
    return (
      <BasicLayout setShowPublishModal={properties.setShowPublishModal}>
        <div className={styles.loadercontainer}>
          <div className={styles.errorcontainer}>
            Errors occured while fetching rootCollections
          </div>
        </div>
      </BasicLayout>
    );
  }

  return (
    <BasicLayout setShowPublishModal={properties.setShowPublishModal}>
      <ChooseCollection
        label={label}
        newCollectionLabel="Publish as New Collection"
        overridePost={(displayId, version, name, description, citations) => {
          dispatch(
            makePublicCollection(
              filteredCollections[0].url,
              displayId,
              version,
              name,
              description,
              citations,
              properties.setShowPublishModal
            )
          );
        }}
        overrideCollectionDisplay={collections}
        filler={filteredCollections[0]}
      />
      {!promptNewCollection && (
        <PublishCollectionButton filteredCollections={filteredCollections} />
      )}
    </BasicLayout>
  );
}

function BasicLayout(properties) {
  const dispatch = useDispatch();
  return (
    <div className={styles.outercontainer}>
      <div className={styles.container}>
        <div
          className={styles.closebutton}
          onClick={() => {
            properties.setShowPublishModal(false);
            dispatch(setSelectedCollection());
            dispatch(setPromptNewCollection(false));
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
        {properties.children}
      </div>
    </div>
  );
}

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
