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
import FacetCard from './FacetCard';
const { publicRuntimeConfig } = getConfig();

// main options component
export default function Options(properties) {
  const [predicates, setPredicates] = useState('loading');
  const dispatch = useDispatch();
  const token = useSelector(state => state.user.token);
  const searchQuery = useSelector(state => state.search.query);
  const username = useSelector(state => state.user.username);
  const privateGraphUri = useSelector(state => state.user.graphUri);

  const facetQuery = (template, excludeFacet) =>
    configureQuery(template, {
      constraints: buildFacetConstraints(properties, searchQuery, excludeFacet),
      from: username ? `FROM <${privateGraphUri}>` : ''
    });

  // load predicates on component mount
  useEffect(() => {
    loadPredicates(setPredicates, token, dispatch, privateGraphUri);
  }, [privateGraphUri]);

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
    return {
      value: result.object.value,
      label: shortName(result.object.value),
      count: result.count ? Number(result.count.value) : 0
    };
  };

  return (
    <div>
      <FacetCard
        title="Part Type"
        subtitle="sbol2:type"
        sparql={facetQuery(getSBOLTypes, 'sbolType')}
        value={properties.sbolType}
        parseResult={addCountToResultName}
        onChange={option => properties.setSbolType(option ? option.value : '')}
      />

      <FacetCard
        title="Part Role"
        subtitle="sbol2:role"
        sparql={facetQuery(getRoles, 'role')}
        value={properties.role}
        parseResult={addCountToResultName}
        onChange={option => properties.setRole(option ? option.value : '')}
      />

      <FacetCard
        title="Object Type"
        subtitle="rdf:type"
        sparql={facetQuery(getTypes, 'objectType')}
        value={properties.objectType}
        parseResult={addCountToResultName}
        onChange={option =>
          properties.setObjectType(option ? option.value : '')
        }
      />

      <FacetCard
        title="Collections"
        subtitle="sbol2:member"
        sparql={facetQuery(getCollections, 'collections')}
        value={properties.collections}
        isMulti={true}
        parseResult={result => {
          const label = !result.name
            ? result.displayId.value
            : result.name.value;
          return {
            value: result.subject.value,
            label,
            count: result.count ? Number(result.count.value) : 0
          };
        }}
        onChange={collections => properties.setCollections(collections)}
      />

      <FacetCard
        title="Creator"
        subtitle="dc:creator"
        sparql={facetQuery(getCreators, 'creator')}
        value={properties.creator}
        parseResult={result => ({
          value: result.object.value,
          label: result.object.value,
          count: result.count ? Number(result.count.value) : 0
        })}
        onChange={option => properties.setCreator(option ? option.value : '')}
      />

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
const loadPredicates = async (
  setPredicates,
  token,
  dispatch,
  privateGraphUri
) => {
  const results = await fetchPredicates(token, dispatch, privateGraphUri);
  setPredicates(results);
};

// function to fetch predicates
const fetchPredicates = async (token, dispatch, privateGraphUri) => {
  const from = privateGraphUri ? `FROM <${privateGraphUri}>` : '';
  const url = `${publicRuntimeConfig.backend}/sparql?query=${encodeURIComponent(
    configureQuery(getPredicates, { from })
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
