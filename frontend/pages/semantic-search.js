import { useDispatch, useSelector } from 'react-redux';

import NavbarSearch from '../components/Search/NavbarSearch/NavbarSearch';
import SearchHeader from '../components/Search/SearchHeader/SearchHeader';
import SemanticSearch from '../components/Search/SemanticSearch/SemanticSearch';
import TopLevel from '../components/TopLevel';
import { setOffset, setSearchQuery } from '../redux/actions';
import styles from '../styles/standardsearch.module.css';

/**
 * This page renders search by meaning (SBOLExplorer's /vector_search) for the
 * /semantic-search url
 */
export default function SemanticSearchPage() {
  const query = useSelector(state => state.search.query);
  const dispatch = useDispatch();
  return (
    <TopLevel
      doNotTrack={true}
      navbar={
        <NavbarSearch
          value={query}
          placeholder="Search by meaning"
          onChange={event => {
            dispatch(setSearchQuery(event.target.value));
            dispatch(setOffset(0));
          }}
        />
      }
      hideFooter={true}
      publicPage={true}
    >
      <div className={styles.container}>
        <SearchHeader selected="Semantic Search" />
        <SemanticSearch />
      </div>
    </TopLevel>
  );
}
