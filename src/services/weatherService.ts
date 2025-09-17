import axios from 'axios';
import { API_KEYS, API_ENDPOINTS } from '../config/apiKeys';
import { WeatherData, ForecastData, TemperatureUnit } from '../types/weather';
import { LocationCoords } from './locationService';

export class WeatherService {
  private static getUnitsParam(unit: TemperatureUnit): string {
    return unit === 'celsius' ? 'metric' : 'imperial';
  }

  static async getCurrentWeather(
    location: LocationCoords,
    unit: TemperatureUnit = 'celsius'
  ): Promise<WeatherData> {
    try {
      const response = await axios.get(`${API_ENDPOINTS.WEATHER_BASE_URL}/weather`, {
        params: {
          lat: location.latitude,
          lon: location.longitude,
          appid: API_KEYS.OPENWEATHER_API_KEY,
          units: this.getUnitsParam(unit),
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch current weather data');
    }
  }

  static async getForecast(
    location: LocationCoords,
    unit: TemperatureUnit = 'celsius'
  ): Promise<ForecastData> {
    try {
      const response = await axios.get(`${API_ENDPOINTS.WEATHER_BASE_URL}/forecast`, {
        params: {
          lat: location.latitude,
          lon: location.longitude,
          appid: API_KEYS.OPENWEATHER_API_KEY,
          units: this.getUnitsParam(unit),
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch weather forecast data');
    }
  }
}