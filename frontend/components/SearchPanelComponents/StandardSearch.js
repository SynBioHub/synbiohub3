import { standardcontainer, standardresults, standardresultsloading, standarderror } from '../../styles/searchpanel.module.css';
import StandardSearchResult from './StandardSearchResult';

import Loader from 'react-loader-spinner';

import useSWR from 'swr';
import axios from 'axios'
import { useEffect, useState } from 'react';

export default function StandardSearch(props) {
   const [results, setResults] = useState(null);
   const { data, error } = useSWR(`http://localhost:7777/search/${props.query}`, fetcher);
   var key = 0;
   useEffect(() => {
      if (data) {
         console.log(data);
         setResults(data.map(result => {
            return <StandardSearchResult result={result} key={key++} />
         }));
      }
   }, [data]);
   if (error) return <div className={standarderror}>Errors were encountered while fetching the data</div>
   if (!data) return (
      <div className={standardcontainer}>
         <div className={standardresultsloading}>
            <Loader type="Grid" color="#D25627"/>
         </div>
      </div>
   );
   else {
      return (
         <div className={standardcontainer}>
            <div className={standardresults}>
               {results}
            </div>
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