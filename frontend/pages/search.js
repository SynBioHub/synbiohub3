import NavbarSearch from '../components/SearchComponents/NavbarSearch/NavbarSearch';
import SearchHeader from '../components/SearchComponents/SearchHeader/SearchHeader';
import StandardSearch from '../components/SearchComponents/StandardSearch/StandardSearch';
import TopLevel from '../components/TopLevel';
import styles from '../styles/standardsearch.module.css';

/**
 * This page renders the default search for the /search url
 */
export default function SearchDefault() {
  return (
    <TopLevel navbar={<NavbarSearch />} hideFooter={true}>
      <div className={styles.container}>
        <SearchHeader selected="Standard Search" />
        <StandardSearch />
      </div>
    </TopLevel>
  );
}
