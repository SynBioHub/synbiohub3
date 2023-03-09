import getQueryResponse from '../../../../sparql/tools/getQueryResponse';
import { useEffect, useState } from 'react';
import styles from '../../../../styles/view.module.css';
import Link from 'next/link';
import SectionRenderer from './SectionRenderer';
import RenderIcon from './RenderIcon';
import MetadataRenderer from './MetadataRenderer';
import buildQuery from '../Fetching/buildQuery';
import parseQueryResult from '../Fetching/parseQueryResult';
import executeQueryFromTableJSON from '../Fetching/executeQueryFromTableJSON';

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
  const [content, setContent] = useState([]);
  useEffect(() => {
    executeQueryFromTableJSON(uri, prefixes, table).then(response => {
      setContent(parseQueryResult(table, response));
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
    const columns = row.map((column, index) => (
      <SectionRenderer column={column} key={index} />
    ));
    return (
      <tr key={index} className={styles.customrow}>
        {columns}
      </tr>
    );
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
  return columns
    .map((column, index) => {
      if (column.title && !column.hide) {
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
