import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import FileUploadDisplay from './FileUploadDisplay';

export default function FailedFilesDisplay() {
  const failedFiles = useSelector(state => state.submit.failedFiles);
  const submitting = useSelector(state => state.submit.submitting);
  const [selectedFiles, setSelectedFiles] = useState({});

  useEffect(() => {
    const initialSelectedFiles = {};
    for (const file of failedFiles) {
      initialSelectedFiles[file.name] = file;
    }
    setSelectedFiles(initialSelectedFiles);
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
  return <div>{failedFilesDisplay}</div>;
}
