## Getting Started

Download or clone the repository on github. Then, make sure to install
all dependencies by running "yarn install" in the /frontend directory.

Now, run the development server:

```bash
npm run dev
# or
yarn dev
```

In order to connect the frontend's search components to the backend, go to
/frontend/components/SearchPanelComponents/StandardSearch.js
Change line 14 
const { data, error } = useSWR(`http://localhost:7777/search/${props.query}?offset=${offset}`, fetcher);
to
const { data, error } = useSWR(`[YOUR BACKEND"S URL]/search/${props.query}?offset=${offset}`, fetcher);

Searching should then work.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
