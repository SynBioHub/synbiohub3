import { useDispatch } from 'react-redux';
import TopLevel from '../components/TopLevel';
import Card from '../components/HomeComponents/Card';

import styles from '../styles/home.module.css';
import { markPageVisited } from '../redux/actions';

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
          Welcome to
          {' '}
          <a
            href="https://wiki.synbiohub.org/"
            rel="noreferrer"
            target="_blank"
          >
            SynBioHub
          </a>
        </h1>

        <p className={styles.description}>
          SynBioHub is a design repository for people designing biological constructs.
          It enables DNA and protein designs to be uploaded, then facilitates sharing and viewing of such designs.
          SynBioHub also facilitates searching for information about existing useful parts and designs by combining data from a variety of sources.
        </p>

        <div className={styles.grid}>
          <Card description="Browse SynBioHub for useful parts and designs" 
          icon="/images/search_black.svg" title="Search"
          />

          <Card
            description="Upload your parts and designs for safekeeping"
            icon="/images/submit.svg"
            iconheight="1.5rem"
            iconoffset="-20%"
            iconright="0.75rem"
            title="Submit A Design"
          />

          <Card
            description="Prepare designs for publication or collaboration"
            icon="/images/submissions.svg"
            iconheight="1.7rem"
            iconoffset="-35%"
            iconright="0.75rem"
            title="Manage Submissions"
          />

          <Card
            description="View parts and designs that have been shared with me"
            icon="/images/shared_black.svg"
            iconheight="1.6rem"
            iconoffset="-33%"
            iconright="0.6rem"
            title="Collaborate"
          />
        </div>
      </main>
    </div>
  );
}

export default function HomeWrapped() {
  return <TopLevel><Home /></TopLevel>;
}
