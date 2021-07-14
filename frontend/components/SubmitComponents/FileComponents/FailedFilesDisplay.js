import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import styles from '../../../styles/attachmentupload.module.css';
import FileUploadDisplay from './FileUploadDisplay';

export default function FailedFilesDisplay() {
  const failedFiles = useSelector(state => state.submit.failedFiles);
  const submitting = useSelector(state => state.submit.submitting);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [allFilesChecked, setAllFilesChecked] = useState(true);

  useEffect(() => {
    setAllFilesChecked(
      failedFiles.length === Object.keys(selectedFiles).length
    );
  }, [selectedFiles]);

  useEffect(() => {
    checkAllFiles(setSelectedFiles, failedFiles);
  }, [failedFiles]);

  const failedFilesDisplay = failedFiles.map(file => (
    <FileUploadDisplay
      key={file.name}
      file={file}
      checkable={!submitting}
      selectedFiles={selectedFiles}
      setSelectedFiles={setSelectedFiles}
    />
  ));

  if (failedFiles.length === 0) return null;
  return (
    <div>
      <div className={styles.selectallcontainer}>
        <input
          type="checkbox"
          checked={allFilesChecked}
          onChange={() => {
            if (allFilesChecked) setSelectedFiles({});
            else checkAllFiles(setSelectedFiles, failedFiles);
          }}
        />
        <div className={styles.selectallinstruction}>Select All</div>
      </div>

      {failedFilesDisplay}
    </div>
  );
}

const checkAllFiles = (setSelectedFiles, failedFiles) => {
  const initialSelectedFiles = {};
  for (const file of failedFiles) {
    initialSelectedFiles[file.name] = file;
  }
  setSelectedFiles(initialSelectedFiles);
};
