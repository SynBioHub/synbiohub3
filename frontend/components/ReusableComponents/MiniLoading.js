import Loader from 'react-loader-spinner';

import styles from '../../styles/defaulttable.module.css';

export default function MiniLoading(properties) {
  return (
    <div className={styles.loadercontainer}>
      <div className={styles.loaderanimationmini}>
        <Loader
          color="#D25627"
          type="ThreeDots"
          height={properties.height}
          width={properties.width}
        />
      </div>
    </div>
  );
}
