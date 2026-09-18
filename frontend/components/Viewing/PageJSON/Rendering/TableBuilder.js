import { useEffect, useState } from 'react';
import styles from '../../../../styles/view.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faPlus } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { toast } from 'react-toastify';
import RenderIcon from './RenderIcon';
import MetadataRenderer from './MetadataRenderer';
import parseQueryResult from '../Fetching/parseQueryResult';
import executeQueryFromTableJSON from '../Fetching/executeQueryFromTableJSON';
import RowWrapper from './RowWrapper';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { parseTableHeaders } from '../Parsing/parseTableHeaders';
import React from 'react';
import { isUriOwner } from '../../Shell';
import { getAfterThirdSlash } from '../../ViewHeader';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

/**
 * This Component renders an individual table based on given JSON
 * for the table. It constructs the corresponding SPARQL query as
 * dictated by the JSON
 * @param {*} param
 * @returns
 */
export default function TableBuilder({ uri, prefixes, table, metadata }) {
  prefixes = prefixes.join('\n');
  const objectUriParts = getAfterThirdSlash(uri);
  const username = useSelector(state => state.user.username);
  const objectUri = `${publicRuntimeConfig.backend}/${objectUriParts}`;
  var isOwner = isUriOwner(objectUri, username);
  if (uri.endsWith('/share')) {
    isOwner = true;
  }
  return (
    <div>
      <TableRenderer
        uri={uri}
        prefixes={prefixes}
        table={table}
        metadata={metadata}
        owner={isOwner}
      />
    </div>
  );
}

function TableRenderer({ uri, prefixes, table, metadata, owner }) {
  const token = useSelector(state => state.user.token);
  const [content, setContent] = useState(null);
  const dispatch = useDispatch();
  
  useEffect(() => {
    let cleanedUri = uri;
    if (uri.endsWith('/share')) {
      const parts = uri.split('/');
      if (parts.length >= 2) {
        cleanedUri = parts.slice(0, -2).join('/');
      }
    }
    executeQueryFromTableJSON(dispatch, cleanedUri, prefixes, token, table).then(response => {
      setContent(parseQueryResult(table, response, prefixes));
    });
  }, [uri, prefixes, table]);

  const plainSequence =
    !metadata && table.title === 'Sequence' ? getPlainSequence(content) : null;

  const header = metadata
    ? null
    : createHeader(table.sections, content, plainSequence);

  const isEditable = metadata && metadata.editable && owner;

  if (!checkContentExist(content) && !metadata) {
    return "No content to display for " + table.title;
  }

  if (metadata) {
    return <MetadataRenderer title={table.title} content={content} editable={isEditable} uri={uri}/>;
  }

  // if (content.length == 0) {
  //   return <div>No columns to display</div>;
  // }

  const rows = content.map((row, index) => {
    return <RowWrapper sections={row} key={index} metadata={false} />;
  });

  // const titleType = splitPredicate(metadata.rootPredicate);

  // const handleAdd = () => {
  //   axios.post(`${objectUri}/add/${titleType}`, {
  //     object: editedDescription
  //   }, {
  //     headers: {
  //       "Accept": "text/plain; charset=UTF-8",
  //       "X-authorization": token
  //     }
  //   })
  //     .then(response => {

  //     })
  //     .catch(error => {
  //       console.error(`Error adding: ${titleType}`, error);
  //     });
  // };

  return (
    <div>
      {content.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>{header}</tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      )}
    </div>
  );
}

function getPlainSequence(content) {
  if (!content || content.length === 0) return null;
  const sequenceSection = content[0].sequence;
  if (!sequenceSection || sequenceSection.length === 0) return null;
  const value = sequenceSection[0].value;
  if (!value || typeof value !== 'string') return null;
  // Strip whitespace so clipboard gets contiguous letters only
  const plain = value.replace(/\s+/g, '');
  return plain || null;
}

function copySequenceToClipboard(plainSequence) {
  navigator.clipboard.writeText(plainSequence).then(() => {
    toast(
      <div>
        <FontAwesomeIcon
          icon={faCopy}
          size="1x"
          className={styles.toastcopyicon}
        />
        Sequence Copied!
      </div>,
      {
        position: 'top-right',
        autoClose: 500,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: styles.modaltoast
      }
    );
  });
}

function createHeader(columns, content, plainSequence) {
  parseTableHeaders(columns);

  const columnsProcessed = {};

  return columns
    .map((column, index) => {
      if (column.title && !column.hide && !columnsProcessed[column.title]) {
        columnsProcessed[column.title] = true;
        const customInfoLink =
          content &&
          content.length > 0 &&
          content[0][index] &&
          content[0][index].infoLink;
        const showCopy = column.title === 'Sequence' && plainSequence;
        return (
          <th key={index}>
            <div className={styles.sequenceTableHeader}>
              <span>
                {column.title}
                <Link href={customInfoLink || column.infoLink || 'NA'}>
                  <a target="_blank" title={column.info}>
                    <RenderIcon icon={column.icon || 'faInfoCircle'} />
                  </a>
                </Link>
              </span>
              {showCopy && (
                <button
                  type="button"
                  className={styles.sequenceCopyButton}
                  title="Copy sequence"
                  onClick={() => copySequenceToClipboard(plainSequence)}
                >
                  <FontAwesomeIcon icon={faCopy} size="sm" />
                  Copy
                </button>
              )}
            </div>
          </th>
        );
      }
    })
    .filter(column => column !== undefined);
}

function EditableIcon({ onAddClick }) {
  return (
    <div style={{ textAlign: 'right', margin: '10px' }}>
      <button onClick={onAddClick}>
        <FontAwesomeIcon icon={faPlus} />
      </button> {/* Style this as needed */}
    </div>
  );
}

function splitPredicate(predicate) {
  return predicate.split(':')[1];
}

const tableFork = tableJSON => {
  console.log(tableJSON);
  tableJSON.sections.forEach(section => {
    if (section.predicates) {
      section.predicates.forEach(predicate => {
        if (predicate.includes('|')) {
          console.log(predicate);
        }
      });
    }
  });
};

export const BooleanContext = React.createContext(false);

export const checkContentExist = (content) => {
  if (!content || (Array.isArray(content) && content.length === 0)) {
    return false;
  } else {
    return true;
  }
}
