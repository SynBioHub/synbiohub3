import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import Select from 'react-select';

import styles from '../../../styles/defaulttable.module.css';
import { numberDisplayOptions } from './TableConfig';

export default function TableNav(properties) {
  const [currentPage, setCurrentPage] = useState(1);
  const [numberPages, setNumberPages] = useState(
    Math.ceil(properties.filteredData.length / properties.numberEntries)
  );
  const [pageSelectors, setPageSelectors] = useState(null);

  useEffect(() => {
    setPageSelectors(
      createPageSelectors(
        numberPages,
        properties.setOffset,
        properties.numberEntries,
        currentPage
      )
    );
  }, [numberPages, currentPage]);

  useEffect(() => {
    if (numberPages && currentPage > numberPages) {
      setCurrentPage(numberPages);
      properties.setOffset((numberPages - 1) * properties.numberEntries);
    }
  }, [numberPages, properties.numberEntries]);

  useEffect(() => {
    setNumberPages(
      Math.ceil(properties.filteredData.length / properties.numberEntries)
    );
  }, [properties.filteredData, properties.numberEntries]);

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
            if (
              properties.offset + properties.numberEntries <
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
      onClick={() =>
        properties.setOffset((properties.number - 1) * properties.numberEntries)
      }
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
  pageSlots = 7
) {
  const pageSelectors = [];
  pageSelectors.push(
    <PageSelector
      key={1}
      number={1}
      setOffset={setOffset}
      numberEntries={numberEntries}
      currPage={currentPage}
    />
  );
  if (numberPages > 1) {
    let availableSlots = pageSlots - 1;
    let start = 2;
    if (currentPage - Math.floor(pageSlots / 2) > 1) {
      pageSelectors.push(<p>...</p>);
      start = currentPage - 1;
      availableSlots--;
    }
    for (let index = start; index < start + availableSlots - 2; index++) {
      if (index < numberPages)
        pageSelectors.push(
          <PageSelector
            key={index}
            number={index}
            setOffset={setOffset}
            numberEntries={numberEntries}
            currPage={currentPage}
          />
        );
    }
    if (currentPage + Math.floor(pageSlots / 2) < numberPages) {
      pageSelectors.push(<p>...</p>);
      availableSlots--;
    }
    pageSelectors.push(
      <PageSelector
        key={numberPages}
        number={numberPages}
        setOffset={setOffset}
        numberEntries={numberEntries}
        currPage={currentPage}
      />
    );
  }
  return pageSelectors;
}
