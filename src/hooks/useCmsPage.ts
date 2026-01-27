import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CmsPageContent {
  hero?: {
    title: string;
    subtitle?: string;
  };
  sections?: Array<{
    title: string;
    content: string;
  }>;
  items?: Array<{
    question: string;
    answer: string;
  }>;
  info?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    hours?: string;
  };
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: CmsPageContent;
  meta_description: string | null;
  status: 'draft' | 'published' | 'hidden';
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useCmsPage = (slug: string) => {
  return useQuery({
    queryKey: ['cms-page', slug],
    queryFn: async (): Promise<CmsPage | null> => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.error('Error fetching CMS page:', error);
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        content: data.content as CmsPageContent,
        status: data.status as 'draft' | 'published' | 'hidden',
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCmsPages = () => {
  return useQuery({
    queryKey: ['cms-pages'],
    queryFn: async (): Promise<CmsPage[]> => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .order('title');

      if (error) {
        console.error('Error fetching CMS pages:', error);
        throw error;
      }

      return (data || []).map(page => ({
        ...page,
        content: page.content as CmsPageContent,
        status: page.status as 'draft' | 'published' | 'hidden',
      }));
    },
  });
};
