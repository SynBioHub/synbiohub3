import UploadAttachments from './UploadAttachments';
import AttachmentRows from './AttachmentRows';
import styles from '../../../../styles/view.module.css';

/**
 * @param {Any} properties Information passed in from the parent component.
 * @returns The list of attachments and the uploading/lookup section if the user is the owner.
 */
export default function AttachmentsTable(properties) {
  const header = createHeader(properties.headers);

  if (properties.attachments.length === 0 && !properties.owner) return null;

  return (
    <table className={styles.table}>
      {properties.headers && (
        <thead>
          <tr>{header}</tr>
        </thead>
      )}
      <tbody>
        <AttachmentRows
          owner={properties.owner}
          uri={properties.uri}
          attachments={properties.attachments}
          setRefreshMembers={properties.setRefreshMembers}
        />
        {properties.owner && (
          <UploadAttachments
            attachments={properties.attachments}
            uri={properties.uri}
            setRefreshMembers={properties.setRefreshMembers}
          />
        )}
      </tbody>
    </table>
  );
}

/**
 * @param {Array} headers An array of strings that are the headers that are to be generated.
 * @returns Table headers with the specified headers.
 */
function createHeader(headers) {
  return headers.map(header => {
    //Handles if the header is Size so the border-bottom will span the whole table.
    if (header === 'Size')
      return (
        <th colSpan={3} key={header}>
          {header}
        </th>
      );

    return <th key={header}>{header}</th>;
  });
}
