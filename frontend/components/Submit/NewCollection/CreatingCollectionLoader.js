import Loader from 'react-loader-spinner';

import styles from '../../../styles/submit.module.css';

export default function CreatingCollectionLoader() {
  return (
    <div className={styles.creatingcollectionloadercontainer}>
      <Loader color="#00A1E4" height={150} type="ThreeDots" width={150} />
    </div>
  );
}
