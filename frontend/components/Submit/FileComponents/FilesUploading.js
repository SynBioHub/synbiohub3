import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import styles from '../../../styles/submit.module.css';
import MajorLabel from '../ReusableComponents/MajorLabel';
import AttachmentsUploadingDisplay from './AttachmentsUploadingDisplay';
import FailedFilesDisplay from './FailedFilesDisplay';
import FileUploadDisplay from './FileUploadDisplay';
import React from 'react';
import ConfigureModal from '../../Viewing/Modals/ConfigureModal';

export default function FilesUploading() {
  const filesUploading = useSelector(state => state.submit.filesUploading);
  const [filesUploadingDisplay, setFilesUploadingDisplay] = useState(
    createFileDisplay(filesUploading)
  );
  const [modal, setModal] = useState();
  const [selectedFiles, setSelectedFiles] = useState({});

  useEffect(() => {
    setFilesUploadingDisplay(createFileDisplay(filesUploading));
  }, [filesUploading]);

  return (
    <React.Fragment>
      {modal === 'configure' ?
        (
          <ConfigureModal
            setModal={setModal}
            files={Object.values(selectedFiles).map(file => file.file)}
            overwriteCollection={false}
            failed={true}

          />
        )
      : null}
      <div className={styles.selectedfilescontainer}>
        <FailedFilesDisplay setModal={setModal} selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} />
        <AttachmentsUploadingDisplay />
        {filesUploading.length > 0 && (
          <MajorLabel
            text="Design Files"
            link="https://wiki2.synbiohub.org/2_micro_guides/submitting%2C_managing_and_updating_submissions/"
          />
        )}
        <div className={styles.designfilescontainer}>{filesUploadingDisplay}</div>
      </div>
    </React.Fragment>
  );
}

const createFileDisplay = files => {
  return files.map(file => (
    <FileUploadDisplay file={file} checkable={false} key={file.name} />
  ));
};
