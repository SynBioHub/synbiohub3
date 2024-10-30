import React, { useEffect, useState } from 'react';
import { faPlus, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

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
import { addError } from '../../../redux/actions';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

// tooltip component to show descriptions on hover
const Tooltip = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={styles.tooltipContainer}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && <div className={styles.tooltip}>{text}</div>}
    </div>
  );
};

// main options component
export default function Options(properties) {
  const [predicates, setPredicates] = useState('loading');
  const dispatch = useDispatch();
  const token = useSelector(state => state.user.token);

  // load predicates on component mount
  useEffect(() => {
    loadPredicates(setPredicates, token, dispatch);
  }, []);

  // map through extra filters to display them
  const filterDisplay = properties.extraFilters.map((element, index) => {
    return (
      <AdditionalFilter
        predicates={predicates}
        key={element.filter + element.value}
        index={index}
        extraFilters={properties.extraFilters}
        setExtraFilters={properties.setExtraFilters}
        handleDelete={properties.handleDelete}
      />
    );
  });

  return (
    <div>
      {/* select creator section */}
      <div className={styles.inputsection}>
        <div className={styles.labelsection}>
          <span>Select Creator</span>
          <Tooltip text="Select the Creator">
            <FontAwesomeIcon icon={faInfoCircle} className={styles.infoIcon} />
          </Tooltip>
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

      {/* select part type section */}
      <div className={styles.inputsection}>
        <div className={styles.labelsection}>
          <span>Select Part Type</span>
          <Tooltip text="Select the Part Type">
            <FontAwesomeIcon icon={faInfoCircle} className={styles.infoIcon} />
          </Tooltip>
        </div>
        <SelectLoader
          sparql={getSBOLTypes}
          placeholder={shortName(properties.sbolType)}
          parseResult={result => {
            return {
              value: result.object.value,
              label: shortName(result.object.value),
            };
          }}
          onChange={option =>
            properties.setSbolType(option ? option.value : '')
          }
        />
      </div>

      {/* select part role section */}
      <div className={styles.inputsection}>
        <div className={styles.labelsection}>
          <span>Select Part Role</span>
          <Tooltip text="Select the Part Role">
            <FontAwesomeIcon icon={faInfoCircle} className={styles.infoIcon} />
          </Tooltip>
        </div>
        <SelectLoader
          sparql={getRoles}
          placeholder={shortName(properties.role)}
          value={properties.role}
          parseResult={result => {
            return {
              value: result.object.value,
              label: shortName(result.object.value),
            };
          }}
          onChange={option => properties.setRole(option ? option.value : '')}
        />
      </div>

      {/* select object type section */}
      <div className={styles.inputsection}>
        <div className={styles.labelsection}>
          <span>Select Object Type</span>
          <Tooltip text="Select the Object Type">
            <FontAwesomeIcon icon={faInfoCircle} className={styles.infoIcon} />
          </Tooltip>
        </div>
        <SelectLoader
          sparql={getTypes}
          placeholder={shortName(properties.objectType)}
          parseResult={result => {
            return {
              value: result.object.value,
              label: shortName(result.object.value),
            };
          }}
          onChange={option =>
            properties.setObjectType(option ? option.value : '')
          }
        />
      </div>

      {/* select collections section */}
      <div className={styles.inputsection}>
        <div className={styles.labelsection}>
          <span>Select Collections</span>
          <Tooltip text="Select the Collections">
            <FontAwesomeIcon icon={faInfoCircle} className={styles.infoIcon} />
          </Tooltip>
        </div>
        <SelectLoader
          className={styles.optionselectW}
          sparql={getCollections}
          placeholder={properties.collections.map(collection => collection.label)}
          isMulti={true}
          parseResult={result => {
            return !result.name
              ? { value: result.subject.value, label: result.displayId.value }
              : { value: result.subject.value, label: result.name.value };
          }}
          onChange={collections => properties.setCollections(collections)}
        />
      </div>

      {/* display additional filters */}
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

// function to load predicates
const loadPredicates = async (setPredicates, token, dispatch) => {
  const results = await fetchPredicates(token, dispatch);
  setPredicates(results);
};

// function to fetch predicates
const fetchPredicates = async (token, dispatch) => {
  const url = `${publicRuntimeConfig.backend}/sparql?query=${encodeURIComponent(
    getPredicates
  )}`;
  try {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-authorization': token,
    };

    const response = await axios.get(url, {
      headers,
    });

    return response.status === 200 ? response.data : 'error';
  } catch (error) {
    error.customMessage = 'error fetching predicates';
    error.fullUrl = `query: ${getPredicates} \n\n\n url: ${url}`;
    dispatch(addError(error));
  }
};