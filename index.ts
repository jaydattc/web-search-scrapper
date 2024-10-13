import express from 'express';
import morgan from 'morgan';
import { NOT_FOUND_TITLE, getWebpageTitleAndText, webSearch } from "./utils";

const app = express();
const port = 3300;

app.use(morgan('combined'))

app.get('/search-results', async (req, res) => {
  const searchRequest = {
    query: req.query.query as string,
    timerange: "",
    region: "wt-wt",
  };
  const searchResults = await webSearch(searchRequest, 8);
  res.json(searchResults)
});

app.get('/webcontent', async (req, res) => {
  const searchRequest = {
    query: req.query.query as string,
    timerange: "",
    region: "wt-wt",
  };
  const searchResults = await webSearch(searchRequest, 8);
  const webPagesContent = [];
  for (let searchResult of searchResults) {
    const content = await getWebpageTitleAndText(searchResult.url);
    if (content.title != NOT_FOUND_TITLE) webPagesContent.push(content);
  }
  res.json(webPagesContent);
})

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
