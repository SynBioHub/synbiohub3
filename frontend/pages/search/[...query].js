import { useEffect, useState } from 'react';

import SearchHeader from '../../components/SearchComponents/SearchHeader/SearchHeader';
import StandardSearch from '../../components/SearchComponents/StandardSearch/StandardSearch';
import TopLevel from '../../components/TopLevel';
import styles from '../../styles/standardsearch.module.css';

/**
 * This component renders searching options, as well as the search results,
 * for all different search types (standard, sequence, etc). It allows users to
 * select which type of search they'd like to conduct. This panel is overlayed upon
 * the current sbh content
 */
export default function StandardSearchPage() {
  const [show, setShow] = useState('');

  useEffect(() => {
    setShow(styles.show);
  }, [setShow]);

  return (
    <TopLevel searchMode={true} hideFooter={true}>
      <div className={`${styles.container} ${show}`}>
        <SearchHeader selected="Standard Search" />
        <StandardSearch />
      </div>
    </TopLevel>
  );
}
