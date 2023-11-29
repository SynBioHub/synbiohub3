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
  const [hidden, setHidden] = useState(false);
  const [showResults, setShowResults] = useState(true);

  useEffect(() => {
    const newFilters = [...properties.extraFilters];
    newFilters[properties.index] = {
      filter: selectedPredicate,
      value: selectedPredicate ? selectedValue : ""
    };
    properties.setExtraFilters(newFilters);
  }, [selectedPredicate, selectedValue, properties.index]);

  if (hidden) return null;
  // console.log("AdditionalFilter_predicates", properties.predicates);
  // console.log("AdditionalFilter_selectedValue", selectedValue);
  console.log("filter: ", properties.extraFilters[0].filter);
  console.log("index", properties.index);
  return (
    <div className={styles.inputsection}>
      {showResults && (<SelectLoader
            result={properties.predicates}
            placeholder={selectedValue}//"Select filter type..."
            parseResult={result => {
              return {
                value: result.predicate.value,
                label: shortName(result.predicate.value)
              };
            }}
            onChange={option => {
              setSelectedPredicate(option ? option.label : "");//undefined
            }}
          />)}
      
      {!showResults && 
        <div className={styles.labelsection}>
          <span>{properties.extraFilters[properties.index].filter}</span>
        </div>}
      
      {selectedPredicate && (
        <SelectLoader
          placeholder={selectedValue}
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
            setShowResults(false);
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
