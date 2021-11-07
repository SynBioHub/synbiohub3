import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { DateRangePicker } from 'react-date-range';

import { shortName } from '../../../namespace/namespace';
import getCollections from '../../../sparql/getCollections';
import getCreators from '../../../sparql/getCreators';
import getPredicates from '../../../sparql/getPredicates';
import getRoles from '../../../sparql/getRoles';
import getSBOLTypes from '../../../sparql/getSBOLTypes';
import getTypes from '../../../sparql/getTypes';
import styles from '../../../styles/advancedsearch.module.css';
import AdditionalFilter from './AdditionalFilter';
import SelectLoader from './SelectLoader';

/* eslint sonarjs/no-identical-functions: "off" */

export default function Options(properties) {
  const [filterDisplay, setFilterDisplay] = useState([]);
  const [predicates, setPredicates] = useState('loading');

  useEffect(() => {
    loadPredicates(setPredicates);
  }, []);

  useEffect(() => {
    setFilterDisplay(
      properties.extraFilters.map((element, index) => {
        return (
          <AdditionalFilter
            predicates={predicates}
            key={index}
            index={index}
            extraFilters={properties.extraFilters}
            setExtraFilters={properties.setExtraFilters}
          />
        );
      })
    );
  }, [properties.extraFilters, predicates]);

  return (
    <div>
      <div className={styles.inputsection}>
        <label>Keyword</label>
        <input
          type="text"
          placeholder="ID/Name/Description"
          className={styles.filterinput}
          value={properties.keyword}
          onChange={event => properties.setKeyword(event.target.value)}
        />
      </div>
      <div className={styles.inputsection}>
        <label>Object Type</label>
        <SelectLoader
          sparql={getTypes}
          parseResult={result => {
            return {
              value: result.object.value,
              label: shortName(result.object.value)
            };
          }}
          onChange={option =>
            properties.setObjectType(option ? option.value : '')
          }
        />
      </div>
      <div className={styles.inputsection}>
        <label>Creator</label>
        <SelectLoader
          sparql={getCreators}
          parseResult={result => {
            return { value: result.object.value, label: result.object.value };
          }}
          onChange={option => properties.setCreator(option ? option.value : '')}
        />
      </div>
      <div className={styles.inputsection}>
        <label>Role</label>
        <SelectLoader
          sparql={getRoles}
          parseResult={result => {
            return {
              value: result.object.value,
              label: shortName(result.object.value)
            };
          }}
          onChange={option => properties.setRole(option ? option.value : '')}
        />
      </div>
      <div className={styles.inputsection}>
        <label>SBOL Type</label>
        <SelectLoader
          sparql={getSBOLTypes}
          parseResult={result => {
            return {
              value: result.object.value,
              label: shortName(result.object.value)
            };
          }}
          onChange={option =>
            properties.setSbolType(option ? option.value : '')
          }
        />
      </div>
      <div className={styles.inputsection}>
        <label>Collections</label>
        <SelectLoader
          sparql={getCollections}
          isMulti={true}
          parseResult={result => {
            return !result.name
              ? { value: result.subject.value, label: result.displayId.value }
              : { value: result.subject.value, label: result.name.value };
          }}
          onChange={collections => properties.setCollections(collections)}
        />
      </div>
      <div className={styles.calendarinputsection}>
        <label>Created Between</label>
        <DateRangePicker
          editableDateInputs={true}
          onChange={item => properties.setCreated([item.selection])}
          inputRanges={[]}
          ranges={properties.created}
          moveRangeOnFirstSelection={false}
        />
      </div>
      <div className={styles.calendarinputsection}>
        <label>Modfied Between</label>
        <DateRangePicker
          editableDateInputs={true}
          onChange={item => properties.setModified([item.selection])}
          inputRanges={[]}
          ranges={properties.modified}
          moveRangeOnFirstSelection={false}
        />
      </div>
      {filterDisplay}
      <div
        className={styles.newfilterbutton}
        role="button"
        onClick={() =>
          properties.setExtraFilters(addFilter(properties.extraFilters))
        }
      >
        <div className={styles.addfiltericon}>
          <FontAwesomeIcon icon={faPlus} size="1x" />
        </div>
        Add Filter
      </div>
    </div>
  );
}

const addFilter = filters => {
  return [
    ...filters,
    {
      filter: undefined,
      value: undefined
    }
  ];
};

const loadPredicates = async setPredicates => {
  const results = await fetchPredicates();
  setPredicates(results);
};

const fetchPredicates = async () => {
  const url = `${process.env.backendUrl}/sparql?query=${encodeURIComponent(
    getPredicates
  )}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  return response.status === 200 ? await response.json() : 'error';
};
