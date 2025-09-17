import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { WeatherCard } from '../components/weather/WeatherCard';
import { NewsCard } from '../components/news/NewsCard';
import { LocationService } from '../services/locationService';
import { WeatherService } from '../services/weatherService';
import { NewsService } from '../services/newsService';
import { WeatherUtils } from '../utils/weatherUtils';
import { NewsFilteringUtils } from '../utils/newsFiltering';

export const HomeScreen: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [refreshing, setRefreshing] = React.useState(false);

  // Check if user has any news categories enabled
  const hasNewsCategories = state.settings.selectedNewsCategories.length > 0;

  const loadData = async () => {
    try {
      // Get location
      dispatch({ type: 'SET_WEATHER_LOADING', payload: true });

      // Only set news loading if news categories are enabled
      if (hasNewsCategories) {
        dispatch({ type: 'SET_NEWS_LOADING', payload: true });
      }

      const location = await LocationService.getCurrentLocation();
      dispatch({ type: 'SET_LOCATION', payload: location });

      // Fetch weather data
      const [currentWeather, forecast] = await Promise.all([
        WeatherService.getCurrentWeather(location, state.settings.temperatureUnit),
        WeatherService.getForecast(location, state.settings.temperatureUnit),
      ]);

      dispatch({ type: 'SET_WEATHER_DATA', payload: currentWeather });
      dispatch({ type: 'SET_FORECAST_DATA', payload: forecast });

      // Only fetch news if user has enabled news categories
      if (hasNewsCategories) {
        try {
          // Determine weather condition and fetch relevant news
          const weatherCondition = WeatherUtils.determineWeatherCondition(
            currentWeather.main.temp,
            state.settings.temperatureUnit,
            state.settings.temperatureThresholds
          );

          console.log('Loading weather-based news for condition:', weatherCondition);
          const weatherBasedNews = await NewsFilteringUtils.fetchWeatherBasedNewsWithFallback(weatherCondition);
          dispatch({ type: 'SET_FILTERED_NEWS', payload: weatherBasedNews });

          // Fetch news from selected categories with improved error handling
          console.log('Loading news for categories:', state.settings.selectedNewsCategories);

          // Use the new method that handles rate limiting and fallbacks
          const categoryResults = await NewsService.getMultipleCategoryHeadlines(
            state.settings.selectedNewsCategories
          );

          // Combine all successful results
          const allArticles = categoryResults
            .filter(result => result.data.articles && result.data.articles.length > 0)
            .flatMap(result => result.data.articles);

          // If no articles from top-headlines, try fallback method
          if (allArticles.length === 0) {
            console.log('No articles from top-headlines, trying fallback methods...');

            // Try fallback for each category
            const fallbackPromises = state.settings.selectedNewsCategories.slice(0, 3).map(async category => {
              try {
                return await NewsService.getNewsWithFallback(category);
              } catch (error) {
                console.error(`Fallback failed for category ${category}:`, error);
                return { status: 'error', totalResults: 0, articles: [] };
              }
            });

            const fallbackResults = await Promise.all(fallbackPromises);
            const fallbackArticles = fallbackResults
              .filter(result => result.articles && result.articles.length > 0)
              .flatMap(result => result.articles);

            allArticles.push(...fallbackArticles);
          }

          // Remove duplicates based on URL and limit articles
          const uniqueArticles = allArticles.filter((article, index, self) =>
            index === self.findIndex(a => a.url === article.url)
          ).slice(0, 20);

          console.log(`Successfully loaded ${uniqueArticles.length} news articles`);
          dispatch({ type: 'SET_NEWS_ARTICLES', payload: uniqueArticles });

        } catch (newsError) {
          console.error('Error loading news:', newsError);
          dispatch({ type: 'SET_NEWS_ERROR', payload: 'Failed to load news. Please check your internet connection.' });
        }
      } else {
        // Clear news data if no categories are selected
        dispatch({ type: 'SET_NEWS_ARTICLES', payload: [] });
        dispatch({ type: 'SET_FILTERED_NEWS', payload: [] });
      }

    } catch (error) {
      console.error('Error loading data:', error);
      dispatch({ type: 'SET_WEATHER_ERROR', payload: error.message });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [state.settings.temperatureUnit, state.settings.selectedNewsCategories, state.settings.temperatureThresholds]);

  if (state.weather.loading && (!hasNewsCategories || state.news.loading)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading weather and news...</Text>
      </View>
    );
  }

  const renderNewsDisabledMessage = () => (
    <View style={styles.newsDisabledContainer}>
      <Text style={styles.newsDisabledTitle}>News Disabled</Text>
      <Text style={styles.newsDisabledText}>
        You have disabled all news categories. Go to Settings to enable news categories
        and see relevant news articles here.
      </Text>
    </View>
  );

  const renderNewsError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Unable to Load News</Text>
      <Text style={styles.errorText}>
        {state.news.error || 'There was an issue loading news. Please check your internet connection and try again.'}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {state.weather.current && (
        <WeatherCard
          weather={state.weather.current}
          unit={state.settings.temperatureUnit}
          temperatureThresholds={state.settings.temperatureThresholds}
        />
      )}

      {!hasNewsCategories ? (
        renderNewsDisabledMessage()
      ) : state.news.error ? (
        renderNewsError()
      ) : (
        <>
          <View style={styles.newsSection}>
            <Text style={styles.sectionTitle}>Weather-Based News</Text>
            {state.news.filteredArticles.length > 0 ? (
              state.news.filteredArticles.map((article, index) => (
                <NewsCard key={`filtered-${index}`} article={article} />
              ))
            ) : (
              <View style={styles.noNewsContainer}>
                <Text style={styles.noNewsText}>
                  No weather-based news found for current conditions.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.newsSection}>
            <Text style={styles.sectionTitle}>
              News from Selected Categories ({state.settings.selectedNewsCategories.join(', ')})
            </Text>
            {state.news.articles.length > 0 ? (
              state.news.articles.map((article, index) => (
                <NewsCard key={`general-${index}`} article={article} />
              ))
            ) : state.news.loading ? (
              <View style={styles.loadingNewsContainer}>
                <ActivityIndicator size="small" color="#0066cc" />
                <Text style={styles.loadingNewsText}>Loading news articles...</Text>
              </View>
            ) : (
              <View style={styles.noNewsContainer}>
                <Text style={styles.noNewsText}>
                  No news found for your selected categories. Try enabling different categories or check your internet connection.
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  newsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 10,
    marginTop: 10,
  },
  newsDisabledContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newsDisabledTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  newsDisabledText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderColor: '#f44336',
    borderWidth: 1,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    lineHeight: 20,
  },
  noNewsContainer: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noNewsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingNewsContainer: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingNewsText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
});