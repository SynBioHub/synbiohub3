import Head from 'next/head';

import styles from '../styles/layout.module.css';
import Footer from './Footer';
import Navbar from './Navbar';
import SearchPanel from './SearchPanel';

/**
 * This is a 'wrapper component' which dictates the general structure
 * of sbh. It should be used as a wrapper for all sbh pages, except in
 * rare and special circumstances.
 */
export default function TopLevel(properties) {
  return (
    <div>
      <Head>
        <title>SynBioHub</title>

        <link href="/favicon.ico" rel="icon" />
      </Head>

      <div className={styles.container}>
        <Navbar />
        <div className={styles.content}>{properties.children}</div>
        <Footer />
        <SearchPanel />
      </div>
    </div>
  );
}
