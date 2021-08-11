import { useDispatch, useSelector } from 'react-redux';

import NavbarSearch from '../components/SearchComponents/NavbarSearch/NavbarSearch';
import SearchHeader from '../components/SearchComponents/SearchHeader/SearchHeader';
import StandardSearch from '../components/SearchComponents/StandardSearch/StandardSearch';
import TopLevel from '../components/TopLevel';
import { setOffset, setSearchQuery } from '../redux/actions';
import styles from '../styles/standardsearch.module.css';

/**
 * This page renders the default search for the /search url
 */
export default function SearchDefault() {
  const query = useSelector(state => state.search.query);
  const dispatch = useDispatch();
  return (
    <TopLevel
      doNotTrack={true}
      navbar={
        <NavbarSearch
          value={query}
          placeholder="Search SynBioHub"
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
        <SearchHeader selected="Standard Search" />
        <StandardSearch />
      </div>
    </TopLevel>
  );
}
