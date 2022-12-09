import getQueryResponse from '../../../sparql/tools/getQueryResponse';
import loadTemplate from '../../../sparql/tools/loadTemplate';
import { useEffect, useState } from 'react';
import styles from '../../../styles/view.module.css';
import Link from 'next/link';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function TableBuilder({ uri, prefixes, table }) {
  prefixes = prefixes.join('\n');

  return (
    <div>
      <TableRenderer uri={uri} prefixes={prefixes} table={table} />
    </div>
  );
}

function TableRenderer({ uri, prefixes, table }) {
  const [content, setContent] = useState([]);
  useEffect(() => {
    getQueryResponse(
      prefixes + '\n' + getTableQuerySetup(uri, table),
      {},
      '',
      false
    ).then(response => {
      setContent(getTableContent(table, response));
    });
  }, [uri, prefixes, table]);

  const header = createHeader(table.columns);

  if (!content) return null;

  if (content.length == 0) {
    return <div>No columns to display</div>;
  }

  const rows = content.map((row, index) => {
    const columns = row.map((column, index) => (
      <td key={index}>
        {column.link ? (
          <Link href={column.link}>
            <a target="_blank">
              <span>{column.text}</span>
            </a>
          </Link>
        ) : (
          <span>{column.text}</span>
        )}
      </td>
    ));
    return (
      <tr className={styles.componentsinfo} key={index}>
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

function createHeader(columns) {
  return columns
    .map((column, index) => {
      if (column.title && !column.hide) {
        return (
          <th key={index}>
            {column.title}
            <Link href={column.infoLink}>
              <a target="_blank" title={column.info}>
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  size="1x"
                  color="#465875"
                  className={styles.searchicon}
                />
              </a>
            </Link>
          </th>
        );
      }
    })
    .filter(column => column !== undefined);
}

function getTableContent(table, items) {
  const ids = table.columns.map(column => {
    return {
      title: column.title,
      id: getId(column).substring(1),
      link: column.link,
      text: column.text,
      searchLink: column.searchLink,
      hidden: column.hide ? true : false,
      grouped: column.group ? true : false
    };
  });

  let content = items.map(row => {
    const titleToValueMap = {};
    ids.forEach(id => {
      titleToValueMap[id.title] = row[id.id];
    });
    return ids
      .map(column => {
        if (column.hidden) return;
        const text = column.text
          ? loadText(column.text, titleToValueMap)
          : row[column.id];
        const link = column.link
          ? loadText(column.link, titleToValueMap)
          : undefined;
        const search =
          column.searchLink && text
            ? text
                .split(', ')
                .map(item => loadText(column.searchLink, { Result: item }))
            : undefined;
        const grouped = column.grouped;
        return { text, link, search, grouped };
      })
      .filter(column => column !== undefined);
  });
  return content;
}

function loadText(text, args) {
  return loadTemplate(text, args);
}

function getTableQuerySetup(uri, tableJSON) {
  const rootPredicateDictionary = {};
  rootPredicateDictionary[tableJSON.rootPredicate] = [];
  const additionalSelections = [];
  tableJSON.columns.forEach(column => {
    const root = column.rootPredicateOverride || tableJSON.rootPredicate;
    if (root !== tableJSON.rootPredicate) {
      additionalSelections.push(getId(column));
    }
    if (!rootPredicateDictionary[root]) {
      rootPredicateDictionary[root] = [];
    }
    rootPredicateDictionary[root].push(column);
  });
  let queryToReturn = getTableQuery(
    uri,
    rootPredicateDictionary[tableJSON.rootPredicate],
    tableJSON.rootPredicate,
    false,
    additionalSelections
  );
  delete rootPredicateDictionary[tableJSON.rootPredicate];
  for (const [rootPredicate, columns] of Object.entries(
    rootPredicateDictionary
  )) {
    queryToReturn += `{\n${getTableQuery(uri, columns, rootPredicate, true)}}`;
  }
  return (
    queryToReturn +
    `} ${tableJSON.orderBy ? 'ORDER BY ' + tableJSON.orderBy : ''}`
  );
}

function getTableQuery(
  uri,
  columns,
  rootPredicate,
  nestedQuery = false,
  additionalSelections = []
) {
  const rootId = getId({ title: rootPredicate });
  const items = [...additionalSelections];
  const subqueries = [];
  subqueries.push(`{\n<${uri}> ${rootPredicate} ${rootId}`);
  columns.forEach(column => {
    if (!column.predicates) {
      return;
    } else if (column.predicates.length === 0) {
      items.push(`(${rootId} AS ${getId(column)})`);
    } else {
      let topLevelId = rootId;
      let groupResults = column.group;
      column.predicates.forEach((predicate, index) => {
        const isLastPredicate = index == column.predicates.length - 1;
        let predicateId = isLastPredicate
          ? getId(column)
          : getId({ title: predicate });
        subqueries.push(`OPTIONAL { ${topLevelId} ${predicate} ${predicateId}`);
        topLevelId = predicateId;
        if (isLastPredicate) {
          !groupResults
            ? items.push(predicateId)
            : items.push(
                `(group_concat(${predicateId}; separator=", ") AS ${predicateId})`
              );
        }
      });
      subqueries.push('}'.repeat(column.predicates.length));
    }
  });
  subqueries.push('}');
  return (
    'SELECT\n' +
    [...new Set(items)].join('\n') +
    `${!nestedQuery ? '\n{' : '\n'}` +
    subqueries.join('\n')
  );
}

function getId(section) {
  if (section.id) return `?${section.id}`;
  let titleToParse = section.title;
  if (Array.isArray(section.title)) {
    titleToParse = section.title.join('');
  }
  return `?${titleToParse.replace(/[^A-Z0-9]+/gi, '_').toLowerCase()}`;
}
