import { useEffect, useState } from 'react';

import { shortName } from '../../../namespace/namespace';
import configureQuery from '../../../sparql/configureQuery';
import searchObject from '../../../sparql/searchObject';
import styles from '../../../styles/advancedsearch.module.css';
import SelectLoader from './SelectLoader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';

export default function AdditionalFilter(properties) {
  const [selectedPredicate, setSelectedPredicate] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const wrapIRI = v => (v?.startsWith("http") ? `<${v}>` : v);

  useEffect(() => {
    const newFilters = [...properties.extraFilters];
    newFilters[properties.index] = {
      filter: selectedPredicate,
      value: selectedPredicate ? selectedValue : "",
    };

    if(newFilters[properties.index].filter != '')
      properties.setExtraFilters(newFilters);
  }, [selectedPredicate, selectedValue]);

  useEffect(() => {
    if (properties.index < properties.extraFilters.length) {
      const currentFilter = properties.extraFilters[properties.index];
      setSelectedPredicate(currentFilter.filter || "");
      setSelectedValue(currentFilter.value || "");
    } else {
      // Reset local state if this filter no longer exists
      setSelectedPredicate("");
      setSelectedValue("");
    }
  }, [properties.extraFilters.length, properties.index]);

  return (
    <div className={styles.inputsection}>
      {<div className={styles.labelsection}>
        <span>{shortName(properties.extraFilters[properties.index].filter)}</span>
      </div>}
      {<div className={styles.inputsection2}>
        <div className={styles.containerLeft}>
        {!properties.extraFilters[properties.index].filter && 
        (<SelectLoader 
          result={properties.predicates}
          placeholder="Select filter type..."
          parseResult={result => {
            return {
              value: result.predicate.value,
              label: shortName(result.predicate.value)
            };
          }}
          onChange={option => {
            setSelectedPredicate(option ? option.label : "");
          }}
          />
        )}
      {properties.extraFilters[properties.index].filter && 
        (<SelectLoader
          placeholder={shortName(wrapIRI(properties.extraFilters[properties.index].value))}//{selectedValue}
          sparql={configureQuery(searchObject, {
            predicate: wrapIRI(properties.extraFilters[properties.index].filter) //selectedPredicate
          })}
          parseResult={result => {
            return {
              value: result.object.value,
              label: shortName(result.object.value)
            };
          }}
          onChange={option => {
            setSelectedValue(option ? option.value : "");
          }}
        />
      )}
        </div>
        <div className={styles.containerRight}>
          <div
          style={{
            padding: '0.6rem 0.5rem 0.1rem 0.5rem',
            cursor: 'pointer'
          }}
          onClick={() => { 
            properties.handleDelete(properties.index); 
          }}
        >
          <FontAwesomeIcon icon={faTimesCircle} size="1x" color="red" />
          </div>
        </div>
      </div>}
    </div>
  );
}
