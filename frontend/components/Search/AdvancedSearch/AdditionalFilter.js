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
      value: selectedPredicate ? selectedValue : "",
      id: properties.index
    };
    properties.setExtraFilters(newFilters);
  }, [selectedPredicate, selectedValue, properties.index]);

  if (hidden) return null;
  // console.log("AdditionalFilter_predicates", properties.predicates);
  // console.log("AdditionalFilter_selectedValue", selectedValue);
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
          // const newFilters = [...properties.extraFilters];
          // newFilters[properties.index] = {
          //   filter: selectedPredicate,
          //   value: undefined
          // };
          //console.log("properties.extraFilters: ", properties.extraFilters);
          //console.log("selectedPredicate: ", selectedPredicate)
          //properties.extraFilters.map(extraFilter => console.log("map_index: ", extraFilter.id));
          console.log("newFilters 0: ", properties.extraFilters);
          properties.handleDelete(0);//properties.index
          //const newFilters = properties.handelDet
          console.log("newFilters 1: ", properties.extraFilters);
          setHidden(true);
        }}
      >
        <FontAwesomeIcon icon={faTimesCircle} size="1x" color="red" />
      </div>
    </div>
  );
}
