import { centerheader, headertext } from "../../../styles/resulttable.module.css";
import Image from 'next/image';

export default function ResultTableHeader(props) {
   return (
      <th>
         <div className={centerheader}>
            <span className={headertext}>{props.title}</span>
            <Image 
            src='/images/updown.svg'
            alt='table header'
            width={20}
            height={20}/>
         </div>
      </th>
   );
}