import axios from 'axios';
import { API_KEYS, API_ENDPOINTS } from '../config/apiKeys';
import { NewsResponse, NewsCategory } from '../types/news';

export class NewsService {
  // Rate limiting: Add delay between requests
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async getTopHeadlines(
    category: NewsCategory = 'general',
    country: string = 'in'
  ): Promise<NewsResponse> {
    try {
      console.log(`Fetching news for category: ${category}, country: ${country}`);
      
      const response = await axios.get(`${API_ENDPOINTS.NEWS_BASE_URL}/top-headlines`, {
        params: {
          country,
          category,
          apiKey: API_KEYS.NEWS_API_KEY,
          pageSize: 20, // Limit results
        },
        timeout: 10000, // 10 second timeout
      });
      
      console.log(`Successfully fetched ${response.data.articles?.length || 0} articles for ${category}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching headlines for category ${category}:`, error.response?.data || error.message);
      
      // Return empty response instead of throwing error
      return {
        status: 'error',
        totalResults: 0,
        articles: []
      };
    }
  }

  // Get multiple categories with proper rate limiting
  static async getMultipleCategoryHeadlines(
    categories: NewsCategory[],
    country: string = 'in'
  ): Promise<{ category: NewsCategory; data: NewsResponse }[]> {
    const results: { category: NewsCategory; data: NewsResponse }[] = [];
    
    // Sequential requests to avoid rate limiting
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      
      try {
        const data = await this.getTopHeadlines(category, country);
        results.push({ category, data });
        
        // Add delay between requests (except for the last one)
        if (i < categories.length - 1) {
          await this.delay(500); // 500ms delay between requests
        }
      } catch (error) {
        console.error(`Failed to fetch news for category: ${category}`, error);
        // Add empty result for failed category
        results.push({ 
          category, 
          data: { status: 'error', totalResults: 0, articles: [] }
        });
      }
    }
    
    return results;
  }

  // Fallback method using 'everything' endpoint for better results
  static async searchNewsByCategory(
    category: NewsCategory,
    country: string = 'in'
  ): Promise<NewsResponse> {
    try {
      // Map categories to search terms for better results
      const categorySearchTerms: Record<NewsCategory, string> = {
        general: 'India news',
        business: 'India business economy',
        entertainment: 'India entertainment bollywood',
        health: 'India health medical',
        science: 'India science technology research',
        sports: 'India sports cricket',
        technology: 'India technology startup tech'
      };

      const searchTerm = categorySearchTerms[category] || `India ${category}`;
      
      console.log(`Searching news with term: ${searchTerm}`);
      
      const response = await axios.get(`${API_ENDPOINTS.NEWS_BASE_URL}/everything`, {
        params: {
          q: searchTerm,
          apiKey: API_KEYS.NEWS_API_KEY,
          sortBy: 'publishedAt',
          language: 'en',
          pageSize: 15,
        },
        timeout: 10000,
      });
      
      console.log(`Search found ${response.data.articles?.length || 0} articles for ${category}`);
      return response.data;
    } catch (error) {
      console.error(`Error searching news for category ${category}:`, error.response?.data || error.message);
      return {
        status: 'error',
        totalResults: 0,
        articles: []
      };
    }
  }

  static async searchNews(query: string): Promise<NewsResponse> {
    try {
      const response = await axios.get(`${API_ENDPOINTS.NEWS_BASE_URL}/everything`, {
        params: {
          q: query,
          apiKey: API_KEYS.NEWS_API_KEY,
          sortBy: 'relevancy',
          language: 'en',
          pageSize: 20,
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error('Error searching news:', error.response?.data || error.message);
      throw new Error('Failed to search news');
    }
  }

  // Method to get news with fallback strategy
  static async getNewsWithFallback(
    category: NewsCategory,
    country: string = 'in'
  ): Promise<NewsResponse> {
    // First try top-headlines
    const topHeadlines = await this.getTopHeadlines(category, country);
    
    // If no articles found, try search method
    if (!topHeadlines.articles || topHeadlines.articles.length === 0) {
      console.log(`No top headlines found for ${category}, trying search method...`);
      return await this.searchNewsByCategory(category, country);
    }
    
    return topHeadlines;
  }
}