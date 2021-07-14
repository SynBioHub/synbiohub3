import { useSelector } from 'react-redux';

import styles from '../../../styles/submit.module.css';
import AttachmentUploadDisplay from './AttachmentUploadDisplay';
import FileUploadDisplay from './FileUploadDisplay';

export default function FilesUploading() {
  const filesUploading = useSelector(state => state.submit.filesUploading);

  const filesUploadingDisplay = createFileDisplay(filesUploading);

  return (
    <div className={styles.selectedfilescontainer}>
      <AttachmentUploadDisplay />
      {filesUploadingDisplay}
    </div>
  );
}

const createFileDisplay = files => {
  return files.map(file => (
    <FileUploadDisplay
      name={file.name}
      key={file.name}
      status={file.status}
      errors={file.errors}
    />
  ));
};
