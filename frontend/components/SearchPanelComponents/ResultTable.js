import styles from "../../styles/resulttable.module.css"

export default function ResultTable(props) {
   var count = 0;
   const rows = props.data.map((row) => {
      count++;
      var type = "";
      var potential_type = row.type.toLowerCase();
      if (potential_type.includes("component"))
         type = "Component";
      if (potential_type.includes("sequence"))
         type = "Sequence";
      if (potential_type.includes("module"))
         type = "Module";
      if (potential_type.includes("collection"))
         type = "Collection";
      return (
         <tr key={count}>
            <td>{row.name}</td>
            <td>{row.displayId}</td>
            <td>{row.description}</td>
            <td>{type}</td>
            <td>{row.version}</td>
         </tr>
      );
   });
   return (
      <div className={styles.tablecontainer}>
         <table className={styles.table} id={styles.results}>
            <thead>
               <tr>
                  <th>Name</th>
                  <th>Display ID</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Version</th>
               </tr>
            </thead>
            <tbody>
            {rows}
            </tbody>
         </table>
      </div>
   );
}