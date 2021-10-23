import {
  faBoxOpen,
  faDatabase,
  faDna,
  faHatWizard,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import React from 'react';

import styles from '../../../styles/searchheader.module.css';
import Basket from '../../Basket/Basket';
import SearchTypeButton from '../../ReusableComponents/SelectorButton';

export default function SearchHeader(properties) {
  return (
    <React.Fragment>
      <div className={styles.categories}>
        <SearchTypeButton
          name="Standard Search"
          route="search"
          selected={properties.selected}
          icon={faSearch}
        />

        <SearchTypeButton
          name="Root Collections"
          route="root-collections"
          selected={properties.selected}
          icon={faBoxOpen}
        />

        <SearchTypeButton
          name="Sequence Search"
          route="sequence-search"
          selected={properties.selected}
          icon={faDna}
        />

        <SearchTypeButton
          name="Advanced Search"
          route="advancedSearch"
          external={true}
          selected={properties.selected}
          icon={faHatWizard}
        />

        <SearchTypeButton
          name="SPARQL"
          route="sparql"
          external={true}
          selected={properties.selected}
          icon={faDatabase}
        />
      </div>
      <Basket />
    </React.Fragment>
  );
}
