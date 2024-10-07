import { Readability } from "@mozilla/readability"
import { parseHTML } from "linkedom"
import * as cheerio from "cheerio";
import { SearchRequest, SearchResponse, SearchResult } from "./types";

const BASE_URL = "https://sg.search.yahoo.com/search";
export const NOT_FOUND_TITLE = "Could not fetch the page.";

export async function getHtml({
  query,
  timerange,
}: SearchRequest): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    btf: timerange,
    nojs: "1",
    ei: "UTF-8",
  });
  const response = await fetch(`${BASE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText}`
    );
  }

  return {
    status: response.status,
    html: await response.text(),
    url: response.url,
  };
}

function extractRealUrl(url: string): string {
  const match = url.match(/RU=([^/]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  return url;
}

function htmlToSearchResults(html: string, numResults: number): SearchResult[] {
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  const rightPanel = $("#right .searchRightTop");
  if (rightPanel.length) {
    const rightPanelLink = rightPanel.find(".compText a").first();
    const rightPanelInfo = rightPanel.find(".compInfo li");
    const rightPanelInfoText = rightPanelInfo
      .map((_, el) => $(el).text().trim())
      .get()
      .join("\n");

    results.push({
      title: rightPanelLink.text().trim(),
      body: `${rightPanel.find(".compText").text().trim()}${
        rightPanelInfoText ? `\n\n${rightPanelInfoText}` : ""
      }`,
      url: extractRealUrl(rightPanelLink.attr("href") ?? ""),
    });
  }

  $('.algo-sr:not([class*="ad"])')
    .slice(0, numResults)
    .each((_, el) => {
      const element = $(el);
      const titleElement = element.find("h3.title a");

      results.push({
        title: titleElement.attr("aria-label") ?? "",
        body: element.find(".compText").text().trim(),
        url: extractRealUrl(titleElement.attr("href") ?? ""),
      });
    });

  return results;
}

export async function webSearch(
  search: SearchRequest,
  numResults: number
): Promise<SearchResult[]> {
  const response: SearchResponse = await getHtml(search);

  let results: SearchResult[];
  results = htmlToSearchResults(response.html, numResults);

  return results;
}

const cleanText = (text: string) =>
    text.trim()
        .replace(/(\n){4,}/g, "\n\n\n")
        // .replace(/\n\n/g, " ")
        .replace(/ {3,}/g, "  ")
        .replace(/\t/g, "")
        .replace(/\n+(\s*\n)*/g, "\n")

export async function getWebpageTitleAndText(url: string, html_str = ''): Promise<SearchResult> {

    let html = html_str
    if (!html) {
        let response: Response
        try {
            response = await fetch(url.startsWith('http') ? url : `https://${url}`)
        } catch (e) {
            return {
                title: NOT_FOUND_TITLE,
                body: `Could not fetch the page: ${e}.\nMake sure the URL is correct.`,
                url
            }
        }
        if (!response.ok) {
            return {
                title: NOT_FOUND_TITLE,
                body: `Could not fetch the page: ${response.status} ${response.statusText}`,
                url
            }
        }
        html = await response.text()
    }


    const doc = parseHTML(html).document
    const parsed = new Readability(doc).parse()

    if (!parsed || !parsed.textContent) {
        return { title: "Could not parse the page.", body: "Could not parse the page.", url }
    }

    let text = cleanText(parsed.textContent)

    if (text.length > 14400) {
        text = text.slice(0, 14400)
        text += "\n\n[Text has been trimmed to 14,500 characters.]"
    }
    return { title: parsed.title, body: text, url }
}
