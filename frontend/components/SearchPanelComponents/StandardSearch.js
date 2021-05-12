import { standardcontainer, standardresultsloading, standarderror, countloader, countloadercontainer } from '../../styles/searchpanel.module.css';

import useSWR from 'swr';
import axios from 'axios'
import { useEffect, useState } from 'react';

import Loader from 'react-loader-spinner';
import ResultTable from './ResultTable/ResultTable';
import { useSelector } from 'react-redux';

export default function StandardSearch(props) {
   const query = useSelector(state => state.search.query);
   const [offset, setOffset] = useState(0);
   const [count, setCount] = useState(undefined);
   useEffect(() => {
      setOffset(0);
      setCount(
         <div className={countloadercontainer}>
            <Loader type="ThreeDots" color="#D25627" width={25} height={10} className={countloader} />
         </div>);
      const params = { headers: { "content-type": "text/plain; charset=UTF-8" } };
      fetch(`${process.env.backendUrl}/searchCount/${query}`, params)
         .then(res => res.json()).then(data => setCount(data));

   }, [query]);
   const { data, error } = useSWR(`${process.env.backendUrl}/search/${query}?offset=${offset}`, fetcher);
   if (error) return <div className={standarderror}>Errors were encountered while fetching the data</div>
   if (!data) return (
      <div className={standardcontainer}>
         <div className={standardresultsloading}>
            <Loader type="Grid" color="#D25627" />
         </div>
      </div>
   );

   if (data.length == 0) return <div className={standarderror}>No results found</div>
   else {
      return (
         <div className={standardcontainer}>
            <ResultTable data={data} basketItems={props.basketItems} setBasketItems={props.setBasketItems} count={count} offset={offset} setOffset={setOffset} />
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
