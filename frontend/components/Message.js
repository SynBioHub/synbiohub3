import styles from '../styles/message.module.css';

export default function Message(properties) {
  return (
    <div className={styles.container}>
      <div>{properties.message}</div>
      <div className={`${styles.button} ${styles.cancel}`}>Cancel</div>
      <div className={`${styles.button} ${styles.actionbutton}`}>
        {properties.buttontext}
      </div>
    </div>
  );
}
