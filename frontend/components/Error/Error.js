import styles from '../../styles/error.module.css';

/**
 * Error Component for displaying error messages
 * @param {*} param0
 * @returns
 */
export default function Error({ error }) {
  return (
    <div className={styles.errorInfoContainer}>
      <h1>{error.customMessage}</h1>
      <h1>{error.name}</h1>
      <h1>{error.message}</h1>
      <h1>{error.stack}</h1>
    </div>
  );
}
