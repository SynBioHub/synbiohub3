import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import getConfig from 'next/config';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { shortName } from '../../../namespace/namespace';
import { addError } from '../../../redux/actions';
import buildFacetConstraints from '../../../sparql/buildFacetConstraints';
import configureQuery from '../../../sparql/configureQuery';
import getCollections from '../../../sparql/getCollections';
import getCreators from '../../../sparql/getCreators';
import getPredicates from '../../../sparql/getPredicates';
import getRoles from '../../../sparql/getRoles';
import getSBOLTypes from '../../../sparql/getSBOLTypes';
import getTypes from '../../../sparql/getTypes';
import styles from '../../../styles/advancedsearch.module.css';
import AdditionalFilter from './AdditionalFilter';
import SelectLoader from './SelectLoader';
const { publicRuntimeConfig } = getConfig();

// main options component
export default function Options(properties) {
  const [predicates, setPredicates] = useState('loading');
  const dispatch = useDispatch();
  const token = useSelector(state => state.user.token);
  const searchQuery = useSelector(state => state.search.query);

  const facetQuery = (template, excludeFacet) =>
    configureQuery(template, {
      constraints: buildFacetConstraints(properties, searchQuery, excludeFacet)
    });

  // load predicates on component mount
  useEffect(() => {
    loadPredicates(setPredicates, token, dispatch);
  }, []);

  // map through extra filters to display them
  const filterDisplay = properties.extraFilters.map((element, index) => {
    return (
      <AdditionalFilter
        predicates={predicates}
        key={index}
        index={index}
        extraFilters={properties.extraFilters}
        setExtraFilters={properties.setExtraFilters}
        handleDelete={properties.handleDelete}
        creator={properties.creator}
        objectType={properties.objectType}
        role={properties.role}
        sbolType={properties.sbolType}
        collections={properties.collections}
      />
    );
  });

  const addCountToResultName = result => {
    const count = result.count ? ` (${result.count.value})` : '';
    return {
      value: result.object.value,
      label: shortName(result.object.value) + count,
      count: result.count ? Number(result.count.value) : 0
    };
  };

  return (
    <div>
      {/* select creator section */}
      <div className={styles.inputsection}>
        <div className={styles.labelsection}>
          <span>Select Creator</span>
        </div>
        <SelectLoader
          sparql={facetQuery(getCreators, 'creator')}
          placeholder={shortName(properties.creator)}
          parseResult={result => {
            const count = result.count ? ` (${result.count.value})` : '';
            return {
              value: result.object.value,
              label: result.object.value + count,
              count: result.count ? Number(result.count.value) : 0
            };
          }}
          onChange={option => properties.setCreator(option ? option.value : '')}
        />
      </div>

      {/* select part type section */}
      <div className={styles.inputsection}>
        <div className={styles.labelsection}>
          <span>Select Part Type</span>
        </div>
        <SelectLoader
          sparql={facetQuery(getSBOLTypes, 'sbolType')}
          placeholder={shortName(properties.sbolType)}
          parseResult={result => addCountToResultName(result)}
          onChange={option =>
            properties.setSbolType(option ? option.value : '')
          }
        />
      </div>

      {/* select part role section */}
      <div className={styles.inputsection}>
        <div className={styles.labelsection}>
          <span>Select Part Role</span>
        </div>
        <SelectLoader
          sparql={facetQuery(getRoles, 'role')}
          placeholder={shortName(properties.role)}
          value={properties.role}
          parseResult={result => addCountToResultName(result)}
          onChange={option => properties.setRole(option ? option.value : '')}
        />
      </div>

      {/* select object type section */}
      <div className={styles.inputsection}>
        <div className={styles.labelsection}>
          <span>Select Object Type</span>
        </div>
        <SelectLoader
          sparql={facetQuery(getTypes, 'objectType')}
          placeholder={shortName(properties.objectType)}
          parseResult={result => addCountToResultName(result)}
          onChange={option =>
            properties.setObjectType(option ? option.value : '')
          }
        />
      </div>

      {/* select collections section */}
      <div className={styles.inputsection}>
        <div className={styles.labelsection}>
          <span>Select Collections</span>
        </div>
        <SelectLoader
          className={styles.optionselectW}
          sparql={facetQuery(getCollections, 'collections')}
          placeholder={properties.collections.map(
            collection => collection.label
          )}
          isMulti={true}
          parseResult={result => {
            const count = result.count ? ` (${result.count.value})` : '';
            const label = !result.name
              ? result.displayId.value
              : result.name.value;
            return {
              value: result.subject.value,
              label: label + count,
              count: result.count ? Number(result.count.value) : 0
            };
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
          properties.setExtraFilters(
            properties.addFilter(properties.extraFilters)
          )
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
      'X-authorization': token
    };

    const response = await axios.get(url, {
      headers
    });

    return response.status === 200 ? response.data : 'error';
  } catch (error) {
    error.customMessage = 'error fetching predicates';
    error.fullUrl = `query: ${getPredicates} \n\n\n url: ${url}`;
    dispatch(addError(error));
  }
};
