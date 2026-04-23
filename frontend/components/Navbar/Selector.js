import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import {
  navoption,
  navoptionactive,
  navoptionCta,
  navoptionicon,
  navoptioniconCompact,
  navoptionname,
  navoptionnameCompact,
  navoptionRow,
  navoptionRowCompact
} from '../../styles/navbar.module.css';

/**
 * This component represents a link to respective page on sbh (in the navigation bar)
 * Generic component based on props
 */
export default function Selector(properties) {
  const router = useRouter();
  const [style, setStyle] = useState('');

  useEffect(() => {
    if (properties.href === router.pathname) setStyle(navoptionactive);
  }, [router.pathname, properties.href]);

  const textClassName = properties.isInstanceName
    ? 'instanceName'
    : `${navoptionname}${properties.compact ? ` ${navoptionnameCompact}` : ''}`;

  const rowClass = properties.compact ? navoptionRowCompact : navoptionRow;
  const iconClass = `${navoptionicon}${properties.compact ? ` ${navoptioniconCompact}` : ''}`;

  const anchorClass = [
    navoption,
    style,
    properties.cta ? navoptionCta : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link href={properties.href}>
      <a className={anchorClass}>
        <span className={rowClass}>
          <FontAwesomeIcon
            className={iconClass}
            icon={properties.icon}
            alt="home"
            size="2x"
            color="#F2E86D"
          />
          {properties.logoUrl ? (
            <img
              src={properties.logoUrl}
              alt="instance logo"
              style={{ height: '2rem', width: 'auto' }}
            />
          ) : (
            <span className={textClassName}>{properties.name}</span>
          )}
        </span>
      </a>
    </Link>
  );
}
