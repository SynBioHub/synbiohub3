import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setOffset, setSearchQuery } from '../../../redux/actions';
import { searchbar, searchexpand } from '../../../styles/navbar.module.css';

/**
 * The search bar that users will use to search sbh. located in navigation
 * bar at the top
 */
export default function SearchBar() {
  const [expand, setExpand] = useState('');
  const query = useSelector(state => state.search.query);
  const dispatch = useDispatch();

  useEffect(() => {
    setExpand(searchexpand);
  }, [setExpand]);

  return (
    <input
      autoFocus
      className={`${searchbar} ${expand}`}
      onChange={event => {
        dispatch(setSearchQuery(event.target.value));
        dispatch(setOffset(0));
      }}
      placeholder="Search SynBioHub"
      type="text"
      value={query}
    />
  );
}
