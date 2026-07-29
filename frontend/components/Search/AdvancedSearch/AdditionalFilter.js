import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { shortName } from '../../../namespace/namespace';
import buildFacetConstraints from '../../../sparql/buildFacetConstraints';
import configureQuery from '../../../sparql/configureQuery';
import searchObject from '../../../sparql/searchObject';
import styles from '../../../styles/advancedsearch.module.css';
import FacetOptionList from './FacetOptionList';
import useFacetOptions from './useFacetOptions';

const wrapIRI = value => (value?.startsWith('http') ? `<${value}>` : value);

const parsePredicateOption = result => ({
  value: result.predicate.value,
  label: shortName(result.predicate.value)
});

const parseValueOption = result => ({
  value: result.object.value,
  label: shortName(result.object.value),
  count: result.count ? Number(result.count.value) : 0
});

const buildValueSparql = (
  properties,
  searchQuery,
  predicate,
  privateGraphUri
) =>
  configureQuery(searchObject, {
    predicate: wrapIRI(predicate),
    constraints: buildFacetConstraints(
      properties,
      searchQuery,
      undefined,
      properties.index
    ),
    from: privateGraphUri ? `FROM <${privateGraphUri}>` : ''
  });

const syncFilterFromState = (properties, selectedPredicate, selectedValue) => {
  const newFilters = [...properties.extraFilters];
  newFilters[properties.index] = {
    filter: selectedPredicate,
    value: selectedPredicate ? selectedValue : ''
  };

  if (newFilters[properties.index].filter !== '')
    properties.setExtraFilters(newFilters);
};

const syncStateFromFilter = (
  properties,
  setSelectedPredicate,
  setSelectedValue
) => {
  if (properties.index >= properties.extraFilters.length) {
    setSelectedPredicate('');
    setSelectedValue('');
    return;
  }
  const currentFilter = properties.extraFilters[properties.index];
  setSelectedPredicate(currentFilter.filter || '');
  setSelectedValue(currentFilter.value || '');
};

export default function AdditionalFilter(properties) {
  const [selectedPredicate, setSelectedPredicate] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const searchQuery = useSelector(state => state.search.query);
  const privateGraphUri = useSelector(state => state.user.graphUri);

  useEffect(() => {
    syncFilterFromState(properties, selectedPredicate, selectedValue);
  }, [selectedPredicate, selectedValue]);

  useEffect(() => {
    syncStateFromFilter(properties, setSelectedPredicate, setSelectedValue);
  }, [properties.extraFilters.length, properties.index]);

  const currentFilter = properties.extraFilters[properties.index];
  const hasPredicate = Boolean(currentFilter.filter);

  const predicateOptions = useFacetOptions({
    result: properties.predicates,
    parseResult: parsePredicateOption
  });

  const valueOptions = useFacetOptions({
    sparql: hasPredicate
      ? buildValueSparql(
          properties,
          searchQuery,
          currentFilter.filter,
          privateGraphUri
        )
      : undefined,
    parseResult: parseValueOption
  });

  return (
    <div className={styles.facetcard}>
      <div className={styles.facetheader}>
        <span className={styles.facettitle}>
          {hasPredicate ? shortName(currentFilter.filter) : 'Add Filter'}
        </span>
        <span
          role="button"
          className={styles.facetclear}
          onClick={() => properties.handleDelete(properties.index)}
        >
          &times;
        </span>
      </div>

      {!hasPredicate && (
        <FacetOptionList
          data={predicateOptions.data}
          loading={predicateOptions.loading}
          error={predicateOptions.error}
          value={null}
          onChange={option => setSelectedPredicate(option ? option.label : '')}
          searchPlaceholder="Search filter type..."
          emptyLabel="No filters available"
        />
      )}

      {hasPredicate && (
        <FacetOptionList
          data={valueOptions.data}
          loading={valueOptions.loading}
          error={valueOptions.error}
          value={selectedValue}
          onChange={option => setSelectedValue(option ? option.value : '')}
          searchPlaceholder={`Search ${shortName(
            currentFilter.filter
          ).toLowerCase()}...`}
        />
      )}
    </div>
  );
}
