import React, { useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import RenderIcon from './PageJSON/Rendering/RenderIcon';
import styles from '../../styles/view.module.css';
import { useTheme } from '../Admin/Theme';
import axios from 'axios';
import getConfig from "next/config";

import { getAfterThirdSlash } from './ViewHeader';

const { publicRuntimeConfig } = getConfig();

export default function MetadataInfo({ title, link, label, icon, specific, uri }) {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [newSource, setNewSource] = useState('');
  const token = useSelector(state => state.user.token);

  const [editSourceIndex, setEditSourceIndex] = useState(null);
  const [editedSource, setEditedSource] = useState('');
  const [sources, setSources] = useState(processTitle(title)); // Assuming processTitle is your existing function


  const handleEditSource = (index, source) => {
    setEditSourceIndex(index);
    setEditedSource(source);
  };

  const handleCancelEdit = () => {
    setEditSourceIndex(null); // Reset edit mode
    setEditedSource(''); // Clear the edited content
  };


  const handleSaveEdit = (index, source) => {
    // Make an Axios POST request to save the edited source content
    if (editedSource.trim() === '') {
      // Handle the case where the edited source content is empty (optional)
      alert('Source content cannot be empty.');
      return; // Do not proceed with saving an empty source
    }

    const objectUriParts = getAfterThirdSlash(uri);
    const objectUri = `${publicRuntimeConfig.backend}/${objectUriParts}`;

    axios
      .post(
        `${objectUri}/edit/wasDerivedFrom`,
        {
          previous: source, // You may need to pass the source index for identification
          object: editedSource, // The edited source content
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
        const updatedSources = [...sources];
        updatedSources[index] = editedSource;
        setSources(updatedSources);
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

  const handleAddSource = () => {
    const objectUriParts = getAfterThirdSlash(uri);
    const objectUri = `${publicRuntimeConfig.backend}/${objectUriParts}`;
    const editedText = newSource;

    axios.post(`${objectUri}/add/wasDerivedFrom`, {
      object: editedText
    }, {
      headers: {
        "Accept": "text/plain; charset=UTF-8",
        "X-authorization": token
      }
    })
      .then(response => {
        // Assuming response.data contains the updated list of sources
        // Update your sources state with the new list
        setSources([...sources, processTitle(response.data)]);
        setIsEditingSource(false);
        setNewSource('');
      })
      .catch(error => {
        console.error('Error adding source:', error);
      });
  };


  const handleDeleteSource = (event, sourceToDelete) => {
    event.stopPropagation(); // Prevent event from propagating to parent elements

    if (window.confirm("Do you want to delete this source?")) {
      const objectUriParts = getAfterThirdSlash(uri);
      const objectUri = `${publicRuntimeConfig.backend}/${objectUriParts}`;

      // Find the index of the source to delete
      const indexToDelete = sources.findIndex(source => source === sourceToDelete);

      axios.post(`${objectUri}/remove/wasDerivedFrom`, { object: sourceToDelete }, {
        headers: {
          "Accept": "text/plain; charset=UTF-8",
          "X-authorization": token
        }
      })
        .then(response => {
          const updatedSources = sources.filter((_, index) => index !== indexToDelete);
          setSources(updatedSources);
        })
        .catch(error => {
          console.error('Error deleting source:', error);
        });
    }
  };




  // Rendered label with plus icon
  const renderedLabel = (
    <div className={styles.infolabel}>
      {label}
      {(label === "Source") && (
        <>
          <span style={{ marginRight: '0.5rem' }}></span> {/* Add space */}
          <FontAwesomeIcon
            icon={faPlus}
            onClick={() => setIsEditingSource(true)}
            className={styles.plusIcon}
          />
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
      <table>
        <tbody>
          {sources.map((source, index) => {
            let processedSource = source;
            if (source.match(urlRegex)) {
              processedSource = getAfterThirdSlash(source);
            }
            return (
              <tr key={index}>
                <td>
                  {label === "Source" && source && editSourceIndex === index ? (
                    // Edit mode
                    <div>
                      <input
                        type="text"
                        value={editedSource}
                        onChange={(e) => setEditedSource(e.target.value)}
                      />
                      <button type="button" onClick={() => handleSaveEdit(index, source)}>Save</button>
                      <button type="button" onClick={handleCancelEdit}>Cancel</button>
                    </div>
                  ) : (
                    // Display mode
                    <a
                      href={source.match(urlRegex) ? source : `http://localhost:3333/${processedSource}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {processedSource}
                    </a>
                  )}
                </td>
                {label === "Source" && source && (
                <td>
                  {editSourceIndex === index ? null : (
                    <div>
                      <button onClick={() => handleEditSource(index, source)}>
                        <FontAwesomeIcon icon={faPencilAlt} />
                      </button>
                      <button onClick={(e) => handleDeleteSource(e, source)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  )}
                </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
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
      {isEditingSource ? (
        <div className={styles.addSource}>
          <input
            type="text"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
          />
          <button type="button" onClick={handleAddSource}>Save</button>
          <button type="button" onClick={() => {
            setIsEditingSource(false);
            setNewSource(''); // Optional: Clear the input if needed
          }}>Cancel</button>
        </div>
      ) : null}
    </div>
  );

  return renderedSection;
}