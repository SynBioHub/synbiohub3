import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { DateRangePicker } from 'react-date-range';
import Select from 'react-select';

import getCollections from '../../../sparql/getCollections';
import getCreators from '../../../sparql/getCreators';
import getRoles from '../../../sparql/getRoles';
import getSBOLTypes from '../../../sparql/getSBOLTypes';
import getTypes from '../../../sparql/getTypes';
import styles from '../../../styles/advancedsearch.module.css';
import SelectLoader from './SelectLoader';

export default function Options(properties) {
  const [additionalFilters, setAdditionalFilters] = useState([]);
  const [filterDisplay, setFilterDisplay] = useState([]);

  useEffect(() => {
    setFilterDisplay(
      additionalFilters.map((element, index) => {
        return (
          <div className={styles.inputsection} key={index}>
            <Select
              options={creators}
              className={styles.optionselect}
              placeholder="Filter Type"
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
        );
      })
    );
  }, [additionalFilters]);

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
            return { value: result.object.value, label: result.object.value };
          }}
          onChange={option => properties.setObjectType(option.value)}
        />
      </div>
      <div className={styles.inputsection}>
        <label>Creator</label>
        <SelectLoader
          sparql={getCreators}
          parseResult={result => {
            return { value: result.object.value, label: result.object.value };
          }}
          onChange={option => properties.setCreator(option.value)}
        />
      </div>
      <div className={styles.inputsection}>
        <label>Role</label>
        <SelectLoader
          sparql={getRoles}
          parseResult={result => {
            return { value: result.object.value, label: result.object.value };
          }}
          onChange={option => properties.setRole(option.value)}
        />
      </div>
      <div className={styles.inputsection}>
        <label>SBOL Type</label>
        <SelectLoader
          sparql={getSBOLTypes}
          parseResult={result => {
            return { value: result.object.value, label: result.object.value };
          }}
          onChange={option => properties.setSbolType(option.value)}
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
        onClick={() => setAdditionalFilters(addFilter(additionalFilters))}
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
      filter: '',
      value: ''
    }
  ];
};

const creators = [
  { value: '', label: 'Any' },
  { value: 'test', label: 'Test' },
  { value: 'test2', label: 'Test2' }
];
