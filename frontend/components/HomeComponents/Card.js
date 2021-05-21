import { useDispatch } from 'react-redux';

import { setSearchingActive } from '../../redux/actions';
import { card, cardhead, cardicon } from '../../styles/home.module.css';

/**
 * Component for different action 'cards' that can be clicked by the user on the home page.
 * Generic, based on props passed
 */
export default function Card(properties) {
  const dispatch = useDispatch();
  const title = properties.icon ? (
    <div className={cardhead}>
      <h3>{properties.title}</h3>

      <img
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
    <a
      className={card}
      onClick={() => {
        if (properties.title === 'Search') {
          dispatch(setSearchingActive(true));
        }
      }}
    >
      {title}

      <p>{properties.description}</p>
    </a>
  );
}
