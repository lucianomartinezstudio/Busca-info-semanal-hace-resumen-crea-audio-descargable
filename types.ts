
export interface NewsSection {
  title: string;
  content: string;
  category: string;
  keyPoints: string[];
}

export interface AnalysisResult {
  sections: NewsSection[];
  summary: string;
  sources: Array<{ title: string; web: { uri: string } }>;
}
