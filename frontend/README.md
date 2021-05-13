## Getting Started

Download or clone the repository on github. Then, make sure to install
all dependencies by running "yarn install" in the /frontend directory.

In order to connect the frontend to your backend, go to the next.config.js file.
Then, change the env backendUrl variable to your backend's url.

Finally, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Developer Notes

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

## Next.js Resources

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
