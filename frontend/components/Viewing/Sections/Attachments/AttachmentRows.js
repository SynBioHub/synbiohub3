import React, { useState } from 'react';
import Link from 'next/link';

import deleteAttachment from '../../../../sparql/deleteAttachment';
import getSource from '../../../../sparql/getSource.js';

import getQueryResponse from '../../../../sparql/tools/getQueryResponse';
import edam from './edam.json';

import { useDispatch, useSelector } from 'react-redux';
import { downloadFiles, setAttachments } from '../../../../redux/actions';

import { faDownload, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const { publicRuntimeConfig } = getConfig();
import getConfig from 'next/config';

import styles from '../../../../styles/view.module.css';

/**
 * Renders the rows that contain any attachments that are returned from the query.
 *
 * @param {Any} properties Information passed down from the parent component.
 * @returns The rows the contains the information about the attachments.
 */
export default function AttachmentRows(properties) {
  const token = useSelector(state => state.user.token);
  const [attachmentInfo, setStateAttachments] = useState();
  const dispatch = useDispatch();

  //There are attachments from the parent but they haven't been added to the state yet.
  if (attachmentInfo === undefined && properties.attachments.length > 0)
    setStateAttachments(properties.attachments);

  //There are no attachments to get.
  if (properties.attachments.length === 0) return null;

  /**
   * @param {Number} bytes The number of bytes.
   * @returns The correct unit and formatted number of bytes.
   */
  const bytesToSize = bytes => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  };

  /**
   * @param {String} type The URL from edamontology.org that has what format the file is.
   * @returns The corresponding name of extension from the edam.json file.
   */
  const edamTypeConverter = type => edam[`${type}`];

  return properties.attachments.map((attachment, key) => {
    return (
      <tr key={key}>
        <td>
          {attachment.format.includes('format_')
            ? edamTypeConverter(attachment.format)
            : attachment.format.split('/').pop()}
        </td>
        <td>
          <Link href={attachment.topLevel.replace('https://synbiohub.org', '')}>
            <a className={styles.link}>{attachment.title}</a>
          </Link>
        </td>
        <td>{attachment.size === '' ? '' : bytesToSize(attachment.size)}</td>
        <td className={styles.downloadbutton}>
          <div
            type="button"
            onClick={() => {
              //The attachment was uploaded from a URL so it must be handled differently.
              if (attachment.size === '') {
                getQueryResponse(getSource, { uri: attachment.topLevel }).then(
                  source => {
                    window.open(source[0].source, '_blank');
                  }
                );
              } else {
                const item = {
                  url: `${
                    publicRuntimeConfig.backend
                  }${attachment.topLevel.replace(
                    'https://synbiohub.org',
                    ''
                  )}/download`,
                  name: attachment.title.substring(
                    0,
                    attachment.title.lastIndexOf('.')
                  ),
                  displayId: attachment.title.substring(
                    0,
                    attachment.title.lastIndexOf('.')
                  ),
                  type: attachment.format.split('/').pop(),
                  status: 'downloading'
                };

                dispatch(downloadFiles([item]));
              }
            }}
          >
            <FontAwesomeIcon
              icon={faDownload}
              size="1x"
              color="#465875"
              className={styles.downloadicon}
            />{' '}
            Download
          </div>
        </td>
        <td className={styles.removebutton}>
          {properties.owner && (
            <div
              type="button"
              onClick={async () => {
                const copy = [...properties.attachments];
                const deletedAttachment = copy.splice(key, 1);

                dispatch(setAttachments(copy));
                await getQueryResponse(
                  deleteAttachment,
                  { uri: deletedAttachment[0].topLevel },
                  token,
                  true
                );
                properties.setRefreshMembers(true);
              }}
            >
              <FontAwesomeIcon
                icon={faTrashAlt}
                size="1x"
                color="#465875"
                className={styles.deleteicon}
              />
            </div>
          )}
        </td>
      </tr>
    );
  });
}
