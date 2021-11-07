import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { addAttachments } from '../../../redux/actions';
import styles from '../../../styles/attachmentupload.module.css';
import MajorLabel from '../ReusableComponents/MajorLabel';
import FileUploadDisplay from './FileUploadDisplay';

export default function FailedFilesDisplay() {
  const failedFiles = useSelector(state => state.submit.failedFiles);
  const submitting = useSelector(state => state.submit.submitting);
  const selectedCollection = useSelector(
    state => state.submit.selectedCollection
  );
  const [selectedFiles, setSelectedFiles] = useState({});
  const [allFilesChecked, setAllFilesChecked] = useState(true);
  const [submitAttachmentsButtonClass, setSubmitAttachmentsButtonClass] =
    useState('');
  const [multipleAttachmentsSelected, setMultipleAttachmentsSelected] =
    useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
    setAllFilesChecked(
      failedFiles.length === Object.keys(selectedFiles).length
    );
  }, [selectedFiles]);

  useEffect(() => {
    checkAllFiles(setSelectedFiles, failedFiles);
  }, [failedFiles]);

  useEffect(() => {
    const selectedFilesLength = Object.keys(selectedFiles).length;
    setSubmitAttachmentsButtonClass('');
    setMultipleAttachmentsSelected(true);
    if (selectedFilesLength === 0)
      setSubmitAttachmentsButtonClass(styles.submitattachmentsdisabled);
    else if (selectedFilesLength === 1) setMultipleAttachmentsSelected(false);
  }, [selectedFiles]);

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
      <div className={styles.majorlabel}>
        <MajorLabel
          text="Failed submissons"
          link="https://wiki.synbiohub.org/userdocumentation/managingsubmitting/"
        />
      </div>
      {!submitting && (
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
      )}

      {failedFilesDisplay}

      {!submitting && (
        <div
          className={`${styles.submitattachmentsbutton} ${submitAttachmentsButtonClass}`}
          role="button"
          onClick={() => {
            if (
              submitAttachmentsButtonClass !== styles.submitattachmentsdisabled
            )
              dispatch(
                addAttachments(
                  Object.values(selectedFiles),
                  selectedCollection.uri
                )
              );
          }}
        >
          <FontAwesomeIcon
            icon={faCloudUploadAlt}
            size="1x"
            className={styles.submitattachmentsicon}
          />
          {`Upload as ${
            multipleAttachmentsSelected ? 'Attachments' : 'Attachment'
          }`}
        </div>
      )}
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
