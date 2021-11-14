import styles from '../../../styles/submit.module.css';
import MajorLabel from '../ReusableComponents/MajorLabel';
import SubmitLabel from '../ReusableComponents/SubmitLabel';
import FileDropzone from './FileDropzone';
import SelectedFileView from './SelectedFileView';

export default function UploadFileSection(properties) {
  return (
    <div className={styles.uploadcontainer}>
      <MajorLabel
        text="Upload Design Files"
        link="https://wiki.synbiohub.org/userdocumentation/managingsubmitting/"
      />
      <SubmitLabel
        text="SBOL &middot; GENBANK &middot; GFF3 &middot; FASTA &middot; ZIP"
        verified={properties.files.length > 0}
        for=""
        required={true}
      />
      <FileDropzone setFiles={properties.setFiles} />
      <SelectedFileView
        files={properties.files}
        setFiles={properties.setFiles}
      />
    </div>
  );
}
