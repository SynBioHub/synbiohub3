import { faDatabase, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/view.module.css';

import React, { useRef } from 'react';
import { useSelector } from 'react-redux';

import axios from 'axios';

import Link from 'next/link';

import { isUriOwner } from './Shell';

import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

export default function ViewHeader(properties) {
  var displayTitle = properties.type;
  if (properties.type.includes('#')) {
    displayTitle = properties.type.split('#')[1];
  }
  var displayLink = properties.type;

  const descriptionRef = useRef(null);

  const makeEditable = (description) => {
    const descriptionContainer = descriptionRef.current;
    if (descriptionContainer) {
      // Replace the description text with an editable text box and a save button
      descriptionContainer.innerHTML = `
        <input type="text" value="${description}" class="editable-description" />
        <button class="save-button">Save</button>
      `;

      // Add click event listener to the save button
      const saveButton = descriptionContainer.querySelector('.save-button');
      saveButton.addEventListener('click', () => saveDescription());
    }
  };

  function getAfterThirdSlash(uri) {
    const parts = uri.split('/');
    const afterThirdSlashParts = parts.slice(3);
    return afterThirdSlashParts.join('/');
  }

  const objectUriParts = getAfterThirdSlash(properties.uri);

  const token = useSelector(state => state.user.token);
  const username = useSelector(state => state.user.username);
  const objectUriEdit = `${publicRuntimeConfig.backend}/${objectUriParts}/edit`;
  var isOwner = isUriOwner(objectUriEdit, username);

  const saveDescription = () => {
    const editedText = descriptionRef.current.querySelector('.editable-description').value;
    const previousDescription = properties.description;

    axios.post(`${objectUriEdit}/description`, {
      previous: previousDescription,
      object: editedText
    }, {
      headers: {
        "Accept": "text/plain; charset=UTF-8",
        "X-authorization": token
      }
    })
      .then(response => {
        // Handle response here
        // Refresh the page after successful update
        window.location.reload();
      })
      .catch(error => {
        // Handle error here
        console.error('Error updating description:', error);
      });
  };

  return (
    <div>
      <div className={styles.contentheader}>
        <h1 className={styles.maintitle}>{properties.name}</h1>
        <Link href={`/search/displayId='${properties.displayId}'&`}>
          <a title="Find all records with the same identifier" target="_blank">
            <h1 className={styles.maintitleid}>({properties.displayId})</h1>
          </a>
        </Link>
      </div>
      <div className={styles.contentinfo}>
        <Link href={displayLink}>
          <a title="Learn more about this RDF type" target="_blank">
            <FontAwesomeIcon
              icon={faDatabase}
              size="1x"
              className={styles.contentinfoicon}
            />
            {displayTitle}
          </a>
        </Link>
      </div>
      <div ref={descriptionRef} className={styles.description} title="Find all records with terms in common with this description">
        <div
          style={{ display: 'flex', alignItems: 'center' }}
          onClick={() => window.open(`/search/?q=${properties.description}`, '_blank')}
        >
          <span style={{ marginRight: '10px' }}>{properties.description}</span>
          {isOwner && (
            <FontAwesomeIcon
              icon={faPencilAlt}
              size="1x"
              className={styles.pencilicon}
              onClick={(e) => {
                e.stopPropagation();
                makeEditable(properties.description);
              }}
            />
          )}
        </div>
      </div>

    </div>
  );
}


