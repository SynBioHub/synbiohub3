/* eslint sonarjs/cognitive-complexity: "off" */
import { useEffect, useState } from 'react';

import styles from '../../../styles/defaulttable.module.css';
import Loading from '../Loading';
import { numberDisplayOptions } from './TableConfig';
import TableHeader from './TableHeader';
import TableNav from './TableNav';

export default function Table(properties) {
  const [filteredData, setfilteredData] = useState([]);
  const [display, setDisplay] = useState([]);
  const [sortOption, setSortOption] = useState(properties.defaultSortOption);
  const [numberEntries, setNumberEntries] = useState(
    properties.hideFooter
      ? numberDisplayOptions[numberDisplayOptions.length - 1].value
      : numberDisplayOptions[0].value
  );
  const [filter, setFilter] = useState('');
  const [offset, setOffset] = useState(0);

  const header = createHeader(properties.headers);

  useEffect(() => {
    if (filteredData) {
      if (properties.customSortBehavior) {
        properties.customSortBehavior(properties.sortMethods[sortOption.value], sortOption);
      } else if (sortOption && properties.sortMethods[sortOption.value]) {
        filteredData.sort((data1, data2) =>
          properties.sortMethods[sortOption.value](data1, data2)
        );
      } else {
        console.error('Invalid sort option or sort method:', sortOption, properties.sortMethods);
      }

      if (properties.customBounds) {
        if (offset < properties.customBounds[0] || offset > properties.customBounds[1]) {
          properties.outOfBoundsHandle(offset);
          return;
        }
      }
      setDisplay(
        createDisplay(
          filteredData,
          offset,
          numberEntries,
          properties.dataRowDisplay,
          properties.customBounds
        )
      );
    }
  }, [filteredData, sortOption, numberEntries, filter, offset, properties.customBounds, properties.outOfBoundsHandle]);


  useEffect(() => {
    if (properties.updateRowsWhen) {
      setDisplay(
        createDisplay(
          filteredData,
          offset,
          numberEntries,
          properties.dataRowDisplay,
          properties.customBounds
        )
      );
    }
  }, [properties.updateRowsWhen]);

  useEffect(() => {
    if (properties.data) {
      setfilteredData(
        filterData(properties.data, properties.searchable, filter)
      );
    }
  }, [properties.data, properties.searchable, filter]);

  useEffect(() => {
    setOffset(0);
  }, [filter, sortOption, properties.customSearch]);

  if (properties.loading) return <Loading />;
  else if (properties.data) {
    return (
      <div
        className={`${styles.container} ${properties.scrollX ? styles.scrollX : ''
          }`}
      >
        <TableHeader
          title={properties.title}
          hideCount={properties.hideCount}
          hideFilter={properties.hideFilter}
          count={properties.count ? properties.count : properties.data.length}
          filter={filter}
          setFilter={setFilter}
          sortOptions={properties.sortOptions}
          setSortOption={setSortOption}
          defaultSortOption={properties.defaultSortOption}
          topStickyIncrement={properties.topStickyIncrement}
        />
        <table className={styles.table}>
          {properties.headers && (
            <thead
              style={{
                top: `${properties.topStickyIncrement
                  ? 2.5 + properties.topStickyIncrement
                  : 2.5
                  }rem`
              }}
            >
              <tr>{header}</tr>
            </thead>
          )}
          <tbody>
            {display}
            {properties.finalRow}
          </tbody>
        </table>
        {!properties.hideFooter && (
          <TableNav
            title={properties.title}
            offset={offset}
            setOffset={setOffset}
            numberEntries={numberEntries}
            setNumberEntries={setNumberEntries}
            filteredData={filteredData}
            numberShownLabel={properties.numberShownLabel}
            customCount={properties.customCount}
            customBounds={properties.customBounds}
          />
        )}
      </div>
    );
  } else {
    return <ErrorMessage title={properties.title} />;
  }
}

function createDisplay(filteredData, offset, numberEntries, dataRowDisplay, customBounds) {
  let additionalOffset = customBounds ? customBounds[0] : 0;
  offset -= additionalOffset;
  const toDisplay = filteredData
    .slice(
      offset,
      Math.min(
        filteredData.length,
        numberEntries === 'all' ? filteredData.length : offset + numberEntries
      )
    )
    .map(graph => {
      return dataRowDisplay(graph);
    });
  return toDisplay;
}

function createHeader(headers) {
  return headers.map(header => <th key={header}>{header}</th>);
}

function filterData(data, searchable, filter) {
  if (!filter) return data;
  return data.filter(result => {
    let passesFilter = false;
    for (const key of searchable) {
      if (
        result[key] &&
        result[key].toString().toLowerCase().includes(filter.toLowerCase())
      ) {
        passesFilter = true;
      }
    }
    return passesFilter;
  });
}

function ErrorMessage(properties) {
  return (
    <div className={styles.error}>
      Errors were encountered while fetching <code>{properties.title}</code>
    </div>
  );
}
