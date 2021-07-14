import {
  faCheckCircle,
  faExclamationTriangle,
  faFile
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';

import styles from '../../../styles/submit.module.css';

export default function FileUploadDisplay(properties) {
  const [icon, setIcon] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const [checked, setChecked] = useState(true);
  useEffect(() => {
    switch (properties.file.status) {
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

  useEffect(() => {
    if (properties.checkable) {
      setChecked(properties.selectedFiles[properties.file.name] ? true : false);
    }
  }, [properties.selectedFiles, properties.file, properties.checkable]);

  return (
    <div className={styles.fileuploadingcontainer}>
      {properties.checkable && (
        <div className={styles.attachmentcheckbox}>
          <input
            type="checkbox"
            checked={checked}
            onChange={() => {
              const newSelectedFiles = { ...properties.selectedFiles };
              if (checked) delete newSelectedFiles[properties.file.name];
              else newSelectedFiles[properties.file.name] = properties.file;
              properties.setSelectedFiles(newSelectedFiles);
            }}
          />
        </div>
      )}
      <div className={styles.fileinfocontainer}>
        <div className={styles.selectedfilecontainer}>
          <div>
            <FontAwesomeIcon icon={faFile} size="1x" color="#A99C0F" />
            <span className={styles.filename}>{properties.file.name}</span>
          </div>
          {icon}
        </div>
        {showErrors && (
          <div className={styles.errormessagecontainer}>
            <div className={styles.errormessage}>
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                size="1x"
                color="#D25627"
                className={styles.errormessageicon}
              />
              {properties.file.errors}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
