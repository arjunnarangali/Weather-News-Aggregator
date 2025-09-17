import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { WeatherData, ForecastData, TemperatureUnit } from '../types/weather';
import { NewsArticle, NewsCategory } from '../types/news';

interface TemperatureThresholds {
  coldThreshold: number; // Temperature (in Celsius) below which it's considered "cold"
  hotThreshold: number;  // Temperature (in Celsius) above which it's considered "hot"
}

interface AppState {
  weather: {
    current: WeatherData | null;
    forecast: ForecastData | null;
    loading: boolean;
    error: string | null;
  };
  news: {
    articles: NewsArticle[];
    filteredArticles: NewsArticle[];
    loading: boolean;
    error: string | null;
  };
  settings: {
    temperatureUnit: TemperatureUnit;
    selectedNewsCategories: NewsCategory[];
    temperatureThresholds: TemperatureThresholds;
    location: {
      latitude: number | null;
      longitude: number | null;
    };
  };
}

type AppAction = 
  | { type: 'SET_WEATHER_LOADING'; payload: boolean }
  | { type: 'SET_WEATHER_DATA'; payload: WeatherData }
  | { type: 'SET_FORECAST_DATA'; payload: ForecastData }
  | { type: 'SET_WEATHER_ERROR'; payload: string }
  | { type: 'SET_NEWS_LOADING'; payload: boolean }
  | { type: 'SET_NEWS_ARTICLES'; payload: NewsArticle[] }
  | { type: 'SET_FILTERED_NEWS'; payload: NewsArticle[] }
  | { type: 'SET_NEWS_ERROR'; payload: string }
  | { type: 'SET_TEMPERATURE_UNIT'; payload: TemperatureUnit }
  | { type: 'SET_NEWS_CATEGORIES'; payload: NewsCategory[] }
  | { type: 'SET_TEMPERATURE_THRESHOLDS'; payload: TemperatureThresholds }
  | { type: 'SET_LOCATION'; payload: { latitude: number; longitude: number } };

const initialState: AppState = {
  weather: {
    current: null,
    forecast: null,
    loading: false,
    error: null,
  },
  news: {
    articles: [],
    filteredArticles: [],
    loading: false,
    error: null,
  },
  settings: {
    temperatureUnit: 'celsius',
    selectedNewsCategories: ['general'],
    temperatureThresholds: {
      coldThreshold: 10,  // Default: <= 10°C is cold
      hotThreshold: 30,   // Default: >= 30°C is hot
    },
    location: {
      latitude: null,
      longitude: null,
    },
  },
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_WEATHER_LOADING':
      return {
        ...state,
        weather: { ...state.weather, loading: action.payload },
      };
    case 'SET_WEATHER_DATA':
      return {
        ...state,
        weather: { ...state.weather, current: action.payload, loading: false, error: null },
      };
    case 'SET_FORECAST_DATA':
      return {
        ...state,
        weather: { ...state.weather, forecast: action.payload },
      };
    case 'SET_WEATHER_ERROR':
      return {
        ...state,
        weather: { ...state.weather, error: action.payload, loading: false },
      };
    case 'SET_NEWS_LOADING':
      return {
        ...state,
        news: { ...state.news, loading: action.payload },
      };
    case 'SET_NEWS_ARTICLES':
      return {
        ...state,
        news: { ...state.news, articles: action.payload, loading: false, error: null },
      };
    case 'SET_FILTERED_NEWS':
      return {
        ...state,
        news: { ...state.news, filteredArticles: action.payload },
      };
    case 'SET_NEWS_ERROR':
      return {
        ...state,
        news: { ...state.news, error: action.payload, loading: false },
      };
    case 'SET_TEMPERATURE_UNIT':
      return {
        ...state,
        settings: { ...state.settings, temperatureUnit: action.payload },
      };
    case 'SET_NEWS_CATEGORIES':
      return {
        ...state,
        settings: { ...state.settings, selectedNewsCategories: action.payload },
      };
    case 'SET_TEMPERATURE_THRESHOLDS':
      return {
        ...state,
        settings: { ...state.settings, temperatureThresholds: action.payload },
      };
    case 'SET_LOCATION':
      return {
        ...state,
        settings: { ...state.settings, location: action.payload },
      };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

// Export the TemperatureThresholds type for use in other files
export type { TemperatureThresholds };