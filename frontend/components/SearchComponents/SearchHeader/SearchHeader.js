import React from 'react';

import styles from '../../../styles/searchheader.module.css';
import Basket from '../../Basket';
import SearchTypeButton from './SearchTypeButton';

export default function SearchHeader(properties) {
  return (
    <React.Fragment>
      <div className={styles.categories}>
        <SearchTypeButton
          name="Standard Search"
          route="search"
          selected={properties.selected}
        />

        <SearchTypeButton
          name="Sequence Search"
          route="sequence-search"
          selected={properties.selected}
        />

        <SearchTypeButton
          name="Advanced Search"
          route="advanced-search"
          selected={properties.selected}
        />

        <SearchTypeButton
          name="SPARQL"
          route="sparql"
          selected={properties.selected}
        />
      </div>
      <Basket />
    </React.Fragment>
  );
}
