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

  useEffect(() => {
    const newFilters = [...properties.extraFilters];
    newFilters[properties.index] = {
      filter: selectedPredicate,
      value: selectedPredicate ? selectedValue : "",
    };

    if(newFilters[properties.index].filter != '')
      properties.setExtraFilters(newFilters);
  }, [selectedPredicate, selectedValue]);
  return (
    <div className={styles.inputsection}>
      {<div className={styles.labelsection}>
        <span>{properties.extraFilters[properties.index].filter}</span>
      </div>}
      { !properties.extraFilters[properties.index].filter && (<SelectLoader 
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
          />)}

      
      {properties.extraFilters[properties.index].filter && 
      (
        <SelectLoader
          placeholder={shortName(properties.extraFilters[properties.index].value)}//{selectedValue}
          sparql={configureQuery(searchObject, {
            predicate: properties.extraFilters[properties.index].filter //selectedPredicate
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
          //properties.handleDelete(properties.extraFilters[properties.index]);
          const newFilters = properties.handleDelete(properties.extraFilters[properties.index]);
          properties.setExtraFilters(newFilters);
        }}
      >
        <FontAwesomeIcon icon={faTimesCircle} size="1x" color="red" />
      </div>
    </div>
  );
}
