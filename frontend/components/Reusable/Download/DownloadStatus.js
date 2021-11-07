import {
  faChevronDown,
  faChevronRight,
  faCloudDownloadAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { toggleShowDownload } from '../../../redux/actions';
import styles from '../../../styles/modal.module.css';
import FileDownloadDisplay from './FileDownloadDisplay';

const downloadStatus = 'downloading';

export default function DownloadStatus() {
  const showDownloadStatus = useSelector(
    state => state.download.showDownloadStatus
  );
  // const downloadStatus = useSelector(state => state.download.downloadStatus);
  const downloadList = useSelector(state => state.download.downloadList);
  const downloadOpen = useSelector(state => state.download.downloadOpen);
  const [filesDownloadingDisplay, setFilesDownloadingDisplay] = useState(
    createFileDisplay(downloadList)
  );

  const dispatch = useDispatch();

  const [downloadNumber, setDownloadNumber] = useState(downloadList.length);
  const [height, setHeight] = useState({});

  useEffect(() => {
    if (downloadOpen) setHeight({ height: '40%' });
    else setHeight({ height: '3rem' });
  }, [downloadOpen]);

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
          onClick={() => dispatch(toggleShowDownload())}
          role="button"
        >
          <div>
            <FontAwesomeIcon icon={faCloudDownloadAlt} size="1x" />
            {downloadNumber !== 0
              ? ` Downloading ${downloadNumber} files...`
              : ' Download finished, zipping'}
          </div>
          <div>
            <FontAwesomeIcon
              icon={downloadOpen ? faChevronDown : faChevronRight}
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
  return files.map(file => <FileDownloadDisplay file={file} key={file.name} />);
};
