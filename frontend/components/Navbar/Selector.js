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

  return (
    <Link href={properties.href}>
      <a className={`${navoption}  ${style}`}>
        {!properties.customIcon ? (
          <FontAwesomeIcon
            className={navoptionicon}
            icon={properties.icon}
            alt={properties.name}
            size="2x"
            color="#F2E86D"
          />
        ) : (
          properties.customIcon
        )}

        <span className={navoptionname}>{properties.name}</span>
      </a>
    </Link>
  );
}
