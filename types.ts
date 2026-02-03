
export interface Profile {
  id: string;
  name: string;
  bio: string;
  avatar_url: string;
  mascot_url?: string;
  slug?: string; // O nome único na URL (ex: @joao)
}

export interface LinkItem {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  icon_url: string;
  url: string;
  click_count: number;
}

export interface News {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  image_url: string;
  created_at: string;
}

export type ViewType = 'HOME' | 'ADMIN' | 'PRIVACY' | 'NEWS_LIST';

export interface Pagination {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
