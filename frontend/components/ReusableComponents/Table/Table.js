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
      if (sortOption)
        filteredData.sort((data1, data2) =>
          properties.sortMethods[sortOption.value](data1, data2)
        );
      setDisplay(
        createDisplay(
          filteredData,
          offset,
          numberEntries,
          properties.dataRowDisplay
        )
      );
    }
  }, [filteredData, sortOption, numberEntries, filter, offset]);

  useEffect(() => {
    if (properties.data) {
      setfilteredData(
        filterData(properties.data, properties.searchable, filter)
      );
    }
  }, [properties.data, properties.searchable, filter]);

  useEffect(() => {
    setOffset(0);
  }, [filter, sortOption]);

  if (properties.data) {
    return (
      <div className={styles.statuscontainer}>
        <TableHeader
          title={properties.title}
          count={properties.data.length}
          filter={filter}
          setFilter={setFilter}
          sortOptions={properties.sortOptions}
          setSortOption={setSortOption}
          defaultSortOption={properties.defaultSortOption}
        />
        <table className={styles.table}>
          {properties.headers && (
            <thead>
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
          />
        )}
      </div>
    );
  } else if (properties.loading) return <Loading />;
  else {
    return <ErrorMessage title={properties.title} />;
  }
}

function createDisplay(filteredData, offset, numberEntries, dataRowDisplay) {
  return filteredData
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
}

function createHeader(headers) {
  return headers.map(header => <th key={header}>{header}</th>);
}

function filterData(data, searchable, filter) {
  if (!filter) return data;
  return data.filter(result => {
    let passesFilter = false;
    for (const key of searchable) {
      if (result[key].toString().toLowerCase().includes(filter.toLowerCase()))
        passesFilter = true;
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
