import React, { useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import RenderIcon from './PageJSON/Rendering/RenderIcon';
import styles from '../../styles/view.module.css';
import axios from 'axios';
import getConfig from "next/config";

import { getAfterThirdSlash } from './ViewHeader';
import { isUriOwner, formatMultipleTitles } from './Shell';

import feConfig from "../../config.json";

export default function MetadataInfo({ title, link, label, icon, specific, uri }) {
  const theme = JSON.parse(localStorage.getItem('theme')) || {};
  const [isHovered, setIsHovered] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [newMetadata, setNewMetadata] = useState('');

  const token = useSelector(state => state.user.token);
  const username = useSelector(state => state.user.username);
  if (Array.isArray(title) && label === 'Type' || label === 'Role') {
    const concatenatedTitle = title.map(item => {
      // Accessing the extra_work property for each object in the title array
      if (item.props && item.props.children && item.props.children.props.children.props.sections && 
        item.props.children.props.children.props.sections.extra_work &&
        item.props.children.props.children.props.sections.extra_work.length > 0) {
        return item.props.children.props.children.props.sections.extra_work[0].result.extra_work;
      }
      return ''; // Return an empty string if the path doesn't exist
    }).filter(item => item !== '').join(", "); // Filter out empty strings and join
    [title, link] = formatMultipleTitles(concatenatedTitle);
  }

  if (Array.isArray(title) && label === 'Sequence') {
    const concatenatedTitle = title.map(item => {
      // Accessing the extra_work property for each object in the title array
      if (item.props && item.props.sections && item.props.sections.sequence &&
        item.props.sections.sequence.length > 0) {
        link = item.props.sections.sequence[0].result.sequencelink;
        return item.props.sections.sequence[0].result.sequence;
      }
      return ''; // Return an empty string if the path doesn't exist
    }).filter(item => item !== '').join(", "); // Filter out empty strings and join
    title = concatenatedTitle;
  }

  let objectUriParts = "";
  if (uri) {
    objectUriParts = getAfterThirdSlash(uri);
  }
  const objectUri = `${feConfig.backend}/${objectUriParts}`;

  const [editSourceIndex, setEditSourceIndex] = useState(null);
  const [editedSource, setEditedSource] = useState('');
  const [editTypeIndex, setEditTypeIndex] = useState(null);
  const [editedType, setEditedType] = useState('');
  const [editRoleIndex, setEditRoleIndex] = useState(null);
  const [editedRole, setEditedRole] = useState('');

  const [sources, setSources] = useState(processTitle(title));
  const [types, setTypes] = useState(processTitle(title));
  const [roles, setRoles] = useState(processTitle(title));

  let metadata, setMetadata;
  switch (label) {
    case 'Source':
      metadata = sources;
      setMetadata = setSources;
      break;
    case 'Type':
      metadata = types;
      setMetadata = setTypes;
      break;
    case 'Role':
      metadata = roles;
      setMetadata = setRoles;
      break;
    default:
      // If the label is not one of the recognized types, set metadata to be an array containing title
      metadata = [title];
      setMetadata = () => { }; // setMetadata does nothing in this case
      break;
  }



  var isOwner = isUriOwner(objectUri, username);


  const handleEditMetadata = (index, value, metadataLabel) => {
    switch (metadataLabel) {
      case 'Source':
        setEditSourceIndex(index);
        setEditedSource(value);
        break;
      case 'Type':
        setEditTypeIndex(index);
        setEditedType(value);
        break;
      case 'Role':
        setEditRoleIndex(index);
        setEditedRole(value);
        break;
      default:
        break;
    }
  };

  const handleCancelEdit = (label) => {
    switch (label) {
      case 'Source':
        setEditSourceIndex(null);
        setEditedSource('');
        break;
      case 'Type':
        setEditTypeIndex(null);
        setEditedType('');
        break;
      case 'Role':
        setEditRoleIndex(null);
        setEditedRole('');
        break;
      default:
        return; // Exit if metadata type is not recognized
    }
  };


  const handleSaveEditMetadata = (index, originalValue, label) => {
    let editedValue;
    switch (label) {
      case 'Source':
        editedValue = editedSource;
        break;
      case 'Type':
        editedValue = editedType;
        break;
      case 'Role':
        editedValue = editedRole;
        break;
      default:
        return; // Exit if metadata type is not recognized
    }
    let urlEnd;
    if (label === 'Source') {
      urlEnd = 'wasDerivedFrom';
    } else {
      urlEnd = label.toLowerCase();
    }

    if (editedValue.trim() === '') {
      alert('Content cannot be empty.');
      return;
    }
    // Make an Axios POST request to save the edited source content
    axios
      .post(
        `${objectUri}/edit/${urlEnd}`,
        {
          previous: originalValue, // You may need to pass the source index for identification
          object: editedValue, // The edited source content
        },
        {
          headers: {
            'Accept': 'text/plain; charset=UTF-8',
            'X-authorization': token,
          },
        }
      )
      .then((response) => {
        // Handle the successful response here, if needed
        // You may want to update the source in your data or state
        const updatedMetadata = [...metadata];
        updatedMetadata[index] = editedValue;
        setMetadata(updatedMetadata);
        setEditSourceIndex(null);
      })
      .catch((error) => {
        console.error('Error saving edited source:', error);
        // Handle the error, display an error message, etc.
      });
  };

  const hoverStyle = {
    backgroundColor: isHovered ? (theme?.hoverColor || '#00A1E4') : (theme?.themeParameters?.[0]?.value || styles.infoheader.backgroundColor)
  };

  const handleAddMetadata = (label) => {
    const editedText = newMetadata;

    let urlEnd;
    if (label === 'Source') {
      urlEnd = 'wasDerivedFrom';
    } else {
      urlEnd = label.toLowerCase();
    }

    axios.post(`${objectUri}/add/${urlEnd}`, {
      object: editedText
    }, {
      headers: {
        "Accept": "text/plain; charset=UTF-8",
        "X-authorization": token
      }
    })
      .then(response => {
        setMetadata([...metadata, response.data]);
        setIsEditing(false);
        setNewMetadata('');
      })
      .catch(error => {
        console.error('Error adding metadata', error);
        // Additional error handling logic can be added here
      });
  };



  const handleDeleteMetadata = (event, itemToDelete, label) => {
    event.stopPropagation(); // Prevent event from propagating to parent elements

    if (window.confirm("Do you want to delete this metadata?")) {
      let currentMetadata, setCurrentMetadata;
      switch (label) {
        case 'Source':
          currentMetadata = sources;
          setCurrentMetadata = setSources;
          break;
        case 'Type':
          currentMetadata = types;
          setCurrentMetadata = setTypes;
          break;
        case 'Role':
          currentMetadata = roles;
          setCurrentMetadata = setRoles;
          break;
        default:
          return; // Exit if label is not recognized
      }

      // Find the index of the item to delete
      const indexToDelete = currentMetadata.findIndex(item => item === itemToDelete);

      let urlEnd = label === 'Source' ? 'wasDerivedFrom' : label.toLowerCase();
      axios.post(`${objectUri}/remove/${urlEnd}`, { object: itemToDelete }, {
        headers: {
          "Accept": "text/plain; charset=UTF-8",
          "X-authorization": token
        }
      })
        .then(response => {
          // Update the state after successful deletion
          const updatedMetadata = currentMetadata.filter((_, index) => index !== indexToDelete);
          setCurrentMetadata(updatedMetadata);
        })
        .catch(error => {
          console.error('Error deleting metadata:', error);
        });
    }
  };



  // Rendered label with plus icon
  const renderedLabel = (
    <div className={styles.infolabel}>
      {label}
      {(label === "Source" || label === "Type" || label === "Role") && (
        <>
          <span style={{ marginRight: '0.5rem' }}></span> {/* Add space */}
          {
            isOwner && (
              <>
                <FontAwesomeIcon
                  icon={faPlus}
                  onClick={() => setIsEditing(true)}
                  className={styles.plusIcon}
                  title="Add a new source"
                />
              </>
            )
          }
        </>
      )}
    </div>
  );

  // // Check if title is a string and contains commas, then split into an array
  // const sources = typeof title === 'string' && title.includes(',') ? title.split(',').map(s => s.trim()) : [title];

  const urlRegex = /https?:\/\/[^ ,]+/g; // URL regex

  function processTitle(title) {
    if (typeof title !== 'string') return [title];

    // Placeholder for commas inside URLs
    const commaPlaceholder = '__COMMA__';

    // Replace commas inside URLs with the placeholder
    const titleWithPlaceholders = title.replace(urlRegex, url => url.replace(/,/g, commaPlaceholder));

    // Split the title on commas
    const parts = titleWithPlaceholders.split(',').map(part => part.trim());

    // Restore commas in URLs
    return parts.map(part => part.replace(new RegExp(commaPlaceholder, 'g'), ','));
  }
  const renderedTitle = (
    <div className={styles.infotitle}>
      <div>
        <div>
          {metadata.map((data, index) => {
            let isEditingThisItem = false;
            let currentValue = "";
            let correspondingLink = (label === 'Source' || label === 'Type' || label === 'Role')
              ? (link && link.length > 0 && typeof link === 'object' ? link[index] : (link ? link : null))
              : link;
            let processedSource = data;
            if (typeof (data) === 'string' && data.match(urlRegex)) {
              processedSource = getAfterThirdSlash(data);
            }
            switch (label) {
              case 'Source':
                isEditingThisItem = editSourceIndex === index;
                currentValue = editedSource;
                break;
              case 'Type':
                isEditingThisItem = editTypeIndex === index;
                currentValue = editedType;
                break;
              case 'Role':
                isEditingThisItem = editRoleIndex === index;
                currentValue = editedRole;
                break;
              default:
                break;
            }
            return (
              <div key={index}>
                <div>
                  {isEditingThisItem ? (
                    <div>
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e) => handleEditMetadata(index, e.target.value, label)}
                      />
                      <button className={styles.button} onClick={() => handleSaveEditMetadata(index, data, label)}
                        style={{
                          backgroundColor: theme?.themeParameters?.[0]?.value || '#333', // Use theme color or default to #333
                          color: theme?.themeParameters?.[1]?.value || '#fff', // Use text color from theme or default to #fff
                        }}
                      >
                        Save
                      </button>
                      <button className={styles.button} onClick={() => handleCancelEdit(label)}
                        style={{
                          backgroundColor: theme?.themeParameters?.[0]?.value || '#333', // Use theme color or default to #333
                          color: theme?.themeParameters?.[1]?.value || '#fff', // Use text color from theme or default to #fff
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <a
                      href={correspondingLink ? correspondingLink : `/${processedSource}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {processedSource}
                    </a>
                  )}
                </div><div>
                  {(label === "Source" || label === "Type" || label === "Role") && data && (
                    isEditingThisItem ? null : (
                      <div>
                        {isOwner && (
                          <>
                            <button onClick={() => handleEditMetadata(index, data, label)}>
                              <FontAwesomeIcon icon={faPencilAlt} title="Edit metadata" style={{ cursor: 'pointer' }} />
                            </button>
                            <button onClick={(e) => handleDeleteMetadata(e, data, label)}>
                              <FontAwesomeIcon icon={faTrash} title="Delete metadata" style={{ cursor: 'pointer' }} />
                            </button>
                          </>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );








  // Rendered section including the header and the title (without link)
  const renderedSection = (
    <div className={styles.info}>
      <div
        className={specific ? styles.infogeneric : styles.infoheader}
        style={hoverStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={styles.infoiconcontainer}>
          {!specific ? (
            <FontAwesomeIcon icon={icon} size="1x" className={styles.infoicon} />
          ) : (
            <RenderIcon icon={icon} color="#fff" style={styles.infoicon} />
          )}
        </div>
        {renderedLabel}
      </div>
      {renderedTitle}
      {isEditing ? (
        <div className={styles.addMetadata}>
          <input
            type="text"
            value={newMetadata}
            onChange={(e) => setNewMetadata(e.target.value)}
          />
          <button className={styles.button} type="button" onClick={() => handleAddMetadata(label)}
            style={{
              backgroundColor: theme?.themeParameters?.[0]?.value || '#333', // Use theme color or default to #333
              color: theme?.themeParameters?.[1]?.value || '#fff', // Use text color from theme or default to #fff
            }}
          >Save</button>
          <button className={styles.button} type="button" onClick={() => {
            setIsEditing(false);
            setNewMetadata(''); // Optional: Clear the input if needed
          }}
            style={{
              backgroundColor: theme?.themeParameters?.[0]?.value || '#333', // Use theme color or default to #333
              color: theme?.themeParameters?.[1]?.value || '#fff', // Use text color from theme or default to #fff
            }}
          >Cancel</button>
        </div>
      ) : null}
    </div>
  );
  return renderedSection;
}