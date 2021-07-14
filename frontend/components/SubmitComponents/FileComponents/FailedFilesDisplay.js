import { useSelector } from 'react-redux';

import FileUploadDisplay from './FileUploadDisplay';

export default function FailedFilesDisplay() {
  const failedFiles = useSelector(state => state.submit.failedFiles);
  const submitting = useSelector(state => state.submit.submitting);

  const failedFilesDisplay = failedFiles.map(file => (
    <FileUploadDisplay
      name={file.name}
      key={file.name}
      status={file.status}
      errors={file.errors}
      checkable={!submitting}
      checked={true}
    />
  ));

  if (failedFiles.length === 0) return null;
  return <div>{failedFilesDisplay}</div>;
}
