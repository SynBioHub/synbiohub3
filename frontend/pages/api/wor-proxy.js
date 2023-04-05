import axios from 'axios';

export default async function handler(req, res) {
  const { url, headers } = req.body;
  const response = await axios.get(url, { headers });
  res.status(response.status).json(response.data);
}
