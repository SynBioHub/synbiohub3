import styles from '../../../../styles/view.module.css';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import useRegistries from '../Fetching/useRegistries';
import MiniLoading from '../../../Reusable/MiniLoading';
import executeQueryFromTableJSON from '../Fetching/executeQueryFromTableJSON';
import parseQueryResult from '../Fetching/parseQueryResult';
import { useEffect, useState } from 'react';

function loadText(template, args) {
  for (const key of Object.keys(args)) {
    template = template.replace(new RegExp(`\\$<${key}>`, 'g'), args[key]);
  }

  return template;
}

export default function SectionRenderer({ column, metadata }) {
  const [section, setSection] = useState(column);
  const { registries, loading, error } = useRegistries();

  useEffect(() => {
    if (section.externalFetch && !error && !loading) {
      const queryUrl = registries.find(registry => {
        return section.externalFetch.uri.startsWith(registry.uri);
      })?.url;
      if (queryUrl) {
        executeQueryFromTableJSON(
          section.externalFetch.uri,
          section.externalFetch.prefixes,
          section.externalFetch.table,
          queryUrl
        ).then(result => {
          try {
            console.log(
              parseQueryResult(
                section.externalFetch.table,
                result,
                section.externalFetch.prefixes
              )
            );
            const [[fetchedSection]] = parseQueryResult(
              section.externalFetch.table,
              result,
              section.externalFetch.prefixes
            );
            if (fetchedSection) {
              if (!fetchedSection.text && metadata) {
                fetchedSection.text = 'No Data';
              }
              setSection(fetchedSection);
            }
          } catch (error) {
            const newSection = {
              ...section,
              externalFetch: null,
              text: 'No Data'
            };
            setSection(newSection);
          }
        });
      } else {
        const newSection = { ...section, externalFetch: null, text: 'No Data' };
        setSection(newSection);
      }
    }
  }, [section, registries, loading, error, metadata]);

  if (section.externalFetch && error) {
    setSection({
      ...section,
      externalFetch: null,
      text: 'Error while fetching data'
    });
  }

  if (section.externalFetch) {
    return <MiniLoading height={10} width={50} />;
  }

  if (section.grouped) {
    const items = section.text.split(', ');
    const content = items.map((item, index) => {
      if (section.link && item) {
        return (
          <ColumnLink
            link={loadText(section.link, { This: item })}
            text={`${item}${
              index === items.length - 1 ||
              (section.linkType !== 'default' && section.linkType !== undefined)
                ? ''
                : ', '
            }`}
            linkType={section.linkType}
            key={index}
          />
        );
      }
      return (
        <span key={index}>
          {item}
          {index === items.length - 1 ? '' : ', '}
        </span>
      );
    });
    if (metadata) {
      return <div className={styles.preventoverflowmetadata}>{content}</div>;
    }
    return <td>{content}</td>;
  }
  return (
    <td>
      {section.link ? (
        <ColumnLink
          link={loadText(section.link, { This: section.text })}
          text={section.text}
          linkType={section.linkType}
        />
      ) : (
        <div className={metadata && styles.preventoverflowmetadata}>
          {section.text}
        </div>
      )}
    </td>
  );
}

function ColumnLink({ text, link, linkType }) {
  if (linkType === 'search') {
    const searchStart = link.indexOf('=');
    link =
      link.substring(0, searchStart) +
      encodeURIComponent(link.substring(searchStart));
    return (
      <div style={{ display: 'inline-block' }}>
        <span>{text}</span>
        {text && (
          <Link href={link}>
            <a target="_blank">
              <FontAwesomeIcon
                icon={faSearch}
                size="small"
                className={styles.searchicon}
              />
            </a>
          </Link>
        )}
      </div>
    );
  }
  return (
    <Link href={link}>
      <a target="_blank" className={styles.customlink}>
        <span>{text}</span>
      </a>
    </Link>
  );
}
