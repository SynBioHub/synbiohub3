import styles from '../../styles/error.module.css';

export default function ErrorClearer() {
  return (
    <div className={styles.sideBySide}>
      <div className={styles.clearAllButton}>Clear All</div>
      <div className={styles.clearButton}>Clear Error</div>
    </div>
  );
} // Compare this snippet from components/Error/Error.js:
