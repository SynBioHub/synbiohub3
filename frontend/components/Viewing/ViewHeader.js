import { faDatabase, faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/view.module.css';

import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { useState } from 'react';

import axios from 'axios';

import Link from 'next/link';

import { isUriOwner } from './Shell';

import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

export default function ViewHeader(properties) {
  const [displayedTitle, setDisplayedTitle] = useState(properties.name);  // New state for the displayed title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(properties.name);

  const [displayedDescription, setDisplayedDescription] = useState(properties.description);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(properties.description);

  var displayTitle = properties.type;
  if (properties.type.includes('#')) {
    displayTitle = properties.type.split('#')[1];
  }
  var displayLink = properties.type;

  const descriptionRef = useRef(null);

  const handleEditClick = () => {
    setIsEditingTitle(true);
  };

  const makeEditable = () => {
    setIsEditingDescription(true);
  };

  const objectUriParts = getAfterThirdSlash(properties.uri);

  const token = useSelector(state => state.user.token);
  const username = useSelector(state => state.user.username);
  const objectUri = `${publicRuntimeConfig.backend}/${objectUriParts}`;
  var isOwner = isUriOwner(objectUri, username);

  console.log(objectUri);

  const similar = () => {
    axios.get(`${objectUri}/similar`, {
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Accept": "application/json"
      }
    })
      .then(response => {
        console.log(response.data);
      })
      .catch(error => {
        console.error('Error fetching similar: ', error);
      });
  };
  const twins = () => {
    axios.get(`${objectUri}/twins`, {
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Accept": "application/json"
      }
    })
      .then(response => {
        console.log(response.data);
      })
      .catch(error => {
        console.error('Error fetching twins: ', error);
      });
  };
  const uses = () => {
    axios.get(`${objectUri}/uses`, {
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Accept": "application/json"
      }
    })
      .then(response => {
        console.log(response.data);
      })
      .catch(error => {
        console.error('Error fetching uses: ', error);
      });
  };

  const saveDescription = () => {
    axios.post(`${objectUri}/edit/description`, {
      previous: properties.description,
      object: editedDescription
    }, {
      headers: {
        "Accept": "text/plain; charset=UTF-8",
        "X-authorization": token
      }
    })
      .then(response => {
        setDisplayedDescription(editedDescription);  // Update the displayed description
        setIsEditingDescription(false); // Exit edit mode
      })
      .catch(error => {
        console.error('Error updating description:', error);
      });
  };

  const confirmDescriptionDeletion = () => {
    // Show a confirmation dialog
    const userConfirmed = window.confirm("Do you want to delete this description?");

    if (userConfirmed) {
      // User clicked "OK"
      deleteDescription();
    } else {
      // User clicked "Cancel", do nothing
    }
  };

  const confirmTitleDeletion = () => {
    // Show a confirmation dialog
    const userConfirmed = window.confirm("Do you want to delete this description?");

    if (userConfirmed) {
      // User clicked "OK"
      deleteTitle();
    } else {
      // User clicked "Cancel", do nothing
    }
  };

  const deleteDescription = () => {
    axios.post(`${objectUri}/remove/description`, {
      object: properties.description
    }, {
      headers: {
        "Accept": "text/plain; charset=UTF-8",
        "X-authorization": token
      }
    })
      .then(response => {
        // Successfully deleted the description, now reset the relevant states
        setDisplayedDescription('');  // Reset the displayed description
        setEditedDescription('');
        setIsEditingDescription(false); // Exit edit mode if it's active
      })
      .catch(error => {
        console.error('Error removing description:', error);
      });
  };

  const deleteTitle = () => {
    axios.post(`${objectUri}/remove/title`, {
      object: properties.name
    }, {
      headers: {
        "Accept": "text/plain; charset=UTF-8",
        "X-authorization": token
      }
    })
      .then(response => {
        // Successfully deleted the description, now reset the relevant states
        setDisplayedTitle('');  // Reset the displayed description
        setEditedTitle('');
        setIsEditingTitle(false); // Exit edit mode if it's active
      })
      .catch(error => {
        console.error('Error removing description:', error);
      });
  };


  const handleSaveTitle = () => {
    // Axios POST request to save edited title
    axios.post(`${objectUri}/edit/title`, {
      previous: properties.name,  // original title
      object: editedTitle         // new (edited) title
    }, {
      headers: {
        "Accept": "text/plain; charset=UTF-8",
        "X-authorization": token
      }
    })
      .then(response => {
        setIsEditingTitle(false);
        setDisplayedTitle(editedTitle);  // Update the displayed title
      })
      .catch(error => {
        console.error('Error saving title:', error);
      });
  };

  const handleCancelTitle = () => {
    setEditedTitle(properties.name); // Reset to original title
    setIsEditingTitle(false);
  };

  return (
    <div>
      <div className={styles.contentheader}>
        {isEditingTitle ? (
          <div>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
            />
            <button onClick={handleSaveTitle}>Save</button>
            <button onClick={handleCancelTitle}>Cancel</button>
          </div>
        ) : (
          <div className={styles.titleContainer}>
            <h1 className={styles.maintitle}>{displayedTitle}</h1>
            {isOwner && (
              <>
                <FontAwesomeIcon
                  icon={faPencilAlt}
                  onClick={handleEditClick}
                  className={styles.editIcon}
                  title="Edit title"
                />
                {properties.name.length > 0 && (
                  <FontAwesomeIcon
                    icon={faTrash}
                    size="1x"
                    className={styles.editIcon}
                    title="Remove title"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmTitleDeletion();
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}
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
      <div className={styles.description}
        title={displayedDescription.length > 0 ? "Find all records with terms in common with this description" : ""}>
        {isEditingDescription ? (
          <div>
            <input
              type="text"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
            />
            <button onClick={saveDescription}>Save</button>
            <button onClick={() => setIsEditingDescription(false)}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px' }}>{displayedDescription}</span>
            {isOwner && (
              <>
                <FontAwesomeIcon
                  icon={faPencilAlt}
                  size="1x"
                  className={styles.pencilicon}
                  title="Add/Edit description"
                  onClick={(e) => {
                    e.stopPropagation();
                    makeEditable(properties.description);
                  }}
                />
                {properties.description.length > 0 && (
                  <FontAwesomeIcon
                    icon={faTrash}
                    size="1x"
                    className={styles.deleteIcon}
                    title="Remove description"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDescriptionDeletion();
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
      <div>
        {properties.search.similar && (
          <button className={styles.searchButton} onClick={similar}> Similar </button>
        )}
        {properties.search.twins && (
          <button className={styles.searchButton} onClick={twins}> Twins </button>
        )}
        {properties.search.uses && (
          <button className={styles.searchButton} onClick={uses}> Uses </button>
        )}
      </div>
    </div>
  );
}

export function getAfterThirdSlash(uri) {
  const parts = uri.split('/');
  const afterThirdSlashParts = parts.slice(3);
  return afterThirdSlashParts.join('/');
}

