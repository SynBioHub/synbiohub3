import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import Select from 'react-select';

import styles from '../../../styles/defaulttable.module.css';
import { numberDisplayOptions } from './TableConfig';

export default function TableNav(properties) {
  const [currentPage, setCurrentPage] = useState(1);
  let dataLength = properties.customCount ? properties.customCount : properties.filteredData.length;
  const [numberPages, setNumberPages] = useState(
    Math.ceil(dataLength / properties.numberEntries)
  );
  const [pageSelectors, setPageSelectors] = useState(null);

  useEffect(() => {
    setPageSelectors(
      createPageSelectors(
        numberPages,
        properties.setOffset,
        properties.numberEntries,
        currentPage,
        properties.customBounds
      )
    );
  }, [numberPages, currentPage, properties.customBounds]);


  useEffect(() => {
    if (numberPages && currentPage > numberPages) {
      setCurrentPage(numberPages);
      properties.setOffset((numberPages - 1) * properties.numberEntries);
    }
  }, [numberPages, properties.numberEntries]);

  useEffect(() => {
    if (!properties.customCount)
      setNumberPages(
        Math.ceil(properties.filteredData.length / properties.numberEntries)
      );
    else
      setNumberPages(
        Math.ceil(properties.customCount / properties.numberEntries)
      );
  }, [properties.filteredData, properties.numberEntries, properties.customCount]);

  useEffect(() => {
    if (properties.offset === 0) setCurrentPage(1);
    else {
      setCurrentPage(
        Math.ceil(properties.offset / properties.numberEntries) + 1
      );
    }
  }, [properties.offset, properties.filteredData, numberPages]);

  return (
    <div className={styles.tablefooter}>
      <div className={styles.sortbycontainer}>
        <span className={styles.tableheadernavlabel}>SHOW</span>
        <Select
          options={numberDisplayOptions}
          defaultValue={numberDisplayOptions[0]}
          className={styles.tableheadernavflex}
          menuPortalTarget={document.body}
          styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
          onChange={option => properties.setNumberEntries(option.value)}
        />
        <span className={styles.tableheadernavlabel}>
          {properties.numberShownLabel
            ? properties.numberShownLabel.toUpperCase()
            : properties.title.toUpperCase()}
        </span>
      </div>

      <div className={styles.tablefooternav}>
        <div
          className={styles.tablefooternavicon}
          onClick={() =>
            properties.setOffset(
              Math.max(0, properties.offset - properties.numberEntries)
            )
          }
          role="button"
        >
          <FontAwesomeIcon icon={faAngleLeft} size="1x" />
        </div>
        <div className={styles.numbercontainer}>{pageSelectors}</div>
        <div
          className={styles.tablefooternavicon}
          onClick={() => {
            const additionalOffset = properties.customBounds ? properties.customBounds[0] : 0;
            if (
              properties.offset - additionalOffset + properties.numberEntries <
              properties.filteredData.length
            )
              properties.setOffset(
                properties.offset + properties.numberEntries
              );
          }}
          role="button"
        >
          <FontAwesomeIcon icon={faAngleRight} size="1x" />
        </div>
      </div>
    </div>
  );
}

function PageSelector(properties) {
  return (
    <div
      className={`${styles.pageselector} ${
        properties.number === properties.currPage
          ? styles.pageselectorselected
          : ''
      }`}
      onClick={() => {
        properties.setOffset((properties.number - 1) * properties.numberEntries);
      }}
      role="button"
    >
      {properties.number}
    </div>
  );
}

function createPageSelectors(
  numberPages,
  setOffset,
  numberEntries,
  currentPage,
  customBounds
) {
  const pageSelectors = [];

  pageSelectors.push(
    <PageSelector
      key={1}
      number={1}
      setOffset={setOffset}
      numberEntries={numberEntries}
      currPage={currentPage}
      customBounds={customBounds}
    />
  );

  if (numberPages <= 1)
    return pageSelectors;

  const skipBegin = currentPage >= 5;
  const skipEnd = currentPage <= numberPages - 4;

  skipBegin && pageSelectors.push(<p key="startRange">...</p>);

  let start = currentPage - 1;
  let end = currentPage + 1;

  if (skipBegin && !skipEnd) {
    start = numberPages - 4;
    end = numberPages - 1;
  }

  else if (!skipBegin && skipEnd) {
    start = 2;
    end = 5;
  }

  else if (!skipBegin && !skipEnd) {
    start = 2;
    end = numberPages - 1;
  }


  for (let index = start; index <= end; index++) {
    if (index < numberPages)
      pageSelectors.push(
        <PageSelector
          key={index}
          number={index}
          setOffset={setOffset}
          numberEntries={numberEntries}
          currPage={currentPage}
          customBounds={customBounds}
        />
      );
  }

    
  skipEnd && pageSelectors.push(<p key="endRange">...</p>);
    pageSelectors.push(
      <PageSelector
        key={numberPages}
        number={numberPages}
        setOffset={setOffset}
        numberEntries={numberEntries}
        currPage={currentPage}
        customBounds={customBounds}
      />
    );
  return pageSelectors;
}
