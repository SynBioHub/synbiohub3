import Loader from 'react-loader-spinner';
import { useSelector } from 'react-redux';

import styles from '../../../styles/modal.module.css';

export default function DownloadStatus() {
  const showDownloadStatus = useSelector(
    state => state.download.showDownloadStatus
  );
  const downloadStatus = useSelector(state => state.download.downloadStatus);
  const downloadList = useSelector(state => state.download.downloadList);
  if (showDownloadStatus)
    return (
      <div className={styles.downloadstatuscontainer}>
        <Loader
          height={30}
          width={20}
          color="#fff"
          type="Oval"
          className={styles.downloadstatusanimation}
        />
        <div className={styles.downloadmsg}>
          {downloadStatus} {downloadList.length} Files
        </div>
      </div>
    );
  return null;
}
