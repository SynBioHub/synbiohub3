import { faFile, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';

import styles from '../../styles/submit.module.css';

export default function SelectedFileView(properties) {
  const [fileDisplay, setFileDisplay] = useState(null);
  useEffect(() => {
    if (properties.files.length > 0) {
      setFileDisplay(
        properties.files.map(file => {
          return <SelectedFile key={file.path} file={file} />;
        })
      );
    } else setFileDisplay(null);
  }, [properties.files]);
  return <div className={styles.selectedfilescontainer}>{fileDisplay}</div>;
}

export function SelectedFile(properties) {
  return (
    <div className={styles.selectedfilecontainer}>
      <div>
        <FontAwesomeIcon icon={faFile} size="1x" color="#00A1E4" />
        <span className={styles.filename}>{properties.file.name}</span>
      </div>
      <FontAwesomeIcon
        icon={faTrashAlt}
        size="1x"
        color="#D25627"
        className={styles.enlargeicononhover}
      />
    </div>
  );
}
