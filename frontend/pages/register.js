import TopLevel from '../components/TopLevel';
import styles from '../styles/login.module.css';

function Register() {
  return (
    <div className={styles.container}>
      <div className={styles.frame}></div>
    </div>
  );
}

export default function RegisterWrapped() {
  return (
    <TopLevel publicPage={true}>
      <Register />
    </TopLevel>
  );
}
