export interface Journal {
  id: string;
  title: string;
  description: string;
  publishDate: string;
  coverImage?: string;
  pdfUrl?: string;
  symposiumId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Archive {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  pdfUrl?: string;
  symposiumId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageContent {
  id: string;
  pageKey: string;
  title: string;
  content: string;
  symposiumId: string;
  createdAt: string;
  updatedAt: string;
} 