import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';

import { setSelectedCollection } from '../../redux/actions';
import styles from '../../styles/modal.module.css';
import Loading from '../ReusableComponents/Loading';
import ChooseCollection from '../SubmitComponents/ChooseCollection/ChooseCollection';
import PublishCollectionButton from './PublishCollectionButton';

export default function PublishModal(properties) {
  const { collections, loading, error } = useRootCollections();

  const dispatch = useDispatch();

  const [filteredCollections, setFilteredCollections] = useState();

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

  if (loading) {
    return (
      <div className={styles.outercontainer}>
        <div className={styles.container}>
          <div
            className={styles.closebutton}
            onClick={() => {
              properties.setShowPublishModal(false);
              dispatch(setSelectedCollection());
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
          <div className={styles.loadercontainer}>
            <Loading />
          </div>
        </div>
      </div>
    );
  } else if (error) {
    return (
      <div className={styles.outercontainer}>
        <div className={styles.container}>
          <div
            className={styles.closebutton}
            onClick={() => {
              properties.setShowPublishModal(false);
              dispatch(setSelectedCollection());
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
          <div className={styles.errorcontainer}>
            Errors occured while fetching rootCollections
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.outercontainer}>
      <div className={styles.container}>
        <div
          className={styles.closebutton}
          onClick={() => {
            properties.setShowPublishModal(false);
            dispatch(setSelectedCollection());
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
        <ChooseCollection
          label={label}
          newCollectionLabel="Publish as New Collection"
          overridePost={() => {}}
          overrideCollectionDisplay={collections}
          filler={{
            name: 'text',
            version: '3',
            description: '20'
          }}
        />
        {!promptNewCollection && <PublishCollectionButton />}
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
