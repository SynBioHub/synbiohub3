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
import { updatePageSectionsOrder } from '../../redux/actions';

export default function SectionSelector(properties) {
  const [pagesOrder, setPagesOrder] = useState([]);
  const dispatch = useDispatch();
  const pageSectionsOrder = useSelector(state => state.pageSections.order);

  const selectors = headerCreate(pageSectionsOrder);

  useEffect(() => {
    dispatch(updatePageSectionsOrder(properties.pages));
    setPagesOrder(properties.pages);
  },
    [pagesOrder === []]);

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const updatedPageOrder = reorder(
      pagesOrder,
      result.source.index,
      result.destination.index
    );

    dispatch(updatePageSectionsOrder(updatedPageOrder));

    setPagesOrder(updatedPageOrder);
  }

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
