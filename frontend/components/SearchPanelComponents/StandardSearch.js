import { standardcontainer, standardresults, standardresultsloading, standarderror, count, searchnav, searchnavcontainer } from '../../styles/searchpanel.module.css';
import StandardSearchResult from './StandardSearchResult';

import Loader from 'react-loader-spinner';

import useSWR from 'swr';
import axios from 'axios'
import { useEffect, useState } from 'react';
import ResultTable from './ResultTable';

export default function StandardSearch(props) {
   const [results, setResults] = useState([]);
   const [offset, setOffset] = useState(0);
   const { data, error } = useSWR(`http://localhost:7777/search/${props.query}?offset=${offset}`, fetcher);
   const { dataCount, dataCountError } = useSWR(`http://localhost:7777/searchCount/${props.query}?offset=${offset}`, countFetcher);
   var key = 0;
   useEffect(() => {
      if (data) {
         console.log(data);
         setResults(data.map(result => {
            return <StandardSearchResult result={result} key={key++} />
         }));
      }
   }, [data]);
   if (dataCount) {
      console.log("count: " + dataCount);
   }
   if (!dataCount) {
      console.log("no data count");
   }
   if(dataCountError) {
      console.log("count error");
   }
   if (error) return <div className={standarderror}>Errors were encountered while fetching the data</div>
   if (!data) return (
      <div className={standardcontainer}>
         <div className={standardresultsloading}>
            <Loader type="Grid" color="#D25627"/>
         </div>
      </div>
   );
   if (data.length == 0) return <div className={standarderror}>No results found</div>
   else {
      return (
         <div className={standardcontainer}>
            <p className={count}>Showing {offset + 1}-{offset + results.length} of {dataCount} result(s)</p>
            <div className={searchnavcontainer}>
               <span className={searchnav} >Previous</span> <span className={searchnav}>Next</span>
            </div>
            <ResultTable data={data} />
         </div>
      );
   }
}

const fetcher = url => axios.get(url, {
   headers: {
      "Content-Type": "application/json",
      "Accept": "text/plain"
   }
}).then(res => res.data);

const countFetcher = url => axios.get(url, {
   headers: {
      "Content-Type": "text/plain",
      "Accept": "text/plain"
   }
}).then(res => res.data);