import {
  faChevronDown,
  faChevronRight,
  faCloudDownloadAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import styles from '../../../styles/modal.module.css';
import FileDownloadDisplay from './FileDownloadDisplay';

const downloadStatus = 'downloading';

export default function DownloadStatus() {
  const showDownloadStatus = useSelector(
    state => state.download.showDownloadStatus
  );
  // const downloadStatus = useSelector(state => state.download.downloadStatus);
  const downloadList = useSelector(state => state.download.downloadList);
  const [filesDownloadingDisplay, setFilesDownloadingDisplay] = useState(
    createFileDisplay(downloadList)
  );

  const [downloadNumber, setDownloadNumber] = useState(downloadList.length);
  const [open, setOpen] = useState(true);
  const [height, setHeight] = useState({});

  useEffect(() => {
    if (open) setHeight({ height: '40%' });
    else setHeight({ height: '3rem' });
  });

  useEffect(() => {
    let newDownloadNumber = downloadList.length;
    for (const file of downloadList) {
      if (file.status !== downloadStatus) newDownloadNumber--;
    }
    setFilesDownloadingDisplay(createFileDisplay(downloadList));
    setDownloadNumber(newDownloadNumber);
  }, [downloadList]);

  if (showDownloadStatus)
    return (
      <div className={styles.downloadstatuscontainer} style={height}>
        <div
          className={styles.downloadheader}
          onClick={() => setOpen(!open)}
          role="button"
        >
          <div>
            <FontAwesomeIcon icon={faCloudDownloadAlt} size="1x" />
            {downloadNumber !== 0
              ? ` Downloading ${downloadNumber} files...`
              : ' Download finished'}
          </div>
          <div>
            <FontAwesomeIcon
              icon={open ? faChevronDown : faChevronRight}
              size="1x"
            />
          </div>
        </div>
        <div className={styles.downloadmsg}>{filesDownloadingDisplay}</div>
      </div>
    );
  return null;
}

const createFileDisplay = files => {
  files = files.sort((file1, file2) => {
    if (file1.status === downloadStatus) return -1;
    else if (file2.status === downloadStatus) return 1;
    return 0;
  });
  return files.map(file => <FileDownloadDisplay file={file} key={file.name} />);
};
