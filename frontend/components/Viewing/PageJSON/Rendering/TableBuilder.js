import { useEffect, useState } from 'react';
import styles from '../../../../styles/view.module.css';
import Link from 'next/link';
import RenderIcon from './RenderIcon';
import MetadataRenderer from './MetadataRenderer';
import parseQueryResult from '../Fetching/parseQueryResult';
import executeQueryFromTableJSON from '../Fetching/executeQueryFromTableJSON';
import RowWrapper from './RowWrapper';
import { useDispatch } from 'react-redux';
import { parseTableHeaders } from '../Parsing/parseTableHeaders';

/**
 * This Component renders an individual table based on given JSON
 * for the table. It constructs the corresponding SPARQL query as
 * dictated by the JSON
 * @param {*} param0
 * @returns
 */
export default function TableBuilder({ uri, prefixes, table, metadata }) {
  prefixes = prefixes.join('\n');

  return (
    <div>
      <TableRenderer
        uri={uri}
        prefixes={prefixes}
        table={table}
        metadata={metadata}
      />
    </div>
  );
}

function TableRenderer({ uri, prefixes, table, metadata }) {
  const [content, setContent] = useState(null);
  const dispatch = useDispatch();
  useEffect(() => {
    executeQueryFromTableJSON(dispatch, uri, prefixes, table).then(response => {
      setContent(parseQueryResult(table, response, prefixes));
    });
  }, [uri, prefixes, table]);

  const header = metadata ? null : createHeader(table.sections, content);

  if (!content) return null;

  if (metadata) {
    return <MetadataRenderer title={table.title} content={content} />;
  }

  if (content.length == 0) {
    return <div>No columns to display</div>;
  }

  const rows = content.map((row, index) => {
    return <RowWrapper sections={row} key={index} metadata={false} />;
  });

  return (
    <div>
      <table className={styles.table}>
        <thead>
          <tr>{header}</tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

function createHeader(columns, content) {
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
        return (
          <th key={index}>
            {column.title}
            <Link href={customInfoLink || column.infoLink || 'NA'}>
              <a target="_blank" title={column.info}>
                <RenderIcon icon={column.icon || 'faInfoCircle'} />
              </a>
            </Link>
          </th>
        );
      }
    })
    .filter(column => column !== undefined);
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
