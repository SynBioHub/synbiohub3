import { useEffect, useState } from 'react';

import styles from '../../styles/submit.module.css';
import FileDropzone from './FileDropzone';
import MajorLabel from './MajorLabel';
import SelectedFileView from './SelectedFileView';
import SubmitLabel from './SubmitLabel';

export default function UploadFile(properties) {
  const [fileUploadLabel, setFileUploadLabel] = useState(
    <SubmitLabel
      text="SBOL &middot; GENBANK &middot; GFF3 &middot; FASTA &middot; ZIP (Optional)"
      for=""
      required={false}
    />
  );

  useEffect(() => {
    if (properties.fileRequired)
      setFileUploadLabel(
        <SubmitLabel
          text="SBOL &middot; GENBANK &middot; GFF3 &middot; FASTA &middot; ZIP"
          value={properties.files}
          verifier={files => files.length > 0}
          for=""
          required={true}
        />
      );
    else
      setFileUploadLabel(
        <SubmitLabel
          text="SBOL &middot; GENBANK &middot; GFF3 &middot; FASTA &middot; ZIP (Optional)"
          for=""
          required={false}
        />
      );
  }, [properties.fileRequired]);

  return (
    <div className={styles.uploadcontainer}>
      <MajorLabel
        text="Upload Design Files"
        link="https://wiki.synbiohub.org/userdocumentation/managingsubmitting/"
      />
      {fileUploadLabel}
      <FileDropzone setFiles={properties.setFiles} />
      <SelectedFileView files={properties.files} />
    </div>
  );
}
