import Loader from 'react-loader-spinner';

import styles from '../../styles/defaulttable.module.css';

export default function Loading() {
  return (
    <div className={styles.loadercontainer}>
      <div className={styles.loaderanimation}>
        <Loader color="#D25627" type="ThreeDots" />
      </div>
    </div>
  );
}
