import styles from '../styles/footer.module.css';

/**
 * This component renders the footer in sbh
 */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.firstline}>
        ©2018
        {' '}
        <a href="https://ncl.ac.uk/">Newcastle University</a>
        ,
        {' '}
        <a href="https://www.utah.edu/">University of Utah</a>
        , and collaborators
      </p>
      <p>
        <a href="https://wiki.synbiohub.org/">About SynBioHub</a>
        {' | '}
        <a href="https://github.com/SynBioHub/synbiohub3">View Source on Github</a>
        {' | '}
        <a href="https://github.com/SynBioHub/synbiohub3/issues">Report an Issue</a>
      </p>
    </footer>
  );
}
