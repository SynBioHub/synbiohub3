import { useSelector } from 'react-redux';

import styles from '../../../styles/submit.module.css';
import FileUploadDisplay from './FileUploadDisplay';

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
