import { faFile, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';

import styles from '../../../styles/submit.module.css';

export default function SelectedFileView(properties) {
  const [fileDisplay, setFileDisplay] = useState(null);
  useEffect(() => {
    if (properties.files.length > 0) {
      setFileDisplay(
        properties.files.map(file => {
          return (
            <SelectedFile
              key={file.path}
              file={file}
              setFiles={properties.setFiles}
              files={properties.files}
            />
          );
        })
      );
    } else setFileDisplay(null);
  }, [properties.files]);
  return (
    <div>
      <div
        className={`${styles.selectedfilescontainer} ${styles.concatenatefiles}`}
      >
        {fileDisplay}
      </div>
      {properties.files.length > 0 ? (
        <div className={styles.clearfilesbuttoncontainer}>
          <div
            className={styles.clearfilesbutton}
            role="button"
            onClick={() => properties.setFiles([])}
          >
            <FontAwesomeIcon icon={faTrashAlt} size="1x" color="#D25627" />
          </div>
          <div className={styles.clearfilesbuttonlabel}>Clear All</div>
        </div>
      ) : null}
    </div>
  );
}

export function SelectedFile(properties) {
  return (
    <div className={styles.selectedfilecontainer}>
      <div>
        <FontAwesomeIcon icon={faFile} size="1x" color="#A99C0F" />
        <span className={styles.filename}>{properties.file.name}</span>
      </div>
      <FontAwesomeIcon
        icon={faTrashAlt}
        size="1x"
        color="#00A1E4"
        className={styles.enlargeicononhover}
        role="button"
        onClick={() => {
          properties.setFiles([
            ...properties.files.filter(file => {
              return !Object.is(file, properties.file);
            })
          ]);
        }}
      />
    </div>
  );
}
