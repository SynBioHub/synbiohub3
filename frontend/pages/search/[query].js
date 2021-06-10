import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setLimit, setOffset, setSearchQuery } from '../../redux/actions';

/**
 * This component redirects to the search route, updating
 * query, offset, and limit state based on url path
 */
export default function RedirectToSearch() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { query, offset, limit } = router.query;
  useEffect(() => {
    if (query) {
      dispatch(setSearchQuery(query));
    }
    if (offset) {
      dispatch(setOffset(Number.parseInt(offset)));
    } else dispatch(setOffset(0));
    if (limit) {
      dispatch(setLimit(Number.parseInt(limit)));
    } else dispatch(setLimit(50));
    router.push('/search');
  }, [query, offset, limit]);
  return null;
}
