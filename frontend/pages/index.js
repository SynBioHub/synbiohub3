import {
  faAlignLeft,
  faBoxOpen,
  faCloudUploadAlt,
  faSearch
} from '@fortawesome/free-solid-svg-icons';

import Card from '../components/Home/Card';
import TopLevel from '../components/TopLevel';
import styles from '../styles/home.module.css';
import getConfig from 'next/config';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../components/Admin/Theme.js'

import useSWR from 'swr';
const { publicRuntimeConfig } = getConfig();


/**
 * This page renders the home/landing page for sbh.
 */
function Home() {
  const dispatch = useDispatch(); // if you are using Redux, otherwise, you might not need this
  const { theme, loading } = useTheme(dispatch);
  const token = useSelector(state => state.user.token);

  if (loading) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          Loading...
        </main>
      </div>
    );
  }



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

        <p className={styles.description}>
          {theme && theme.frontPageText ? theme.frontPageText : "Default description if theme is not loaded"}
        </p>

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
