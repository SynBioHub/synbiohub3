import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import styles from '../../../styles/submit.module.css';
import MajorLabel from '../ReusableComponents/MajorLabel';
import AttachmentsUploadingDisplay from './AttachmentsUploadingDisplay';
import FailedFilesDisplay from './FailedFilesDisplay';
import FileUploadDisplay from './FileUploadDisplay';

export default function FilesUploading(properties) {
  const filesUploading = useSelector(state => state.submit.filesUploading);
  const [filesUploadingDisplay, setFilesUploadingDisplay] = useState(
    createFileDisplay(filesUploading)
  );

  useEffect(() => {
    setFilesUploadingDisplay(createFileDisplay(filesUploading));
  }, [filesUploading]);

  return (
    <div className={styles.selectedfilescontainer}>
      <FailedFilesDisplay selectedCollection={properties.selectedCollection} />
      <AttachmentsUploadingDisplay />
      {filesUploading.length > 0 && (
        <MajorLabel
          text="Design Files"
          link="https://wiki.synbiohub.org/userdocumentation/managingsubmitting/"
        />
      )}
      <div className={styles.designfilescontainer}>{filesUploadingDisplay}</div>
    </div>
  );
}

const createFileDisplay = files => {
  return files.map(file => (
    <FileUploadDisplay file={file} checkable={false} key={file.name} />
  ));
};
