import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { DateRangePicker } from 'react-date-range';
import Select from 'react-select';

import styles from '../../../styles/advancedsearch.module.css';

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
        <label>Type</label>
        <Select
          options={objectTypes}
          defaultValue={objectTypes[0]}
          className={styles.optionselect}
          styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
          onChange={option => properties.setType(option.value)}
        />
      </div>
      <div className={styles.inputsection}>
        <label>Role</label>
        <Select
          options={objectTypes}
          defaultValue={objectTypes[0]}
          className={styles.optionselect}
          styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
          onChange={option => properties.setRole(option.value)}
        />
      </div>
      <div className={styles.inputsection}>
        <label>Creator</label>
        <Select
          options={creators}
          defaultValue={creators[0]}
          className={styles.optionselect}
          styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
          onChange={option => properties.setCreator(option.value)}
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
      <div className={styles.inputsection}>
        <label>Collections</label>
        <Select
          isMulti
          options={creators}
          className={styles.optionselect}
          styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
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

const objectTypes = [
  { value: '', label: 'Any' },
  { value: 'prov:Activity', label: 'prov:Activity' },
  { value: 'sbol2:Attachment', label: 'sbol2:Attachment' },
  { value: 'sbol2:Collection', label: 'sbol2:Collection' },
  { value: 'sbol2:ComponentDefinition', label: 'sbol2:ComponentDefinition' },
  { value: 'sbol2:Sequence', label: 'sbol2:Sequence' }
];

const creators = [
  { value: '', label: 'Any' },
  { value: 'test', label: 'Test' },
  { value: 'test2', label: 'Test2' }
];
