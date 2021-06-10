import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

import { card, cardhead, cardicon } from '../../styles/home.module.css';

/**
 * Component for different action 'cards' that can be clicked by the user on the home page.
 * Generic, based on props passed
 */
export default function Card(properties) {
  return (
    <Link href={properties.route}>
      <a className={card}>
        <div className={cardhead}>
          <h3>{properties.title}</h3>
          <FontAwesomeIcon
            className={cardicon}
            icon={properties.icon}
            alt={properties.name}
            size="2x"
            color="#000"
          />
        </div>

        <p>{properties.description}</p>
      </a>
    </Link>
  );
}
