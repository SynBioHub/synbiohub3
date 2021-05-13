import Head from 'next/head';
import Navbar from './Navbar';
import Footer from './Footer';
import SearchPanel from './SearchPanel';

import styles from '../styles/layout.module.css';

export default function TopLevel(props) {
  return (
    <div>
      <Head>
        <title>SynBioHub</title>

        <link
          href="/favicon.ico"
          rel="icon"
        />
      </Head>

      <Navbar />

      <div className={styles.container}>
        <div className={styles.content}>
          {props.children}
        </div>
        <Footer />
        <SearchPanel />
      </div>

    </div>
  );
}
