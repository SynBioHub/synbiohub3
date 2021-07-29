import {
  faCogs,
  faSignOutAlt,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';

import { logoutUser } from '../../redux/actions';
import styles from '../../styles/navbar.module.css';

export default function ProfileMenu() {
  const dispatch = useDispatch();
  const router = useRouter();
  const username = useSelector(state => state.user.username);
  return (
    <div className={styles.profilemenu}>
      <div className={styles.userinfo}>
        <p className={styles.userinfointro}>Signed in as</p>
        {username}
      </div>
      <a href={`${process.env.backendUrl}/profile`}>
        <div className={styles.menuoption}>
          <div className={styles.profilemenuicon}>
            <FontAwesomeIcon icon={faUser} size="1x" />
          </div>
          Profile
        </div>
      </a>
      <a href={`${process.env.backendUrl}/admin`}>
        <div className={styles.menuoption}>
          <div className={styles.profilemenuicon}>
            <FontAwesomeIcon icon={faCogs} size="1x" />
          </div>
          Admin
        </div>
      </a>
      <div
        className={styles.menuoption}
        role="button"
        onClick={() => {
          dispatch(logoutUser());
          router.push('/');
        }}
      >
        <div className={styles.profilemenuicon}>
          <FontAwesomeIcon icon={faSignOutAlt} size="1x" />
        </div>
        Sign Out
      </div>
    </div>
  );
}
