import { standardcontainer, standardresults, standardresultsloading, standarderror } from '../../styles/searchpanel.module.css';
import StandardSearchResult from './StandardSearchResult';

import Loader from 'react-loader-spinner';

import useSWR from 'swr';
import axios from 'axios'

export default function StandardSearch() {
   const { data, error } = useSWR('https://api.coindesk.com/v1/bpi/currentprice.json', fetcher)
   if (error) return <div className={standarderror}>Errors were encountered while fetching the data</div>
   if (!data) return (
      <div className={standardcontainer}>
         <div className={standardresultsloading}>
            <Loader type="Grid" color="#D25627"/>
         </div>
      </div>
   );
   else {
      console.log(data);
      return (
         <div className={standardcontainer}>
            <div className={standardresults}>
               <StandardSearchResult />
               <StandardSearchResult />
               <StandardSearchResult />
               <StandardSearchResult />
               <StandardSearchResult />
               <StandardSearchResult />
               <StandardSearchResult />
               <StandardSearchResult />
               <StandardSearchResult />
               <StandardSearchResult />
            </div>
         </div>
      );
   }
}

const fetcher = url => axios.get(url, {
   headers: {
      "Content-Type": "application/json"
   }
}).then(res => res.data);