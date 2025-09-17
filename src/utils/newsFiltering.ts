import { NewsArticle, NewsFilterType } from '../types/news';
import { WeatherCondition } from '../types/weather';
import { NewsService } from '../services/newsService';

export class NewsFilteringUtils {
  private static readonly WEATHER_TO_NEWS_MAP: Record<WeatherCondition, NewsFilterType> = {
    cold: 'depressing',
    hot: 'fear',
    cool: 'winning',
  };

  private static readonly NEWS_KEYWORDS: Record<NewsFilterType, string[]> = {
    depressing: ['tragedy', 'death', 'disaster', 'crisis', 'loss', 'defeat', 'failure', 'recession', 'unemployment', 'sad', 'mourning'],
    fear: ['terror', 'attack', 'threat', 'danger', 'violence', 'crime', 'war', 'conflict', 'emergency', 'fear', 'scary'],
    winning: ['victory', 'success', 'achievement', 'celebration', 'winner', 'breakthrough', 'progress', 'joy', 'happiness', 'champion', 'triumph'],
  };

  private static readonly INDIA_CONTEXT_KEYWORDS: Record<NewsFilterType, string[]> = {
    depressing: ['India tragedy', 'India crisis', 'India disaster', 'India unemployment', 'India recession'],
    fear: ['India security', 'India violence', 'India crime', 'India terror', 'India conflict'],
    winning: ['India success', 'India victory', 'India achievement', 'India celebration', 'India champion', 'India progress'],
  };

  static getNewsFilterForWeather(weatherCondition: WeatherCondition): NewsFilterType {
    return this.WEATHER_TO_NEWS_MAP[weatherCondition];
  }

  static filterNewsByWeather(articles: NewsArticle[], weatherCondition: WeatherCondition): NewsArticle[] {
    const filterType = this.getNewsFilterForWeather(weatherCondition);
    const keywords = this.NEWS_KEYWORDS[filterType];
    
    return articles.filter(article => {
      const searchText = `${article.title} ${article.description || ''}`.toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
    });
  }

  static async fetchWeatherBasedNews(weatherCondition: WeatherCondition): Promise<NewsArticle[]> {
    const filterType = this.getNewsFilterForWeather(weatherCondition);
    const keywords = this.NEWS_KEYWORDS[filterType];
    const indiaKeywords = this.INDIA_CONTEXT_KEYWORDS[filterType];
    
    try {
      console.log(`Fetching weather-based news for condition: ${weatherCondition} (${filterType})`);
      
      // Combine regular keywords and India-specific keywords
      const allKeywords = [...indiaKeywords, ...keywords.slice(0, 2)];
      
      // Fetch news for each keyword with improved error handling
      const newsPromises = allKeywords.map(async keyword => {
        try {
          console.log(`Searching for: ${keyword}`);
          const result = await NewsService.searchNews(keyword);
          return result.articles || [];
        } catch (error) {
          console.error(`Error fetching news for keyword "${keyword}":`, error);
          return [];
        }
      });
      
      const newsResults = await Promise.all(newsPromises);
      const allArticles = newsResults.flat();
      
      // Remove duplicates based on URL
      const uniqueArticles = allArticles.filter((article, index, self) => 
        index === self.findIndex(a => a.url === article.url)
      );
      
      // Filter articles that don't match our criteria
      const filteredArticles = uniqueArticles.filter(article => {
        const searchText = `${article.title} ${article.description || ''}`.toLowerCase();
        const allRelevantKeywords = [...keywords, ...indiaKeywords.map(k => k.split(' ').pop())];
        return allRelevantKeywords.some((keyword) => 
          searchText.includes(keyword?.toLowerCase())
        );
      });
      
      console.log(`Found ${filteredArticles.length} weather-based articles for ${filterType}`);
      
      // Return limited articles, prioritizing those with images
      const articlesWithImages = filteredArticles.filter(article => article.urlToImage);
      const articlesWithoutImages = filteredArticles.filter(article => !article.urlToImage);
      
      const finalArticles = [...articlesWithImages, ...articlesWithoutImages].slice(0, 10);
      
      return finalArticles;
    } catch (error) {
      console.error('Error fetching weather-based news:', error);
      return [];
    }
  }


  static async fetchWeatherBasedNewsWithFallback(weatherCondition: WeatherCondition): Promise<NewsArticle[]> {
    let articles = await this.fetchWeatherBasedNews(weatherCondition);
    
    if (articles.length === 0) {
      console.log('No weather-based news found, trying broader search...');
      
      const filterType = this.getNewsFilterForWeather(weatherCondition);
      const broadSearchTerms = {
        depressing: 'India news crisis OR tragedy OR loss',
        fear: 'India news security OR crime OR danger',
        winning: 'India news success OR victory OR achievement'
      };
      
      try {
        const broadResult = await NewsService.searchNews(broadSearchTerms[filterType]);
        articles = (broadResult.articles || []).slice(0, 5);
        console.log(`Fallback search found ${articles.length} articles`);
      } catch (error) {
        console.error('Fallback search also failed:', error);
      }
    }
    
    return articles;
  }
}