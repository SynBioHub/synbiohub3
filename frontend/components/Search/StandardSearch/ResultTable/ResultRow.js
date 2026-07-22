// ResultRow.js
import { faGlobeAmericas, faUserLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import router from 'next/router';
import React, { useState, useEffect } from 'react';
import { processUrl } from '../../../Admin/Registries';
import { useSelector, useDispatch } from 'react-redux';
import showdown from 'showdown';

import { getTypeColor } from '../../../../utilities/typeColor';
import styles from '../../../../styles/resulttable.module.css';

const sdconverter = new showdown.Converter();

/**
 * This component renders a single result row in the result table in standard search
 */
export default function ResultRow(properties) {
  // Use the type prop directly
  const displayType = properties.type || '';
  const typeColor = getTypeColor(displayType);

  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  const [processedUri, setProcessedUri] = useState(properties.uri);
  const registries = JSON.parse(localStorage.getItem("registries")) || {};

  useEffect(() => {
    async function processAndSetUri() {
      const result = await processUrl(properties.uri, registries);
      setProcessedUri(result.urlRemovedForLink || result.urlReplacedForBackend);
    }
    
    processAndSetUri();
  }, [dispatch, properties.uri]);

  let privacy = <FontAwesomeIcon icon={faUserLock} color="#ff0000" size="1x" />;
  if (!properties.uri.includes('/user/')) {
    privacy = <FontAwesomeIcon icon={faGlobeAmericas} size="1x" />;
  }

  return (
    <tr
      onClick={() => {
        router.push(processedUri);
      }}
    >
      <td>
        <input
          className={styles.checkbox}
          checked={properties.selected.get(properties.displayId)}
          onChange={event => {
            properties.setSelected(
              new Map(
                properties.selected.set(
                  properties.displayId,
                  event.target.checked
                )
              )
            );
          }}
          onClick={event => {
            event.stopPropagation();
          }}
          type="checkbox"
        />
      </td>

      <td className={styles.nameCell}>
        <div className={styles.displayId}>{properties.displayId}</div>
        <div className={styles.name}>{properties.name}</div>
      </td>

      <td>
        <div
          className={styles.markdownContent}
          dangerouslySetInnerHTML={{
            __html: sdconverter.makeHtml(properties.description || '')
          }}
        />
      </td>

      <td>
        {displayType && (
          <span
            className={styles.typeBadge}
            style={{
              backgroundColor: typeColor.background,
              borderColor: typeColor.border,
              color: typeColor.color
            }}
          >
            {displayType}
          </span>
        )}
      </td>

      <td className={styles.privacyCell}>{privacy}</td>
    </tr>
  );
}
