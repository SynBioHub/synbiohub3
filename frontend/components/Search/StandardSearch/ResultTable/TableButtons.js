import {
  faDownload,
  faGlobeAmericas,
  faPlus,
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import getConfig from 'next/config';
import React from 'react';
import { useDispatch } from 'react-redux';

import { addToBasket, downloadFiles } from '../../../../redux/actions';
import styles from '../../../../styles/resulttable.module.css';
import Navigation from './Navigation';
const { publicRuntimeConfig } = getConfig();

export default function TableButtons(properties) {
  const dispatch = useDispatch();
  return (
    <div className={styles.tablebuttons}>
      <div className={styles.actions}>
        <div
          role="button"
          className={`${styles.tablebutton} ${properties.buttonClass}  ${styles.rightspace}`}
          onClick={() => {
            const itemsChecked = [];

            let checklist = new Map();
            for (const result of properties.data) {
              checklist.set(result.displayId, false);
              if (properties.selected.get(result.displayId)) {
                itemsChecked.push(result);
              }
            }
            properties.setSelected(checklist);
            dispatch(addToBasket(itemsChecked));
          }}
        >
          <span className={styles.buttonicon}>
            <FontAwesomeIcon icon={faPlus} color="#00000" size="1x" />
          </span>
          Add to Basket
        </div>

        <div
          className={`${styles.tablebutton} ${properties.buttonClass} ${styles.rightspace}`}
          role="button"
          onClick={() => {
            const itemsChecked = [];
            let checklist = new Map();
            for (const result of properties.data) {
              checklist.set(result.displayId, false);
              if (properties.selected.get(result.displayId)) {
                itemsChecked.push(convertToDownloadableFile(result));
              }
            }
            properties.setSelected(checklist);
            dispatch(downloadFiles(itemsChecked));
          }}
        >
          <span className={styles.buttonicon}>
            <FontAwesomeIcon icon={faDownload} color="#00000" size="1x" />
          </span>
          Download
        </div>
        {properties.submissionsPage ? (
          <React.Fragment>
            <div
              className={`${styles.tablebutton} ${properties.buttonClass} ${styles.rightspace}`}
            >
              <span className={styles.buttonicon}>
                <FontAwesomeIcon
                  icon={faGlobeAmericas}
                  color="#00000"
                  size="1x"
                />
              </span>
              Publish
            </div>
            <div
              className={`${styles.tablebutton} ${properties.buttonClass} ${styles.rightspace}`}
            >
              <span className={styles.buttonicon}>
                <FontAwesomeIcon icon={faTrashAlt} color="#00000" size="1x" />
              </span>
              Remove
            </div>
          </React.Fragment>
        ) : null}
      </div>

      <Navigation count={properties.count} />
    </div>
  );
}

const convertToDownloadableFile = item => {
  return {
    url: `${publicRuntimeConfig.backend}${item.url}/sbol`,
    name: item.name,
    displayId: item.displayId,
    type: 'xml',
    status: 'downloading'
  };
};
