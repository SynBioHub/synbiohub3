import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import getConfig from 'next/config';
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
import axios from 'axios';
import { addError } from '../../../redux/actions';
import { useDispatch } from 'react-redux';
const { publicRuntimeConfig } = getConfig();

/* eslint sonarjs/no-identical-functions: "off" */

export default function Options(properties) {
  const [predicates, setPredicates] = useState('loading');
  const dispatch = useDispatch();

  useEffect(() => {
  loadPredicates(setPredicates, dispatch);
  }, []);

  console.log('Option predicates: ', predicates);
  console.log(properties);
  const filterDisplay = properties.extraFilters.map((element, index) => {
    return (
      <AdditionalFilter
        predicates={predicates}
        key={index}
        index={index}
        extraFilters={properties.extraFilters}
        setExtraFilters={properties.setExtraFilters}
        handleDelete={properties.handleDelete}
      />
    );
  });

  return (
    <div>
      <div className={styles.inputsection}>
        <div className={styles.labelsection}>
          <span>Select Object Type</span>
        </div>
        <SelectLoader
          sparql={getTypes}
          // placeholder="Select Object Type..."
          placeholder={shortName(properties.objectType)}
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
        <div className={styles.labelsection}>
          <span>Select Creator</span>
        </div>
        <SelectLoader
          sparql={getCreators}
          placeholder={shortName(properties.creator)}
          parseResult={result => {
            return { value: result.object.value, label: result.object.value };
          }}
          onChange={option => properties.setCreator(option ? option.value : '')}
        />
      </div>
      <div className={styles.inputsection}>
        <div className={styles.labelsection}>
          <span>Select Role Type</span>
        </div>
        <SelectLoader
          sparql={getRoles}
          placeholder={shortName(properties.role)}
          value={properties.role}
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
        <div className={styles.labelsection}>
          <span>Select SBOL Type</span>
        </div>
        <SelectLoader
          sparql={getSBOLTypes}
          placeholder={shortName(properties.sbolType)}
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
        <div className={styles.labelsection}>
          <span>Select Collections</span>
        </div>
        <SelectLoader
          className={styles.optionselectW}
          sparql={getCollections}
          placeholder={properties.collections.map(collection => collection.label)}//"Select Collections..."
          isMulti={true}
          parseResult={result => {
            return !result.name
              ? { value: result.subject.value, label: result.displayId.value }
              : { value: result.subject.value, label: result.name.value };
          }}
          onChange={collections => properties.setCollections(collections)
          }
        />
      </div>
      {/*<div className={styles.inputsection}>

        </div>*/}

      {/* <div className={styles.calendarinputsection}>
        <label>Created Between</label>
        <DateRangePicker
          editableDateInputs={true}
          onChange={item => properties.setCreated([item.selection])}
          inputRanges={[]}
          ranges={properties.created}
          moveRangeOnFirstSelection={false}
        />
      </div> */}
      {/* <div className={styles.calendarinputsection}>
        <label>Modfied Between</label>
        <DateRangePicker
          editableDateInputs={true}
          onChange={item => properties.setModified([item.selection])}
          inputRanges={[]}
          ranges={properties.modified}
          moveRangeOnFirstSelection={false}
        />
      </div> */}
      {filterDisplay}
      <div
        className={styles.newfilterbutton}
        role="button"
        onClick={() =>
          properties.setExtraFilters(properties.addFilter(properties.extraFilters))
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



const loadPredicates = async (setPredicates, dispatch) => {
  const results = await fetchPredicates(dispatch);
  setPredicates(results);
};

const fetchPredicates = async dispatch => {
  const url = `${publicRuntimeConfig.backend}/sparql?query=${encodeURIComponent(
    getPredicates
  )}`;
  try {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    const response = await axios.get(url, {
      headers
    });

    return response.status === 200 ? response.data : 'error';
  } catch (error) {
    error.customMessage = 'Error fetching predicates';
    error.fullUrl = `Query: ${getPredicates} \n\n\n URL: ${url}`;
    dispatch(addError(error));
  }
};
