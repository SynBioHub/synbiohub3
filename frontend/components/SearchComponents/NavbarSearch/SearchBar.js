import { useEffect, useState } from 'react';

import { searchbar, searchexpand } from '../../../styles/navbar.module.css';

/**
 * The search bar that users will use to search sbh. located in navigation
 * bar at the top
 */
export default function SearchBar(properties) {
  const [expand, setExpand] = useState('');

  useEffect(() => {
    setExpand(searchexpand);
  }, [setExpand]);

  return (
    <input
      autoFocus
      className={`${searchbar} ${expand}`}
      onChange={properties.onChange}
      placeholder={properties.placeholder}
      type="text"
      value={properties.value}
    />
  );
}
