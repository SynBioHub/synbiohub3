import styles from '../../styles/navbar.module.css';

export default function ProfileMenu() {
  return (
    <div className={styles.profilemenu}>
      <div className={styles.menuoption}>Profile</div>
      <div className={styles.menuoption}>Admin</div>
      <div className={styles.menuoption}>Sign Out</div>
    </div>
  );
}
