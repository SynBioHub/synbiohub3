import Image from 'next/image';

import TopLevel from '../components/TopLevel';
import styles from '../styles/login.module.css';

function Register() {
  return (
    <div className={styles.container}>
      <div className={styles.frame}>
        <Image
          alt="logo"
          src="/images/logo_secondary.svg"
          width={80}
          height={80}
        />
      </div>
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
