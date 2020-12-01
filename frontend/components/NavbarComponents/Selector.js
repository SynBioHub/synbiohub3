import { navoption, navoptionname, navoptionicon } from '../../styles/navbar.module.css'

export default function Selector(props) {
   return (
      <div className={navoption}>
         <img
            src={props.icon}
            className={navoptionicon}
         />
         <span className={navoptionname}>{props.name}</span>
      </div>
   );
}