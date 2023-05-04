import { useEffect, useState } from 'react';

import { shortName } from '../../../namespace/namespace';
import configureQuery from '../../../sparql/configureQuery';
import searchObject from '../../../sparql/searchObject';
import styles from '../../../styles/advancedsearch.module.css';
import SelectLoader from './SelectLoader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';

export default function AdditionalFilter(properties) {
  const [selectedPredicate, setSelectedPredicate] = useState();
  const [selectedValue, setSelectedValue] = useState();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const newFilters = [...properties.extraFilters];
    newFilters[properties.index] = {
      filter: selectedPredicate,
      value: selectedPredicate ? selectedValue : undefined
    };
    properties.setExtraFilters(newFilters);
  }, [selectedPredicate, selectedValue, properties.index]);

  if (hidden) return null;

  return (
    <div className={styles.inputsection}>
      <SelectLoader
        result={properties.predicates}
        placeholder="Select filter type..."
        parseResult={result => {
          return {
            value: result.predicate.value,
            label: shortName(result.predicate.value)
          };
        }}
        onChange={option => {
          setSelectedPredicate(option ? option.label : undefined);
        }}
      />
      {selectedPredicate && (
        <SelectLoader
          sparql={configureQuery(searchObject, {
            predicate: selectedPredicate
          })}
          parseResult={result => {
            return {
              value: result.object.value,
              label: shortName(result.object.value)
            };
          }}
          onChange={option => {
            setSelectedValue(option ? option.value : undefined);
          }}
        />
      )}
      <div
        style={{
          padding: '0.6rem 0.5rem 0.6rem 0.7rem',
          marginLeft: '0.3rem',
          cursor: 'pointer'
        }}
        onClick={() => {
          const newFilters = [...properties.extraFilters];
          newFilters[properties.index] = {
            filter: selectedPredicate,
            value: undefined
          };
          properties.setExtraFilters(newFilters);
          setHidden(true);
        }}
      >
        <FontAwesomeIcon icon={faTimesCircle} size="1x" color="red" />
      </div>
    </div>
  );
}
