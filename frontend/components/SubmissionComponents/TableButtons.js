import {
  faDownload,
  faGlobeAmericas,
  faPlus,
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { useDispatch } from 'react-redux';
import { mutate } from 'swr';

import { addToBasket } from '../../redux/actions';
import styles from '../../styles/submissions.module.css';
import TableButton from '../ReusableComponents/TableButton';

export default function TableButtons(properties) {
  const dispatch = useDispatch();

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
    downloadFiles(itemsChecked, properties.token);
  };

  const removeCheckedItems = () => {
    const itemsChecked = parseAndClearCheckedItems(
      properties.processedData,
      properties.selected,
      properties.setSelected,
      function (submission) {
        return {
          url: `${process.env.backendUrl}${submission.url}/removeCollection`
        };
      }
    );
    removeCollections(itemsChecked, properties.token);
  };

  return (
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
      />
      <TableButton
        title="Remove"
        enabled={properties.buttonEnabled}
        icon={faTrashAlt}
        onClick={() => removeCheckedItems()}
      />
    </div>
  );
}

const downloadFiles = (files, token) => {
  var zip = new JSZip();
  var zipFilename = 'sbhdownload.zip';

  const zippedFilePromises = files.map(file => {
    return zippedFilePromise(file, token);
  });

  Promise.allSettled(zippedFilePromises).then(results => {
    for (const result of results) {
      if (result.status === 'fulfilled') {
        var filename = `${result.value.file.displayId}.${result.value.file.type}`;
        zip.file(filename, result.value.response.data);
      }
    }
    zip.generateAsync({ type: 'blob' }).then(function (content) {
      saveAs(content, zipFilename);
    });
  });
};

const zippedFilePromise = (file, token) => {
  return new Promise((resolve, reject) => {
    axios({
      url: file.url,
      method: 'GET',
      responseType: 'blob',
      headers: {
        'X-authorization': token
      }
    })
      .then(response => {
        if (response.status === 200) resolve({ file, response });
        else reject();
      })
      .catch(error => reject(error));
  });
};

const removeCollections = (collections, token) => {
  const removeCollectionPromises = collections.map(collection =>
    axios({
      url: collection.url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        'X-authorization': token
      }
    })
  );

  Promise.all(removeCollectionPromises).then(() => {
    mutate([`${process.env.backendUrl}/shared`, token]);
    mutate([`${process.env.backendUrl}/manage`, token]);
  });
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