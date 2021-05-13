import Image from 'next/image';
import { centerheader, headertext } from '../../../../styles/resulttable.module.css';

export default function ResultTableHeader(props) {
  return (
    <th>
      <div className={centerheader}>
        <span className={headertext}>{props.title}</span>

        <Image
          alt="table header"
          height={20}
          src="/images/updown.svg"
          width={20}
        />
      </div>
    </th>
  );
}
