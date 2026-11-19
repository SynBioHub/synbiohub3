import Ask from '../components/Search/Ask/Ask';
import SearchHeader from '../components/Search/SearchHeader/SearchHeader';
import TopLevel from '../components/TopLevel';
import styles from '../styles/standardsearch.module.css';

/**
 * This page renders question answering (SBOLExplorer's /ask through
 * SynBioHub) for the /ask url
 */
export default function AskPage() {
  return (
    <TopLevel doNotTrack={true} hideFooter={true} publicPage={true}>
      <div className={styles.container}>
        <SearchHeader selected="Ask" />
        <Ask />
      </div>
    </TopLevel>
  );
}
