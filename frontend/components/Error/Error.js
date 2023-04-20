import styles from '../../styles/error.module.css';

/**
 * Error Component for displaying error messages
 * @param {*} param0
 * @returns
 */
export default function Error({ error }) {
  let responseData = '';
  if (error.response) {
    try {
      responseData = JSON.stringify(error.response.data);
    } catch (error) {
      responseData = 'Unable to parse response data';
    }
  }
  return (
    <div className={styles.errorInfoContainer}>
      <div className={styles.customMessage}>{error.customMessage}</div>
      <div className={styles.fullUrl}>{error.fullUrl}</div>
      <h2 className={styles.errorInformationHeader}>Error Information:</h2>
      <h4>Name</h4>
      <p>{error.name}</p>
      <h4>Message</h4>
      <p>{error.message}</p>
      <h4>Response Data</h4>
      <p>{responseData}</p>
      <h4>Stack</h4>
      <p>{error.stack}</p>
    </div>
  );
}
