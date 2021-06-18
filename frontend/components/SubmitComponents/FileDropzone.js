import { faFolderOpen } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMemo } from 'react';
import { useDropzone } from 'react-dropzone';

import styles from '../../styles/submit.module.css';

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '3rem 0',
  borderWidth: 2,
  borderRadius: 2,
  borderColor: '#00A1E4',
  borderStyle: 'dashed',
  backgroundColor: '#fafafa',
  outline: 'none',
  transition: 'border .24s ease-in-out'
};

const activeStyle = {
  borderColor: '#00A1E4'
};

const acceptStyle = {
  borderColor: '#00e676'
};

const rejectStyle = {
  borderColor: '#000'
};

export default function FileDropzone() {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({ accept: '.xml' });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {})
    }),
    [isDragActive, isDragReject, isDragAccept]
  );

  return (
    <div className={styles.dropzonecontainer}>
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <div className={styles.dropzoneinner}>
          <FontAwesomeIcon icon={faFolderOpen} color="#00A1E4" size="3x" />
          <h3 className={styles.dropzonedirection}>Drag file here to upload</h3>
          <span className={styles.dropzoneor}>or</span>
          <span className={styles.dropzonebrowsefiles}>Browse Files</span>
        </div>
      </div>
    </div>
  );
}
