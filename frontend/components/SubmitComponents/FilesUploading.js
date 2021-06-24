import {
  faCheckCircle,
  faExclamationTriangle,
  faFile
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useSelector } from 'react-redux';

import styles from '../../styles/submit.module.css';

export default function FilesUploading() {
  const filesUploading = useSelector(state => state.submit.filesUploading);
  const filesUploadingDisplay = filesUploading.map(file => (
    <FileUploadDisplay
      name={file.name}
      key={file.name}
      status={file.status}
      errors={file.errors}
    />
  ));
  return (
    <div className={styles.selectedfilescontainer}>{filesUploadingDisplay}</div>
  );
}

function FileUploadDisplay(properties) {
  const [icon, setIcon] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  useEffect(() => {
    switch (properties.status) {
      case 'failed': {
        setIcon(
          <div
            className={styles.enlargeicononhover}
            role="button"
            onClick={() => setShowErrors(!showErrors)}
          >
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              size="1x"
              color="#D25627"
            />
          </div>
        );
        break;
      }
      case 'uploading': {
        setIcon(<Loader color="#00A1E4" type="Oval" height={15} width={15} />);
        break;
      }
      case 'successful': {
        setIcon(
          <FontAwesomeIcon icon={faCheckCircle} size="1x" color="#549F93" />
        );
        break;
      }
      default: {
        setIcon(null);
      }
    }
  }, [properties.status, showErrors]);
  return (
    <div>
      <div className={styles.selectedfilecontainer}>
        <div>
          <FontAwesomeIcon icon={faFile} size="1x" color="#A99C0F" />
          <span className={styles.filename}>{properties.name}</span>
        </div>
        {icon}
      </div>
      {showErrors && (
        <div className={styles.errormessage}>
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            size="1x"
            color="#D25627"
            className={styles.errormessageicon}
          />
          {properties.errors}
        </div>
      )}
    </div>
  );
}
