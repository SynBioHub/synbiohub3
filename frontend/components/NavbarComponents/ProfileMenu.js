import {
  faCogs,
  faSignOutAlt,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';

import { logoutUser } from '../../redux/actions';
import styles from '../../styles/navbar.module.css';

export default function ProfileMenu() {
  const dispatch = useDispatch();
  const router = useRouter();
  const username = useSelector(state => state.user.username);
  const isAdmin = useSelector(state => state.user.isAdmin);
  return (
    <div className={styles.profilemenu}>
      <div className={styles.userinfo}>
        <p className={styles.userinfointro}>Signed in as</p>
        {username}
      </div>
      <Link href="/profile">
        <a>
          <div className={styles.menuoption}>
            <div className={styles.profilemenuicon}>
              <FontAwesomeIcon icon={faUser} size="1x" />
            </div>
            Profile
          </div>
        </a>
      </Link>
      {isAdmin && <Link href="/admin/status">
        <a>
          <div className={styles.menuoption}>
            <div className={styles.profilemenuicon}>
              <FontAwesomeIcon icon={faCogs} size="1x" />
            </div>
            Admin
          </div>
        </a>
      </Link>}
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
