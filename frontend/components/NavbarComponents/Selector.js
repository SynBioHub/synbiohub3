import Link from 'next/link';
import { navoption, navoptionicon, navoptionname } from '../../styles/navbar.module.css';

/**
 * This component represents a link to respective page on sbh (in the navigation bar)
 * Generic component based on props
 */
export default function Selector(props) {
  return (
    <Link href={props.href}>
      <div className={navoption}>
        <img
          className={navoptionicon}
          src={props.icon}
          alt={props.name}
        />

        <span className={navoptionname}>{props.name}</span>
      </div>
    </Link>
  );
}
