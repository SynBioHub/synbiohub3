import { useSelector } from 'react-redux';

import FileUploadDisplay from './FileUploadDisplay';

export default function AttachmentUploadDisplay() {
  const failedFiles = useSelector(state => state.submit.failedFiles);

  const failedFilesDisplay = createFileDisplay(failedFiles);

  if (failedFiles.length === 0) return null;
  return (
    <div>
      {failedFilesDisplay}
      <br />
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
