import styles from '../../styles/error.module.css';

/**
 * Error Component for displaying error messages
 * @param {*} param0
 * @returns
 */
export default function Error({ error }) {
  return (
    <div className={styles.errorInfoContainer}>
      <div className={styles.customMessage}>{error.customMessage}</div>
      <div className={styles.fullUrl}>{error.fullUrl}</div>
      <h2 className={styles.errorInformationHeader}>Error Information:</h2>
      <h4>Name</h4>
      <p>{error.name}</p>
      <h4>Message</h4>
      <p>{error.message}</p>
      <h4>Stack</h4>
      <p>{error.stack}</p>
    </div>
  );
}
