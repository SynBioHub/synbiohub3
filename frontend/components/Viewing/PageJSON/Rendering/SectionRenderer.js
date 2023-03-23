import styles from '../../../../styles/view.module.css';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

function loadText(template, args) {
  for (const key of Object.keys(args)) {
    template = template.replace(new RegExp(`\\$<${key}>`, 'g'), args[key]);
  }
  return template;
}

export default function SectionRenderer({ section, metadata }) {
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
