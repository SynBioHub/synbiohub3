# Getting Started
## Frontend
Download or clone the repository on github. Then, make sure to install 
all dependencies by running the following command in your terminal in the /frontend directory:
```bash
yarn install
# or
npm install
```

In order to connect the frontend to your backend, go to the next.config.js file.
Then, change the env backendUrl variable to your backend's url.

Finally, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3333](http://localhost:3333) with your browser to see the result.

### Developer Notes

Each component/page in SynBioHub should have a header which dicatates its purpose.

This app utilizes Redux to handle global application state and simplify the passing of
deeply nested props. To view how this application uses Redux, see the /redux directory.

This app uses eslint that is set up for React/Next.js code. To run the linter, navigate to
the frontend directory in your terminal (the directory this README is in) and run the command:
```
npm run lint
```
If you'd like to format all code and fix minor styling errors (recommened before pushing anything
to the directory), run the command:
```
npm run lint.fix
```

### Next.js Resources

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.


## Backend
### Enviroment Setup
[IntelliJ IDEA](https://www.jetbrains.com/idea/download/) is highly recommended for backend development. The community edition is free to download.
Make sure that a JDK is available on your machine. Java version 11 or greater is recommended. If you do not have a JDK, go [here](https://www.azul.com/downloads/?package=jdk#download-openjdk) and download one for your system. Java 17 LTS is recommended.

## Project Setup
Once you have finished installing the developer tools, clone the repository and open it as a project in IntelliJ. To setup your JDK, go to File->Project Structure->Project->ProjectSDK and click on your downloaded Java JDK.

## Running
You can run the application by right clicking the `Synbiohub3Application` class and clicking run. On later runs, simply clikc the run or debut icons at the top right of your screen.

## Troubleshooting
If IntelliJ is warning about packages not being found, right click on the `pom.xml` file and click Maven->Reload Project. This should download all required dependencies to run the application.
