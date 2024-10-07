export interface SearchRequest {
  query: string;
  timerange: string;
  region: string;
}

export interface SearchResponse {
  status: number;
  html: string;
  url: string;
}

export interface SearchResult {
  title: string;
  body: string;
  url: string;
}
