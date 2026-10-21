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
import facetDefinitions from '../../../utilities/facetDefinitions';
import AdditionalFilter from './AdditionalFilter';
import FacetCard from './FacetCard';
const { publicRuntimeConfig } = getConfig();

// main options component
export default function Options(properties) {
  const [predicates, setPredicates] = useState('loading');
  const dispatch = useDispatch();
  const token = useSelector(state => state.user.token);
  const inputQuery = useSelector(state => state.search.query);
  const searchQuery = properties.searchQuery ?? inputQuery;
  const username = useSelector(state => state.user.username);
  const privateGraphUri = useSelector(state => state.user.graphUri);
  const theme = JSON.parse(localStorage.getItem('theme')) || {};
  const publicGraphUri = theme.defaultGraph || '';

  const fromClause = [
    publicGraphUri ? `FROM <${publicGraphUri}>` : '',
    privateGraphUri ? `FROM <${privateGraphUri}>` : ''
  ]
    .filter(Boolean)
    .join('\n');

  const facetQuery = (template, excludeFacet) =>
    configureQuery(template, {
      constraints: buildFacetConstraints(properties, searchQuery, excludeFacet),
      from: fromClause
    });

  // load predicates on component mount
  useEffect(() => {
    loadPredicates(setPredicates, token, dispatch, fromClause);
  }, [fromClause]);

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

  const uriLabel = uri => {
    if (uri === 'http://sbols.org/v2#ComponentDefinition') return 'Component';
    if (uri === 'http://sbols.org/v2#ModuleDefinition') return 'Module';
    return shortName(uri);
  };

  const addCountToResultName = result => {
    const uri = result.object.value;
    return {
      value: uri,
      label: uriLabel(uri),
      count: result.count ? Number(result.count.value) : 0
    };
  };

  // Ready-made options from SBOLExplorer's /facets (see useExplorerFacets),
  // or undefined so the card falls back to its own SPARQL query. URI-valued
  // facets keep the same labels as the SPARQL path.
  const explorer = properties.explorerFacets;
  const explorerOptions = (name, labelFromUri) => {
    if (!explorer || !explorer.available) return undefined;
    return (explorer.facets[name] || []).map(option => ({
      value: option.value,
      label: labelFromUri ? uriLabel(option.value) : option.label,
      count: option.count
    }));
  };
  const explorerLoading = Boolean(explorer && explorer.loading);

  return (
    <div>
      <FacetCard
        title="Part Type"
        subtitle="sbol2:type"
        description={facetDefinitions['Part Type']}
        sparql={facetQuery(getSBOLTypes, 'sbolType')}
        options={explorerOptions('sboltype', true)}
        optionsLoading={explorerLoading}
        value={properties.sbolType}
        parseResult={addCountToResultName}
        onChange={option => properties.setSbolType(option ? option.value : '')}
      />

      <FacetCard
        title="Part Role"
        subtitle="sbol2:role"
        description={facetDefinitions['Part Role']}
        sparql={facetQuery(getRoles, 'role')}
        options={explorerOptions('role', true)}
        optionsLoading={explorerLoading}
        value={properties.role}
        parseResult={addCountToResultName}
        onChange={option => properties.setRole(option ? option.value : '')}
      />

      <FacetCard
        title="Object Type"
        subtitle="rdf:type"
        description={facetDefinitions['Object Type']}
        sparql={facetQuery(getTypes, 'objectType')}
        options={explorerOptions('type', true)}
        optionsLoading={explorerLoading}
        value={properties.objectType}
        parseResult={addCountToResultName}
        onChange={option =>
          properties.setObjectType(option ? option.value : '')
        }
      />

      <FacetCard
        title="Collections"
        subtitle="sbol2:member"
        description={facetDefinitions.Collections}
        sparql={facetQuery(getCollections, 'collections')}
        options={explorerOptions('collections', false)}
        optionsLoading={explorerLoading}
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
        description={facetDefinitions.Creator}
        sparql={facetQuery(getCreators, 'creator')}
        options={explorerOptions('creator', false)}
        optionsLoading={explorerLoading}
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
        Additional Filters
      </div>
    </div>
  );
}

// function to load predicates
const loadPredicates = async (setPredicates, token, dispatch, fromClause) => {
  const results = await fetchPredicates(token, dispatch, fromClause);
  setPredicates(results);
};

// function to fetch predicates
const fetchPredicates = async (token, dispatch, fromClause) => {
  const url = `${publicRuntimeConfig.backend}/sparql?query=${encodeURIComponent(
    configureQuery(getPredicates, { from: fromClause || '' })
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
