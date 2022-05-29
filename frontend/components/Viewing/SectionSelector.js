import {
  faAlignLeft,
  faAlignRight,
  faCloudDownloadAlt,
  faDatabase,
  faFile,
  faImage,
  faInfoCircle,
  faStickyNote
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/view.module.css';

import { createPortal } from 'react-dom';
import { useRef, useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useDispatch, useSelector } from 'react-redux';
import { updatePageSectionsOrder, updateMinimizedSections } from '../../redux/actions';

/**
 * Handles making the page section elements draggable and updating the store variables
 * when the order is updated.
 * 
 * @param {Any} properties Information passed down from the parent component.
 * @returns Draggable page sections.
 */
export default function SectionSelector(properties) {
  const [pagesOrder, setPagesOrder] = useState([]);
  const dispatch = useDispatch();
  const pageSectionsOrder = useSelector(state => state.pageSections.sectionOrder);
  const minimizedSections = useSelector(state => state.pageSections.minimizedSections)

  const selectors = headerCreate(pageSectionsOrder);

  //Initializes the store page sections and minimized order.
  useEffect(() => {
    dispatch(updatePageSectionsOrder(properties.pages));
    dispatch(updateMinimizedSections(new Array(properties.pages.length).fill(false)));
    setPagesOrder(properties.pages);
  },
    [pagesOrder === []]);

  /**
   * Handles updating the order of the pages/minimized order and updating the store.
   * 
   * @param {Object} result The result from the drag.
   */
  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const updatedPageOrder = reorder(
      pagesOrder,
      result.source.index,
      result.destination.index
    );

    const updatedMinimizedOrder = reorder(
      minimizedSections,
      result.source.index,
      result.destination.index
    );

    dispatch(updatePageSectionsOrder(updatedPageOrder));
    dispatch(updateMinimizedSections(updatedMinimizedOrder));

    setPagesOrder(updatedPageOrder);
  }

  /**
   * Swaps two indexes in the specified list.
   * 
   * @param {Array} list The list to reorder.
   * @param {Number} startIndex The index to start at.
   * @param {Number} endIndex The index to end at.
   * @returns The updated array.
   */
  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="pageSections">
        {(dropProvided) => (
          <div {...dropProvided.droppableProps}>
            <div ref={dropProvided.innerRef} className={styles.pagesections}>
              <h2 className={styles.pagesectionstitle}>Page Sections</h2>
              {selectors}
              {dropProvided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

/**
 * Handles the mapping of the different page section icons in the sidebar.
 * 
 * @param {Array} pages An array containing the current page section order.
 * @returns The mapped pages.
 */
function headerCreate(pages) {
  const useDraggableInPortal = () => {
    const self = useRef({}).current;

    useEffect(() => {
      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.pointerEvents = "none";
      div.style.top = "0";
      div.style.width = "100%";
      div.style.height = "100%";
      self.elt = div;
      document.body.appendChild(div);
      return () => {
        document.body.removeChild(div);
      };
    }, [self]);

    return (render) => (provided, ...args) => {
      const element = render(provided, ...args);
      if (provided.draggableProps.style.position === "fixed") {
        return createPortal(element, self.elt);
      }
      return element;
    };
  };

  const renderDraggable = useDraggableInPortal();

  const headers = pages.map((page, index) => {
    return (
      <Draggable key={page} draggableId={page} index={index}>
        {renderDraggable(dragProvided => (
          <div className={styles.sectionHeaderParent}
            {...dragProvided.dragHandleProps}
            {...dragProvided.draggableProps}
            ref={dragProvided.innerRef}
          >
            <SectionHeader title={page} icon={iconSelector(page)} />
          </div>
        ))}
      </Draggable>
    );
  });

  return headers;
}

/**
 * @param {String} page The name of the page.
 * @returns The correct icon that corresponds to the page.
 */
function iconSelector(page) {
  switch (page) {
    case "Details":
      return faAlignLeft
    case "Other Properties":
      return faAlignRight
    case "Attachments":
      return faFile
    case "Download Options":
      return faCloudDownloadAlt
    case "Sequence Annotations":
      return faStickyNote
    case "Members":
      return faDatabase
    case "VisBOL":
      return faImage
    default:
      return faInfoCircle
  }
}

/**
 * @param {Any} properties Information passed down from the parent component.
 * @returns A section header with the correct icon.
 */
function SectionHeader(properties) {
  return (
    <a className={styles.sectionheader} href={`#${properties.title}`}>
      <div className={styles.titleandbox}>
        <input type="checkbox" />
        <div className={styles.sectionheadertitle}>{properties.title}</div>
      </div>
      <FontAwesomeIcon
        icon={properties.icon}
        size="1x"
        className={styles.sectionheadericon}
      />
    </a>
  );
}
