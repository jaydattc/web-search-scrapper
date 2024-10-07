import {webSearch} from "./utils";

(async () => {
  const searchRequest = {
    query: "Supply Chain SaaS",
    timerange: "",
    region: "wt-wt"
  }
  const searchResult = await webSearch(searchRequest, 5)
  console.log(searchResult, 'hels')
  debugger;
})()
