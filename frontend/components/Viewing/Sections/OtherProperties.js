import React, { useEffect, useState } from 'react';
import { faSearch, faInfoCircle, faTrash, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import getOtherProperties from '../../../sparql/getOtherProperties';
import getQueryResponse from '../../../sparql/tools/getQueryResponse';
import { getAfterThirdSlash } from '../ViewHeader';
import { isValidURI } from '../Shell';
import Loading from '../../Reusable/Loading';
import Link from 'next/link';
import lookupRole from '../../../namespace/lookupRole';

import styles from '../../../styles/view.module.css';
import { useDispatch, useSelector } from 'react-redux';

import axios from 'axios';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

const CAN_VIEW_PREDICATE = 'http://wiki.synbiohub.org/wiki/Terms/synbiohub#canView';

export default function OtherProperties(properties) {
  const [otherProps, setOtherProps] = useState();
  const [viewers, setViewers] = useState([]);
  const [newPredicate, setNewPredicate] = useState('');
  const [newValue, setNewValue] = useState('');

  const [editingKey, setEditingKey] = useState(null);
  const [editedValue, setEditedValue] = useState('');

  const [originalPredicate, setOriginalPredicate] = useState('');
  const [originalValue, setOriginalValue] = useState('');

  const token = useSelector(state => state.user.token);
  const username = useSelector(state => state.user.username);
  const graphUri = useSelector(state => state.user.graphUri);

  const dispatch = useDispatch();

  useEffect(() => {
    getQueryResponse(dispatch, getOtherProperties, {
      uri: properties.uri
    }, token).then(props => {
      if (props.length > 0) {
        setOtherProps(props);
      } else {
        setOtherProps([]); // clear if nothing
      }
    });

  }, [dispatch, properties.uri, token]);

  // Viewers (sbh:canView) live in each viewer's own graph, so they are not part of
  // getOtherProperties; fetch them separately. The backend authorizes anyone with
  // access (owners and viewers), so every user with access sees the same list;
  // a 403 for users without access just leaves the list empty.
  useEffect(() => {
    if (!properties.uri || !token) return;
    const backendObjectUri = `${publicRuntimeConfig.backend}/${getAfterThirdSlash(properties.uri)}`;
    axios.get(`${backendObjectUri}/viewers`, {
      headers: {
        "Accept": "application/json",
        "X-authorization": token
      }
    })
      .then(response => {
        if (Array.isArray(response.data)) setViewers(response.data);
      })
      .catch(() => setViewers([]));
  }, [properties.uri, token]);


  if (!otherProps) return <Loading />;

  let objectUriParts = "";
  if (properties.uri) {
    objectUriParts = getAfterThirdSlash(properties.uri);
  }
  const objectUri = `${publicRuntimeConfig.backend}/${objectUriParts}`;
  // Real ownership from the object's sbh:ownedBy triples (already loaded above):
  // covers co-owners granted via addOwner, not just the username in the URI.
  var isOwner = otherProps.some(obj => obj.p.endsWith('#ownedBy') && obj.o === graphUri);

  const handleAddAnnotation = () => {
    if (!isValidURI(newPredicate)) {
      alert("The predicate entered is not a valid URI.");
      // Refocus and select the text in the predicate input box
      const predicateInput = document.getElementById("newPredicateInput");
      if (predicateInput) {
        predicateInput.focus();
        predicateInput.select();
      }
      return; // Stop the function if the predicate is not valid
    }

    axios.post(`${objectUri}/add/annotation`, {
      pred: newPredicate,
      object: newValue
    }, {
      headers: {
        "Accept": "text/plain; charset=UTF-8",
        "X-authorization": token
      }
    })
      .then(response => {
        setOtherProps([...otherProps, { p: newPredicate, o: newValue }]);
        setNewPredicate('');
        setNewValue('');
      });
  };

  const handleEditClick = (key, currentPredicate, currentValue) => {
    setEditingKey(key);
    setEditedValue(currentValue);
    setOriginalPredicate(currentPredicate);
    setOriginalValue(currentValue);
  };

  const handleSaveEdit = (key) => {
    axios.post(`${objectUri}/edit/annotation`, {
      pred: originalPredicate,
      object: editedValue,
      previous: originalValue
    }, {
      headers: {
        "Accept": "text/plain; charset=UTF-8",
        "X-authorization": token
      }
    })
      .then(response => {
        const updatedProps = otherProps.map((obj, index) => {
          if (index === key) {
            return { ...obj, o: editedValue };
          }
          return obj;
        });

        setOtherProps(updatedProps);
        setEditingKey(null);
      })
  };

  const confirmDeletion = (key, name, value) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this annotation?");
    if (confirmDelete) {
      handleRemoveItem(key, name, value);
      const userRemove = value.split('/').pop();
      if (name.endsWith('#ownedBy') && userRemove !== username) {
        handleRemoveOwner(value, userRemove);
      }
    }
  };

  const handleRemoveItem = (key, name, value) => {
    axios.post(`${objectUri}/remove/annotation`, {
      pred: name,
      object: value
    }, {
      headers: {
        "Accept": "text/plain; charset=UTF-8",
        "X-authorization": token
      }
    })
      .then(response => {
        // Remove the item from the state
        const updatedProps = otherProps.filter((_, index) => index !== key);
        setOtherProps(updatedProps);
      })
      .catch(error => {
        console.error("Error removing item: ", error);
      });
  };

  const confirmViewerDeletion = (viewer) => {
    const confirmDelete = window.confirm(`Are you sure you want to remove ${viewer.username}'s view access?`);
    if (confirmDelete) {
      handleRemoveViewer(viewer);
    }
  };

  // Viewers are removed through removeViewer only: the canView triple is in the viewer's
  // graph, so the generic /remove/annotation call (object graph) must not be used here.
  const handleRemoveViewer = (viewer) => {
    axios.post(`${objectUri}/removeViewer/${viewer.username}`, {
      userUri: viewer.userUri
    }, {
      headers: {
        "Accept": "text/plain; charset=UTF-8",
        "X-authorization": token
      }
    })
      .then(response => {
        if (response && response.status == 200) {
          setViewers(viewers.filter(v => v.userUri !== viewer.userUri));
        }
      })
      .catch(error => {
        console.error('Error removing viewer', error);
      });
  };

  const handleRemoveOwner = (value, userRemove) => {
    axios.post(`${objectUri}/removeOwner/${userRemove}`, {
      userUri: value
    }, {
      headers: {
        "Accept": "text/plain; charset=UTF-8",
        "X-authorization": token
      }
    })
      .then(response => {
        if (response && response.status == 200) {
          console.log("Successfully removed owner");
        }
      })
      .catch(error => {
        console.error('Error removing owner', error);
      });
  };

  return (
    <div>
      <table className={`${styles.table} ${styles.otherPropertiesTable}`}>
        <tbody>
          {generateRows()}
          {generateViewerRows()}
          <tr>
            <td>
              <span className={styles.predicateInputWrap}>
                <input
                  id="newPredicateInput"
                  type="text"
                  value={newPredicate}
                  onChange={(e) => setNewPredicate(e.target.value)}
                  placeholder="Enter predicate"
                />
                <span
                  className={styles.predicateInfo}
                  tabIndex={0}
                  role="button"
                  aria-label="Predicate format help"
                >
                  <FontAwesomeIcon
                    icon={faInfoCircle}
                    size="1x"
                    color="#465875"
                    className={styles.searchicon}
                  />
                  <span className={styles.predicateTooltip}>
                    Predicate must be a full URI starting with http:// or https://.
                    Use a vocabulary term, for example:
                    <span className={styles.predicateExample}>
                      http://wiki.synbiohub.org/wiki/Terms/synbiohub#myAnnotation
                    </span>
                  </span>
                </span>
              </span>
            </td>
            <td>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Enter value"
              />
              <button onClick={handleAddAnnotation}>Save</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  function generateRows() {
    return otherProps.map((obj, key) => {
      return getRow(key, obj.p, obj.o);
    });
  }

  function generateViewerRows() {
    // Visible to everyone with access (the fetch is authorized by the backend);
    // only owners get the remove control.
    return viewers.map((viewer) => {
      return (
        <tr key={`viewer-${viewer.userUri}`}>
          <td>
            {lookupRole(CAN_VIEW_PREDICATE).term || CAN_VIEW_PREDICATE}
            <Link href={CAN_VIEW_PREDICATE}>
              <a>
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  size="1x"
                  color="#465875"
                  className={styles.searchicon}
                />
              </a>
            </Link>
          </td>
          <td>
            <span>{viewer.username}</span>
            {isOwner && (
              <FontAwesomeIcon
                icon={faTrash}
                size="1x"
                className={styles.editIcon}
                onClick={() => confirmViewerDeletion(viewer)}
                title="Remove this viewer"
              />
            )}
          </td>
        </tr>
      );
    });
  }

  function getRow(key, name, value) {
    const isUri = value.includes('http');
    const valueSearch = isUri
      ? `/search/<${encodeURIComponent(name)}>=<${encodeURIComponent(value)}>&`
      : `/search/<${encodeURIComponent(name)}>='${encodeURIComponent(
        value.replace("'", "\\'")
      )}'&`;
    // const parsedValue = value
    //   .replace(name + '/', '')
    //   .slice(
    //     value.slice(0, value.lastIndexOf('/')).lastIndexOf('/') + 1,
    //     value.length
    //   );
    const parsedValue = parseValue(value);
    return (
      <tr key={key}>
        <td>
          {lookupRole(name).term || name}
          <Link href={name}>
            <a>
              <FontAwesomeIcon
                icon={faInfoCircle}
                size="1x"
                color="#465875"
                className={styles.searchicon}
              />
            </a>
          </Link>
        </td>
        <td>
          {editingKey === key ? (
            <>
              <input
                type="text"
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
              />
              <button onClick={() => handleSaveEdit(key)}>Save</button>
            </>
          ) : (
            <>
              <span>{parsedValue}</span>
              {isOwner && (
                <>
                  {
                    <FontAwesomeIcon
                      icon={faPencilAlt}
                      size="1x"
                      onClick={() => handleEditClick(key, name, value)}
                      className={styles.editIcon}
                      title="Edit this annotation"
                    />
                  }
                  {
                    <FontAwesomeIcon
                      icon={faTrash}
                      size="1x"
                      className={styles.editIcon}
                      onClick={() => confirmDeletion(key, name, value)}
                      title="Remove this annotation"
                    />
                  }
                </>
              )}
              {isUri && (
                <Link href={value}>
                  <a>
                    <FontAwesomeIcon
                      icon={faInfoCircle}
                      size="1x"
                      color="#465875"
                      className={styles.searchicon}
                    />
                  </a>
                </Link>
              )}
              <Link href={valueSearch}>
                <a>
                  <FontAwesomeIcon
                    icon={faSearch}
                    size="1x"
                    color="#465875"
                    className={styles.searchicon}
                  />
                </a>
              </Link>
            </>
          )}
        </td>
      </tr>
    );
  }

  function parseValue(text) {
    const parts = text.split('/');
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];

      if (/^1(\.0+)*$/.test(lastPart)) {
        text = parts[parts.length - 2];
      } else {
        const delimiters = ['#', '%', '/'];
        const lastPartSegments = lastPart.split(new RegExp(`[${delimiters.join('')}]`));

        text = lastPartSegments.pop();
      }
    }
    return text;
  }
}
