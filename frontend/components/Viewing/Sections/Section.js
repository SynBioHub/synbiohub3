import { faMinusSquare, faPlusSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../../styles/view.module.css';

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateMinimizedSections } from '../../../redux/actions.js';

/*
TODO
Make sure that the sections don't flicker when checkbox is clicked to unrender/render
Bug where the state of isMinimized is set to true initially so when the user clicks to minimize it is just
set to true again because minimizedSections[sectionIndex] is false.
Replicate by deleting everything in local storage and then browsing to collections/components and some
sections will be minimizable and some won't be.
*/

/**
 * Handles if the section is minimized or expanded.
 *
 * @param {Any} properties Information passed down from the parent component.
 * @returns A minimized/expanded section.
 */
export default function Section(properties) {
  const dispatch = useDispatch();

  const id = properties.id || properties.title;

  //The index that the section is at in the section order.
  const sectionIndex = useSelector(state => state.pageSections.order).indexOf(
    id
  );
  //The content type the section is a part of.
  const contentType = useSelector(state => state.pageSections.type);

  const minimizedSections = useSelector(state => state.pageSections.minimized);
  const minimizedSectionsCopy = [...minimizedSections];

  const [isMinimized, setIsMinimized] = useState(
    minimizedSections[sectionIndex]
  );

  //The content type will not be correct on the first render after changing to a page of a different content type.
  const firstUpdate = useRef(true);

  useEffect(() => {
    //Makes it so the code below won't run on the first render.
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }

    if (isMinimized) minimizedSectionsCopy[sectionIndex] = true;
    else minimizedSectionsCopy[sectionIndex] = false;

    dispatch(updateMinimizedSections(minimizedSectionsCopy, contentType));
  }, [isMinimized]);

  return (
    <div className={styles.section}>
      <div className={styles.sectiontitle}>{properties.title}</div>
      <FontAwesomeIcon
        icon={minimizedSections[sectionIndex] ? faPlusSquare : faMinusSquare}
        size="1x"
        className={styles.sectionminimizeicon}
        onClick={() => {
          //for some reason it is already thinking it's collapsed so calling !minimized doesn't change anything.
          setIsMinimized(!minimizedSections[sectionIndex]);
        }}
      />
      <div
        className={
          minimizedSections[sectionIndex]
            ? styles.sectionclosed
            : styles.sectionopen
        }
      >
        <div className={styles.sectionchildcontainer}>
          {properties.children}
        </div>
      </div>
    </div>
  );
}
