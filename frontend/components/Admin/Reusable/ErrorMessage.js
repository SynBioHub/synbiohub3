import styles from '../../../styles/admin.module.css';

export default function ErrorMessage(properties) {
  return <div className={styles.error}>{properties.message}</div>;
}
