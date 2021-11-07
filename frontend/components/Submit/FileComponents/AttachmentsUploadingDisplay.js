import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import styles from '../../../styles/submit.module.css';
import MajorLabel from '../ReusableComponents/MajorLabel';
import FileUploadDisplay from './FileUploadDisplay';

export default function AttachmentsUploading() {
  const attachmentsUploading = useSelector(
    state => state.submit.attachmentsUploading
  );
  const [attachmentsUploadingDisplay, setAttachmentsUploadingDisplay] =
    useState(createFileDisplay(attachmentsUploading));

  useEffect(() => {
    setAttachmentsUploadingDisplay(createFileDisplay(attachmentsUploading));
  }, [attachmentsUploading]);

  if (attachmentsUploading.length === 0) return null;
  return (
    <div className={styles.selectedfilescontainer}>
      <MajorLabel
        text="Collection Attachments"
        link="https://wiki.synbiohub.org/userdocumentation/viewinganddownloadinginformation/#212-viewing-a-collection"
      />
      <div className={styles.designfilescontainer}>
        {attachmentsUploadingDisplay}
      </div>
    </div>
  );
}

const createFileDisplay = files => {
  return files.map(file => (
    <FileUploadDisplay
      file={file}
      checkable={false}
      key={file.name}
      isAttachment={true}
    />
  ));
};
