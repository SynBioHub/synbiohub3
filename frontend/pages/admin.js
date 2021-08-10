import Menu from '../components/AdminComponents/Menu';
import TopLevel from '../components/TopLevel';
import styles from '../styles/admin.module.css';

function Admin() {
  return (
    <div className={styles.container}>
      <Menu />
      <div className={styles.content}></div>
    </div>
  );
}

export default function AdminWrapped() {
  return (
    <TopLevel>
      <Admin />
    </TopLevel>
  );
}
