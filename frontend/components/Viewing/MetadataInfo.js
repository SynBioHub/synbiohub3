import React, { useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import RenderIcon from './PageJSON/Rendering/RenderIcon';
import styles from '../../styles/view.module.css';
import { useTheme } from '../Admin/Theme';
import axios from 'axios';
import getConfig from "next/config";

import { getAfterThirdSlash } from './ViewHeader';

const { publicRuntimeConfig } = getConfig();

export default function MetadataInfo({ title, link, label, icon, specific, uri }) {
  console.log(label);
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [newSource, setNewSource] = useState('');
  const token = useSelector(state => state.user.token);

  const hoverStyle = {
    backgroundColor: isHovered ? (theme?.hoverColor || '#00A1E4') : (theme?.themeParameters?.[0]?.value || styles.infoheader.backgroundColor)
  };

  const handleAddSource = () => {
    const objectUriParts = getAfterThirdSlash(uri);
    const objectUri = `${publicRuntimeConfig.backend}/${objectUriParts}`;
    const editedText = newSource;
    console.log(newSource);
    console.log(objectUri);

    axios.post(`${objectUri}/add/wasDerivedFrom`, {
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
        console.error('Error adding source:', error);
      });
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

  // Check if title is a string and contains commas, then split into an array
  const sources = typeof title === 'string' && title.includes(',') ? title.split(',').map(s => s.trim()) : [title];

  // Rendered content for the title with each source as a hyperlink
  const renderedTitle = (
    <div className={specific ? styles.infotitlegeneric : styles.infotitle}>
      <table>
        <tbody>
          {typeof title === 'string' && title.includes(',')
            ? title.split(',').map((source, index) => (
              <tr key={index}>
                <td>
                  <Link href={source.trim()}>
                    <a target="_blank">{source.trim()}</a>
                  </Link>
                </td>
              </tr>
            ))
            : <tr><td>{title}</td></tr>
          }
        </tbody>
      </table>
    </div>
  );


  // Rendered section including the header and the title (with or without link)
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
      {isEditingSource ? (
        <div>
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
      ) : link ? (
        <Link href={link}><a target="_blank">{renderedTitle}</a></Link>
      ) : renderedTitle}
    </div>

  );

  return renderedSection;
}
