import { faMinusSquare, faPlusSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../../styles/view.module.css';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateMinimizedSections } from '../../../redux/actions.js';

/**
 * Handles if the section is minimized or expanded.
 * 
 * @param {Any} properties Information passed down from the parent component.
 * @returns A minimized/expanded section.
 */
export default function Section(properties) {
  const dispatch = useDispatch();
  //The index that the section is at in the section order.
  const sectionIndex = useSelector(state => state.pageSections.sectionOrder).indexOf(properties.title);
  const minimizedSections = useSelector(state => state.pageSections.minimizedSections);
  const minimizedSectionsCopy = Array.from(minimizedSections);

  const [isMinimized, setIsMinimized] = useState(minimizedSections[sectionIndex]);

  useEffect(() => {
    if(isMinimized) minimizedSectionsCopy[sectionIndex] = true;
    else minimizedSectionsCopy[sectionIndex] = false;

    dispatch(updateMinimizedSections(minimizedSectionsCopy));
  }, [isMinimized]);

  return (
    <div className={styles.section} id={properties.title}>
      <div className={styles.sectiontitle}>{properties.title}</div>
      <div className={styles.minimize}>
        <FontAwesomeIcon
          icon={minimizedSections[sectionIndex] ? faPlusSquare : faMinusSquare}
          size="1x"
          className={styles.sectionminimizeicon}
          onClick={() => {
            setIsMinimized(!isMinimized);
          }}
        />
      </div>
      {!isMinimized && <div className={styles.sectionchildcontainer}>{properties.children}</div>}
    </div>
  );
}
