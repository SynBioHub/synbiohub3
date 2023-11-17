import Link from 'next/link';

import styles from '../../styles/view.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import RenderIcon from './PageJSON/Rendering/RenderIcon';

import { useTheme } from '../Admin/Theme';
import React, { useState } from 'react';

/**
 * Component container for displaying metadata information about the object.
 *
 * @param {Any} properties Information from the parent component.
 */
export default function MetadataInfo({ title, link, label, icon, specific }) {
  //If the metadata doesn't contain the title nothing should be rendered.
  if (!title || (Array.isArray(title) && title.length === 0)) {
    return null;
  }
  const { theme, loading } = useTheme();

  const [isHovered, setIsHovered] = useState(false);

  const hoverStyle = {
    backgroundColor: isHovered ? (theme?.hoverColor || '#00A1E4') : (theme?.themeParameters?.[0]?.value || styles.infoheader.backgroundColor)
  };



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
            <FontAwesomeIcon
              icon={icon}
              size="1x"
              className={styles.infoicon}
            />
          ) : (
            <RenderIcon icon={icon} color="#fff" style={styles.infoicon} />
          )}
        </div>
        <div className={styles.infolabel}>{label}</div>
      </div>
      <div className={specific ? styles.infotitlegeneric : styles.infotitle}>
        <table>
          <tbody>
            {/* Check if 'title' contains table rows and render them directly here */}
            {Array.isArray(title) ? title : <tr><td>{title}</td></tr>}
          </tbody>
        </table>
      </div>


    </div>
  );
  if (link) {
    return (
      <Link href={link}>
        <a target="_blank">{renderedSection}</a>
      </Link>
    );
  } else return renderedSection;
}
