import { faGlobeAmericas, faUserLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import router from 'next/router';
import React, { useState, useEffect } from 'react';
import { processUrl } from '../../../Admin/Registries';
import { useSelector, useDispatch } from 'react-redux';

import styles from '../../../../styles/resulttable.module.css';

/**
 * This component renders a single result row in the result table in standard search
 */
export default function ResultRow(properties) {
  let type = '';
  const potentialType = properties.type.toLowerCase();
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  const [processedUri, setProcessedUri] = useState(properties.uri);
  const registries = JSON.parse(localStorage.getItem("registries")) || {};

  useEffect(() => {
    async function processAndSetUri() {
      const result = await processUrl(properties.uri, registries);
      setProcessedUri(result.urlRemovedForLink || result.original);
    }
    
    processAndSetUri();
  }, [dispatch, properties.uri]);

  // Identify what type of object the search result is from type url
  if (potentialType.includes('component')) {
    type = 'Component';
  }
  if (potentialType.includes('sequence')) {
    type = 'Sequence';
  }
  if (potentialType.includes('module')) {
    type = 'Module';
  }
  if (potentialType.includes('collection')) {
    type = 'Collection';
  }

  let privacy = <FontAwesomeIcon icon={faGlobeAmericas} size="1x" />;
  if (!properties.uri.includes('/public/'))
    privacy = <FontAwesomeIcon icon={faUserLock} color="#ff0000" size="1x" />;

  return (
    <tr
      onClick={() => {
        router.push(processedUri);
      }}
    >
      <td>
        <input
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

      <td className={styles.name}>
        <code>{properties.name}</code>
      </td>

      <td>{properties.displayId}</td>

      <td>{properties.description}</td>

      <td>{type}</td>

      <td>{privacy}</td>
    </tr>
  );
}
