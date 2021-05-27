import { useDispatch } from 'react-redux';

import { logoutUser } from '../../redux/actions';
import styles from '../../styles/navbar.module.css';

export default function ProfileMenu() {
  const dispatch = useDispatch();
  return (
    <div className={styles.profilemenu}>
      <div className={styles.menuoption}>Profile</div>
      <div className={styles.menuoption}>Admin</div>
      <div
        className={styles.menuoption}
        role="button"
        onClick={() => dispatch(logoutUser())}
      >
        Sign Out
      </div>
    </div>
  );
}
