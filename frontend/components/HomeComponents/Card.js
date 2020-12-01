import { card, cardicon, cardhead } from '../../styles/home.module.css'

export default function Card(props) {
   const title = props.icon ? (
      <div className={cardhead}>
         <h3>{props.title}</h3>
         <img
            style= {props.iconheight ? { height: props.iconheight, verticalAlign: props.iconoffset, marginLeft: props.iconright} : {}}
            src={props.icon}
            className={cardicon}
         />
      </div>
   ) : <h3>{props.title} <span style={{color: "black"}}>&rarr;</span></h3>;
   return (
      <a className={card} onClick={() => {
         if(props.setSearching)
            props.setSearching(true);
      }}>
         {title}
         <p>{props.description}</p>
      </a>
   )
}