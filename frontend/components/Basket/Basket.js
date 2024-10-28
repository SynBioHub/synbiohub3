/* eslint sonarjs/cognitive-complexity: "off" */
import {
  faCloudDownloadAlt,
  faPlus,
  faShoppingBasket,
  faTimesCircle,
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { clearBasket, restoreBasket } from '../../redux/actions';
import { downloadFiles } from '../../redux/actions';
import styles from '../../styles/basket.module.css';
import Table from '../Reusable/Table/Table';
import TableButton from '../Reusable/TableButton';
import BasketItem from './BasketItem';
import CreateCollection from './CreateCollection';

const searchable = ['name', 'displayId', 'type', 'description'];

import feConfig from "../../config.json";

/**
 * This component represents the basket in the search page. It stores the uri/name/displayId of
 * search results users would like to store for later (whether that be to create a collection, for
 * future reference, or for downloading)
 */
export default function Basket() {
  const [showBasket, setShowBasket] = useState(false);
  const token = useSelector(state => state.user.token);
  const basketItems = useSelector(state => state.basket.basket);
  const dispatch = useDispatch();
  const [selected, setSelected] = useState(new Map());
  const [selectAll, setSelectAll] = useState(false);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [itemsToAddToCollection, setItemsToAddToCollection] = useState([]);
  const [createCollectionMode, setCreateCollectionMode] = useState(false);
  const theme = JSON.parse(localStorage.getItem('theme')) || {};

  useEffect(() => {
    dispatch(restoreBasket(token));
  }, []);

  useEffect(() => {
    if (basketItems) {
      let checklist = new Map();
      for (const item of basketItems) checklist.set(item.displayId, false);
      setSelected(checklist);
    }
  }, [basketItems]);

  useEffect(() => {
    if (selected && selected.size > 0) {
      let allSelected = true;
      let oneSelected = false;
      for (const checked of selected.values()) {
        if (!checked) {
          allSelected = false;
        } else {
          oneSelected = true;
        }
      }
      setSelectAll(allSelected);
      setButtonEnabled(oneSelected);
    }
  }, [selected, basketItems]);

  if (!showBasket) {
    return (
      <FontAwesomeIcon
        icon={faShoppingBasket}
        size="2x"
        color={theme?.themeParameters?.[0]?.value || '#D25627'} // Use theme color or default to #D25627
        className={styles.basketicon}
        onClick={() => setShowBasket(true)}
      />
    );
  }

  if (createCollectionMode) {
    return (
      <CreateCollection
        setShowBasket={setShowBasket}
        setCreateCollectionMode={setCreateCollectionMode}
        itemsToAddToCollection={itemsToAddToCollection}
      />
    );
  }

  return (
    <div>
      <div className={styles.basketcontent}>
        <div className={styles.heading}>
          <TableButton
            title="Add to Collection"
            icon={faPlus}
            enabled={buttonEnabled}
            onClick={() => {
              addCheckedToCollection(
                basketItems,
                selected,
                setSelected,
                setItemsToAddToCollection,
                setCreateCollectionMode
              );
            }}
          />
          <TableButton
            title="Download"
            icon={faCloudDownloadAlt}
            enabled={buttonEnabled}
            onClick={() =>
              downloadCheckedItems(basketItems, selected, setSelected, dispatch)
            }
          />
          <TableButton
            title="Remove from Basket"
            icon={faTrashAlt}
            enabled={buttonEnabled}
            onClick={() => {
              clearCheckedItems(basketItems, selected, setSelected, dispatch);
            }}
          />
        </div>

        <div className={styles.itemscontainer}>
          <Table
            data={basketItems}
            topStickyIncrement={4}
            hideFooter={true}
            loading={false}
            title="Basket "
            searchable={searchable}
            headers={[
              <input
                key={0}
                checked={selectAll}
                onChange={event => {
                  let checklist = new Map();
                  for (const items of basketItems)
                    checklist.set(items.displayId, event.target.checked);
                  setSelected(checklist);
                  setSelectAll(event.target.checked);
                }}
                type="checkbox"
              />,
              'Name',
              'Type',
              'Version'
            ]}
            sortOptions={options}
            defaultSortOption={options[0]}
            sortMethods={sortMethods}
            numberShownLabel=" "
            updateRowsWhen={selected}
            dataRowDisplay={item => (
              <BasketItem
                key={item.displayId}
                item={item}
                selected={selected}
                setSelected={setSelected}
                theme={theme}
              />
            )}
          />
        </div>
      </div>

      <FontAwesomeIcon
        icon={faTimesCircle}
        size="2x"
        color="#D25627"
        spin
        className={styles.basketicon}
        onClick={() => setShowBasket(false)}
      />
    </div>
  );
}

const clearCheckedItems = (items, selected, setSelected, dispatch) => {
  const itemsChecked = parseAndClearCheckedItems(
    items,
    selected,
    setSelected,
    function (item) {
      return {
        displayId: item.displayId,
        version: item.version
      };
    }
  );
  dispatch(clearBasket(itemsChecked));
};

const downloadCheckedItems = (items, selected, setSelected, dispatch) => {
  const itemsChecked = parseAndClearCheckedItems(
    items,
    selected,
    setSelected,
    function (item) {
      return {
        url: `${feConfig.backend}${item.url}/sbol`,
        name: item.name,
        displayId: item.displayId,
        type: 'xml',
        status: 'downloading'
      };
    }
  );
  dispatch(downloadFiles(itemsChecked));
};

const addCheckedToCollection = (
  items,
  selected,
  setSelected,
  setItemsToAddToCollection,
  setCreateCollectionMode
) => {
  const itemsChecked = parseAndClearCheckedItems(
    items,
    selected,
    setSelected,
    function (item) {
      return {
        url: item.url,
        uri: item.uri,
        name: item.name,
        displayId: item.displayId,
        type: 'xml',
        status: 'downloading'
      };
    }
  );
  setItemsToAddToCollection(itemsChecked);
  setCreateCollectionMode(true);
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

const options = [
  { value: 'name', label: 'Name' },
  { value: 'type', label: 'Type' },
  { value: 'version', label: 'Version' }
];

const compareStrings = (string1, string2) => {
  if (!string1 && !string2) return 0; // Both strings are undefined or null, they are equal
  if (!string1) return -1; // Only string1 is undefined or null, string1 is less
  if (!string2) return 1;  // Only string2 is undefined or null, string1 is greater

  const lowerString1 = string1.toLowerCase();
  const lowerString2 = string2.toLowerCase();

  return (lowerString1 > lowerString2 && 1) || (lowerString1 < lowerString2 && -1) || 0;
};

const sortMethods = {
  name: (submission1, submission2) =>
    compareStrings(submission1.name, submission2.name),
  type: (submission1, submission2) =>
    compareStrings(submission1.type, submission2.type),
  version: (submission1, submission2) =>
    compareStrings(submission1.version, submission2.version)
};