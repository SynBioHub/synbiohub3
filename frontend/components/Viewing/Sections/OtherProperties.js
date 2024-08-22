import React, { useEffect, useState } from 'react';
import { faSearch, faInfoCircle, faTrash, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import getOtherProperties from '../../../sparql/getOtherProperties';
import getQueryResponse from '../../../sparql/tools/getQueryResponse';
import { getAfterThirdSlash } from '../ViewHeader';
import { isUriOwner, isValidURI } from '../Shell';
import Loading from '../../Reusable/Loading';
import Link from 'next/link';
import getConfig from "next/config";

import styles from '../../../styles/view.module.css';
import { useDispatch, useSelector } from 'react-redux';

import axios from 'axios';
import next from 'next';

const { publicRuntimeConfig } = getConfig();


export default function OtherProperties(properties) {
  const [otherProps, setOtherProps] = useState();
  const [newPredicate, setNewPredicate] = useState('');
  const [newValue, setNewValue] = useState('');

  const [editingKey, setEditingKey] = useState(null);
  const [editedValue, setEditedValue] = useState('');

  const [originalPredicate, setOriginalPredicate] = useState('');
  const [originalValue, setOriginalValue] = useState('');

  const token = useSelector(state => state.user.token);
  const username = useSelector(state => state.user.username);

  const dispatch = useDispatch();

  useEffect(() => {
    if (otherProps == undefined)
      getQueryResponse(dispatch, getOtherProperties, {
        uri: properties.uri
      }, token).then(props => {
        if (props.length > 0) setOtherProps(props);
      });
  }, [otherProps]);

  if (!otherProps) return <Loading />;

  let objectUriParts = "";
  if (properties.uri) {
    objectUriParts = getAfterThirdSlash(properties.uri);
  }
  const objectUri = `${publicRuntimeConfig.backend}/${objectUriParts}`;
  var isOwner = isUriOwner(objectUri, username);

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

  return (
    <div>
      <table className={styles.table}>
        <tbody>
          {generateRows()}
          <tr>
            <td>
              <input
                id="newPredicateInput"
                type="text"
                value={newPredicate}
                onChange={(e) => setNewPredicate(e.target.value)}
                placeholder="Enter predicate"
              />
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
          {name.split('/').pop()}
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
