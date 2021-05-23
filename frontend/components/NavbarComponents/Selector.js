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
        <img
          className={navoptionicon}
          src={properties.icon}
          alt={properties.name}
        />

        <span className={navoptionname}>{properties.name}</span>
      </div>
    </Link>
  );
}
