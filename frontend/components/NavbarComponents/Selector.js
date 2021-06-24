import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

import {
  navoption,
  navoptionicon,
  navoptionname
} from '../../styles/navbar.module.css';

/**
 * This component represents a link to respective page on sbh (in the navigation bar)
 * Generic component based on props
 */
export default function Selector(properties) {
  return (
    <Link href={properties.href}>
      <div className={navoption}>
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
      </div>
    </Link>
  );
}
