import { faIdCard } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import InputField from '../components/LoginComponents/InputField';
import TopLevel from '../components/TopLevel';
import styles from '../styles/login.module.css';

function Profile() {
  return (
    <div className={styles.container}>
      <div className={styles.frame}>
        <FontAwesomeIcon
          icon={faIdCard}
          size="3x"
          color="#00A1E4"
          className={styles.registericon}
        />
        <h1 className={styles.header}>My Account</h1>
        <div className={styles.intro}>
          View and update details about yourself
        </div>
        <InputField />
      </div>
    </div>
  );
}

export default function ProfileWrapped() {
  return (
    <TopLevel>
      <Profile />
    </TopLevel>
  );
}
