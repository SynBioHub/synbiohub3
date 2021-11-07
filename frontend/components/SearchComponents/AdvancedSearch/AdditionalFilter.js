import { useState } from 'react';

import { shortName } from '../../../namespace/namespace';
import configureQuery from '../../../sparql/configureQuery';
import searchObject from '../../../sparql/searchObject';
import styles from '../../../styles/advancedsearch.module.css';
import SelectLoader from './SelectLoader';

export default function AdditionalFilter(properties) {
  const [selectedPredicate, setSelectedPredicate] = useState();

  return (
    <div className={styles.inputsection}>
      <SelectLoader
        result={properties.predicates}
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
        />
      )}
    </div>
  );
}
