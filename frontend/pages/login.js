import TopLevel from '../components/TopLevel';
import styles from '../styles/login.module.css';

function Login() {
      return (
         <div className={styles.container}>
            <div className={styles.frame}>
               <div className={styles.header}>Login</div>
               <input className={styles.input} placeholder="Email or Username" type="text" />
               <input className={styles.input} placeholder="Password" type="password" />
            </div>
         </div>
      );
}

export default function LoginWrapped() {
   return <TopLevel><Login /></TopLevel>
}