import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import SearchHeader from '../../components/SearchComponents/SearchHeader/SearchHeader';
import StandardSearch from '../../components/SearchComponents/StandardSearch/StandardSearch';
import TopLevel from '../../components/TopLevel';
import { setOffset, setSearchQuery } from '../../redux/actions';
import styles from '../../styles/standardsearch.module.css';

/**
 * This component renders searching options, as well as the search results,
 * for all different search types (standard, sequence, etc). It allows users to
 * select which type of search they'd like to conduct. This panel is overlayed upon
 * the current sbh content
 */
export default function StandardSearchPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { query, offset, limit } = router.query;
  useEffect(() => {
    if (query) {
      dispatch(setSearchQuery(query));
    }
    if (offset) {
      dispatch(setOffset(Number.parseInt(offset)));
    } else dispatch(setOffset(0));
  }, [query, offset, limit]);
  return (
    <TopLevel searchMode={true} hideFooter={true}>
      <div className={styles.container}>
        <SearchHeader selected="Standard Search" />
        <StandardSearch />
      </div>
    </TopLevel>
  );
}
