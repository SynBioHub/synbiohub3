import styles from '../styles/footer.module.css';

/**
 * This component renders the footer in sbh
 */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.firstline}>
        ©2018{' '}
        <a href="https://ncl.ac.uk/" target="_blank" rel="noreferrer">
          Newcastle University
        </a>
        ,{' '}
        <a href="https://www.utah.edu/" target="_blank" rel="noreferrer">
          University of Utah
        </a>
        , and collaborators
      </p>
      <p>
        <a href="https://wiki.synbiohub.org/" target="_blank" rel="noreferrer">
          About SynBioHub
        </a>
        {'  ·  '}
        <a
          href="https://github.com/SynBioHub/synbiohub3"
          target="_blank"
          rel="noreferrer"
        >
          View Source on Github
        </a>
        {'  ·  '}
        <a
          href="https://github.com/SynBioHub/synbiohub3/issues"
          target="_blank"
          rel="noreferrer"
        >
          Report an Issue
        </a>
      </p>
    </footer>
  );
}
