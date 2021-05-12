import { standardcontainer, standardresultsloading, standarderror, countloader, countloadercontainer } from '../../../styles/searchpanel.module.css';

import useSWR from 'swr';
import axios from 'axios'
import { useEffect, useState, useRef } from 'react';

import Loader from 'react-loader-spinner';
import ResultTable from './ResultTable/ResultTable';
import { useDispatch, useSelector } from 'react-redux';
import { setOffset } from '../../../redux/actions';

export default function StandardSearch() {
   const query = useSelector(state => state.search.query);
   const offset = useSelector(state => state.search.offset);
   const dispatch = useDispatch();
   const [firstQuery, setFirstQuery] = useState(true);
   const hasQueryChanged = useCompare(query);
   const [count, setCount] = useState(undefined);
   const { newCount, isCountLoading, isCountError } = getSearchCount(query, offset);
   useEffect(() => {
      if (hasQueryChanged && !firstQuery)
         dispatch(setOffset(0));
      setFirstQuery(false);
      if (isCountLoading)
         setCount(
            <div className={countloadercontainer}>
               <Loader type="ThreeDots" color="#D25627" width={25} height={10} className={countloader} />
            </div>
         )
      if (isCountError)
         setCount('Error')
      else
         setCount(newCount)
   }, [query, hasQueryChanged, newCount, isCountLoading, isCountError]);
   
   const { results, isLoading, isError } = getSearchResults(query, offset);
   if (isError)
      return <div className={standarderror}>Errors were encountered while fetching the data count</div>
   if (isLoading)
      return (
         <div className={standardcontainer}>
            <div className={standardresultsloading}>
               <Loader type="Grid" color="#D25627" />
            </div>
         </div>
      )
   if (results.length === 0)
      return <div className={standarderror}>No results found</div>
   else
      return (
         <div className={standardcontainer}>
            <ResultTable data={results} count={count} />
         </div>
      )
}

const getSearchResults = (query, offset) => {
   const { data, error } = useSWR(`${process.env.backendUrl}/search/${query}?offset=${offset}`, fetcher);
   return {
      results: data,
      isLoading: !error && !data,
      isError: error
   }
}

const getSearchCount = (query, offset) => {
   const { data, error } = useSWR(`${process.env.backendUrl}/searchCount/${query}?offset=${offset}`, fetcher);
   return {
      newCount: data,
      isCountLoading: !error && !data,
      isCountError: error
   }
}

const fetcher = url => axios.get(url, {
   headers: {
      "Content-Type": "application/json",
      "Accept": "text/plain"
   }
}).then(res => res.data);

// Used to compare new query to previous query
function useCompare (val) {
   const prevVal = usePrevious(val)
   return prevVal !== val
 }
 
 // Helper hook
 function usePrevious(value) {
   const ref = useRef();
   useEffect(() => {
     ref.current = value;
   });
   return ref.current;
 }
