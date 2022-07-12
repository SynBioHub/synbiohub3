import {
  faAlignLeft,
  faAlignRight,
  faCloudDownloadAlt,
  faDatabase,
  faFile,
  faImage,
  faInfoCircle,
  faStickyNote,
  faMinus,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/view.module.css';

import { createPortal } from 'react-dom';
import { useRef, useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useDispatch, useSelector } from 'react-redux';
import { updatePageSectionsOrder, updateMinimizedSections, updateSelectedSections } from '../../redux/actions';

/**
 * Handles making the page section elements draggable and updating the store variables
 * when the order is updated.
 * 
 * @param {Any} properties Information passed down from the parent component.
 * @returns Draggable page sections.
 */
export default function SectionSelector(properties) {
  const [pagesOrder, setPagesOrder] = useState([]);
  const [isMinimized, setIsMinimized] = useState(true);
  const dispatch = useDispatch();
  const pageSectionsOrder = useSelector(state => state.pageSections.order);
  const minimizedSections = useSelector(state => state.pageSections.minimized);
  const selectedOrder = useSelector(state => state.pageSections.selected);

  const selectors = headerCreate(pageSectionsOrder, properties.pagesInfo.type);

  //Initializes the store page sections and minimized order.
  useEffect(() => {
    let savedMinimizedValues, savedSelectedSections;

    if (localStorage.getItem(properties.pagesInfo.type) === null) {
      savedMinimizedValues = new Array(properties.pagesInfo.order.length).fill(false);
      savedSelectedSections = properties.pagesInfo.order;
    } else {
      const savedValues = JSON.parse(localStorage.getItem(properties.pagesInfo.type));
      savedMinimizedValues = savedValues.minimized;
      savedSelectedSections = savedValues.selected;
    }

    dispatch(updatePageSectionsOrder(properties.pagesInfo.order, properties.pagesInfo.type));
    dispatch(updateMinimizedSections(savedMinimizedValues, properties.pagesInfo.type));
    dispatch(updateSelectedSections(savedSelectedSections, properties.pagesInfo.type));

    setPagesOrder(properties.pagesInfo.order);
  }, []);

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

    dispatch(updatePageSectionsOrder(updatedPageOrder, properties.pagesInfo.type));
    dispatch(updateSelectedSections(updatedPageOrder.filter(page => selectedOrder.includes(page)), properties.pagesInfo.type));

    const updatedMinimizedOrder = reorder(
      minimizedSections,
      result.source.index,
      result.destination.index
    );

    dispatch(updateMinimizedSections(updatedMinimizedOrder, properties.pagesInfo.type));

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
              <div className={styles.pagesectionstitle}>
                <h2>Page Sections</h2>
                <FontAwesomeIcon
                  icon={isMinimized ? faMinus : faPlus}
                  size="1x"
                  className={styles.pagesectionsminus}
                  onClick={() => {
                    /*
                    Visual bug when collapsing the section headers the top box shadow of the top section header
                    will not be hidden. Handles removing that shadow and adding it back correspondingly.
                    */
                    const topSectionHeader = document.getElementsByClassName(styles.sectionheader)[0];
                    const container = document.getElementById("headers-container");

                    /**
                     * Removes the css class that adds no box-shadow so the default box-shadow will apply.
                     */
                    const addBoxShadow = () => {
                      topSectionHeader.classList.remove(styles.nosectionheadershadow);
                      container.removeEventListener("transitionstart", addBoxShadow);
                    }

                    /**
                     * Removes the box shadow from top section header.
                     */
                    const removeBoxShadow = () => {
                      topSectionHeader.classList.add(styles.nosectionheadershadow);
                      container.removeEventListener("transitionend", removeBoxShadow);
                    }

                    container.classList.toggle(styles.collapsed);
                    if (container.classList.toggle(styles.expanded)) {
                      container.addEventListener("transitionstart", addBoxShadow, false);
                    } else {
                      container.addEventListener("transitionend", removeBoxShadow, false);
                    }

                    setIsMinimized(!isMinimized);
                  }}
                />
              </div>
              <div id="headers-container" className={styles.expanded}>
                {selectors}
                {dropProvided.placeholder}
              </div>
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
function headerCreate(pages, type) {
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
          <div className={styles.sectionheaderparent}
            {...dragProvided.dragHandleProps}
            {...dragProvided.draggableProps}
            ref={dragProvided.innerRef}
          >
            <SectionHeader type={type} title={page} icon={iconSelector(page)} />
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
  const selectedSections = useSelector(state => state.pageSections.selected);
  const type = useSelector(state => state.pageSections.type);
  const sectionOrder = useSelector(state => state.pageSections.order);
  const dispatch = useDispatch();

  //Don't want to use the sections from the previous page.
  let sectionRendered = type === properties.type ? selectedSections.includes(properties.title) : null;

  return (
    <a className={styles.sectionheader} href={`#${properties.title}`}>
      <div className={styles.titleandbox}>
        <input
          type="checkbox"
          defaultChecked={sectionRendered}
          onClick={(e) => {
            const isChecked = e.target.checked;

            if (isChecked && !sectionRendered) {
              const sectionOrderIndex = sectionOrder.indexOf(properties.title);

              const updatedSelected = [];
              updatedSelected[sectionOrderIndex] = properties.title;
              selectedSections.forEach(section => {
                const index = sectionOrder.indexOf(section);
                updatedSelected[index] = section;
              });

              dispatch(updateSelectedSections(updatedSelected, type));
            } else if (!isChecked && sectionRendered) {
              dispatch(updateSelectedSections(selectedSections.filter(title => title !== properties.title), type));
            }
          }}
        />
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
