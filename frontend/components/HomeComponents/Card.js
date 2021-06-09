import Link from 'next/link';

import { card, cardhead, cardicon } from '../../styles/home.module.css';

/**
 * Component for different action 'cards' that can be clicked by the user on the home page.
 * Generic, based on props passed
 */
export default function Card(properties) {
  const title = properties.icon ? (
    <div className={cardhead}>
      <h3>{properties.title}</h3>

      <img
        alt=""
        style={
          properties.iconheight
            ? {
                height: properties.iconheight,
                verticalAlign: properties.iconoffset,
                marginLeft: properties.iconright
              }
            : {}
        }
        src={properties.icon}
        className={cardicon}
      />
    </div>
  ) : (
    <h3>
      {properties.title} <span style={{ color: 'black' }}>&rarr;</span>
    </h3>
  );

  return (
    <Link href={properties.route}>
      <a className={card}>
        {title}

        <p>{properties.description}</p>
      </a>
    </Link>
  );
}
