import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import {
  navoption,
  navoptionactive,
  navoptionicon,
  navoptionname
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

  const textClassName = properties.isInstanceName ? 'instanceName' : navoptionname;

  // keep navoptionname import for other uses
  return (
    <Link href={properties.href}>
      <a className={`${navoption}  ${style}`}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          {/* Render the home icon */}
          <FontAwesomeIcon
            className={navoptionicon}
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
