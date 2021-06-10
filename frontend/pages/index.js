import {
  faAlignLeft,
  faCloudUploadAlt,
  faSearch,
  faShareAlt
} from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';

import Card from '../components/HomeComponents/Card';
import TopLevel from '../components/TopLevel';
import { markPageVisited } from '../redux/actions';
import styles from '../styles/home.module.css';

/**
 * This page renders the home/landing page for sbh.
 */
function Home() {
  const dispatch = useDispatch();
  dispatch(markPageVisited(true));
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to{' '}
          <a
            href="https://wiki.synbiohub.org/"
            rel="noreferrer"
            target="_blank"
          >
            SynBioHub
          </a>
        </h1>

        <p className={styles.description}>
          SynBioHub is a design repository for people designing biological
          constructs. It enables DNA and protein designs to be uploaded, then
          facilitates sharing and viewing of such designs. SynBioHub also
          facilitates searching for information about existing useful parts and
          designs by combining data from a variety of sources.
        </p>

        <div className={styles.grid}>
          <Card
            description="Browse SynBioHub for useful parts and designs"
            icon={faSearch}
            title="Search"
            route={'/search'}
          />

          <Card
            description="Upload your parts and designs for safekeeping"
            icon={faCloudUploadAlt}
            title="Submit A Design"
            route={'/submit'}
          />

          <Card
            description="Prepare designs for publication or collaboration"
            icon={faAlignLeft}
            title="Manage Submissions"
            route={'/manage'}
          />

          <Card
            description="View parts and designs that have been shared with me"
            icon={faShareAlt}
            title="Collaborate"
            route={'/shared'}
          />
        </div>
      </main>
    </div>
  );
}

export default function HomeWrapped() {
  return (
    <TopLevel>
      <Home />
    </TopLevel>
  );
}
