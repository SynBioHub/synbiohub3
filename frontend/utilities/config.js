// const fs = require('fs');
// const path = require('path');

// function getConfig() {
//     const configPath = path.resolve(process.cwd(), 'config.json');
//     const configFile = fs.readFileSync(configPath, 'utf-8');
//     return JSON.parse(configFile);
// }

// export default function Config(props) {
//     return (
//         <div>
//             <h1>Config</h1>
//             <pre>{JSON.stringify(props.config, null, 2)}</pre>
//         </div>
//     );
// }

// export async function getServerSideProps() {
//     const config = getConfig();
//     return {
//         props: {
//             config
//         }
//     }
// }

// module.exports = getConfig;