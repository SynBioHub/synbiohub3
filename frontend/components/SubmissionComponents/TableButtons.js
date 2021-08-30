import {
  faDownload,
  faGlobeAmericas,
  faPlus,
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import React from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { mutate } from 'swr';

import { addToBasket, downloadFiles } from '../../redux/actions';
import styles from '../../styles/submissions.module.css';
import TableButton from '../ReusableComponents/TableButton';
import PublishModal from './PublishModal';

export default function TableButtons(properties) {
  const dispatch = useDispatch();

  const [toPublish, setToPublish] = useState([]);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const addCheckedItemsToBasket = () => {
    const itemsChecked = parseAndClearCheckedItems(
      properties.processedData,
      properties.selected,
      properties.setSelected,
      function (submission) {
        return { uri: submission.uri, name: submission.name };
      }
    );
    dispatch(addToBasket(itemsChecked));
  };

  const downloadCheckedItems = () => {
    const itemsChecked = parseAndClearCheckedItems(
      properties.processedData,
      properties.selected,
      properties.setSelected,
      function (submission) {
        return {
          url: `${process.env.backendUrl}${submission.url}/sbol`,
          name: submission.name,
          displayId: submission.displayId,
          type: 'xml'
        };
      }
    );
    dispatch(downloadFiles(itemsChecked));
  };

  const removeCheckedItems = () => {
    const itemsChecked = parseAndClearCheckedItems(
      properties.processedData,
      properties.selected,
      properties.setSelected,
      function (submission) {
        return {
          url: `${process.env.backendUrl}${submission.url}/removeCollection`,
          name: submission.name,
          privacy: submission.privacy
        };
      }
    );
    removeCollections(itemsChecked, properties.token);
  };

  const preparePublishModal = () => {
    const itemsChecked = parseAndClearCheckedItems(
      properties.processedData,
      properties.selected,
      properties.setSelected,
      function (submission) {
        if (submission.privacy === 'public')
          alert(
            `You cannot publish the "${submission.name}" collection because it is already public`
          );
        else return submission;
      }
    );
    setToPublish(itemsChecked);
    setShowPublishModal(true);
  };

  return (
    <React.Fragment>
      <PublishModal
        setShowPublishModal={setShowPublishModal}
        toPublish={toPublish}
        showPublishModal={showPublishModal}
      />
      <div className={styles.buttonscontainer}>
        <TableButton
          title="Add to Basket"
          enabled={properties.buttonEnabled}
          icon={faPlus}
          onClick={() => addCheckedItemsToBasket()}
        />
        <TableButton
          title="Download"
          enabled={properties.buttonEnabled}
          icon={faDownload}
          onClick={() => downloadCheckedItems()}
        />
        <TableButton
          title="Publish"
          enabled={properties.buttonEnabled}
          icon={faGlobeAmericas}
          onClick={() => preparePublishModal()}
        />
        <TableButton
          title="Remove"
          enabled={properties.buttonEnabled}
          icon={faTrashAlt}
          onClick={() => removeCheckedItems()}
        />
      </div>
    </React.Fragment>
  );
}

const removeCollections = (collections, token) => {
  const removeCollectionPromises = collections.map(collection => {
    if (collection.privacy === 'public') {
      alert(
        `${collection.name} cannot be removed because it has been published`
      );
    } else {
      return axios({
        url: collection.url,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/plain',
          'X-authorization': token
        }
      });
    }
  });

  Promise.all(removeCollectionPromises)
    .then(() => {
      mutate([`${process.env.backendUrl}/shared`, token]);
      mutate([`${process.env.backendUrl}/manage`, token]);
    })
    .catch(error => alert(error));
};

const parseAndClearCheckedItems = (
  processedData,
  selected,
  setSelected,
  parsedSubmission
) => {
  const itemsChecked = [];
  let checklist = new Map();
  for (const submission of processedData) {
    checklist.set(submission.displayId, false);
    if (selected.get(submission.displayId)) {
      itemsChecked.push(parsedSubmission(submission));
    }
  }
  setSelected(checklist);
  return itemsChecked;
};
