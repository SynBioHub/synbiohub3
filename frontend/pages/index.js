import {
  faAlignLeft,
  faBoxOpen,
  faCloudUploadAlt,
  faSearch
} from '@fortawesome/free-solid-svg-icons';

import Card from '../components/Home/Card';
import TopLevel from '../components/TopLevel';
import styles from '../styles/home.module.css';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';


/**
 * This page renders the home/landing page for sbh.
 */
function Home() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState({});
  const token = useSelector(state => state.user.token);

  useEffect(() => {
    // Simulate data fetching
    const fetchData = () => {
      setLoading(true);
      const themeData = JSON.parse(localStorage.getItem('theme')) || {};
      setTheme(themeData);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          Loading...
        </main>
      </div>
    );
  }

  const frontPageText = theme && theme.frontPageText ? theme.frontPageText : "SynBioHub is a design repository for people designing biological constructs. It enables DNA and protein designs to be uploaded, then facilitates sharing and viewing of such designs. SynBioHub also facilitates searching for information about existing useful parts and designs by combining data from a variety of sources.";

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
            SynBio<span className={styles.hubtitle}>Hub</span>
          </a>
        </h1>

        <p className={styles.description} dangerouslySetInnerHTML={createMarkup(frontPageText)} />

        <div className={styles.grid}>
          <Card
            description="Browse SynBioHub for useful parts and designs"
            icon={faSearch}
            title="Search"
            route={'/search'}
            redirect={false}
          />

          <Card
            description="Upload your parts and designs for safekeeping"
            icon={faCloudUploadAlt}
            title="Submit Designs"
            route={'/submit'}
            redirect={true}
          />

          <Card
            description="Prepare designs for publication or collaboration"
            icon={faAlignLeft}
            title="Manage Submissions"
            route={'/submissions'}
            redirect={true}
          />

          <Card
            description="View collections made available to the public"
            icon={faBoxOpen}
            title="View Collections"
            route={'/root-collections'}
            redirect={true}
          />
        </div>
      </main>
    </div>
  );
}

export default function HomeWrapped() {
  return (
    <TopLevel publicPage={true}>
      <Home />
    </TopLevel>
  );
}

const createMarkup = (text) => {
  // Replace newline characters with <br> tags
  return { __html: text.replace(/\n/g, '<br />') };
};
