import styles from '../../../styles/submit.module.css';
import FileDropzone from '../../SubmitComponents/FileComponents/FileDropzone';
import SelectedFileView from '../../SubmitComponents/FileComponents/SelectedFileView';
import SubmitLabel from '../../SubmitComponents/ReusableComponents/SubmitLabel';

export default function UploadFile(properties) {
  return (
    <div className={styles.uploadcontainer}>
      <SubmitLabel
        text="Or, upload a FASTA/FASTQ file"
        verified={properties.files.length > 0}
        for=""
        required={true}
      />
      <FileDropzone setFiles={properties.setFiles} disableMultiple={true} />
      <SelectedFileView
        files={properties.files}
        setFiles={properties.setFiles}
        disableMultiple={true}
      />
    </div>
  );
}
