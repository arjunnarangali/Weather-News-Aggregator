import { WeatherCondition } from '../types/weather';
import { TemperatureThresholds } from '../context/AppContext';

export class WeatherUtils {
  static determineWeatherCondition(
    temperature: number, 
    unit: 'celsius' | 'fahrenheit',
    thresholds: TemperatureThresholds
  ): WeatherCondition {
    // Convert to Celsius if needed
    const tempInCelsius = unit === 'fahrenheit' ? (temperature - 32) * 5/9 : temperature;
    
    if (tempInCelsius <= thresholds.coldThreshold) {
      return 'cold';
    } else if (tempInCelsius >= thresholds.hotThreshold) {
      return 'hot';
    } else {
      return 'cool';
    }
  }

  static getTemperatureDisplay(temp: number, unit: 'celsius' | 'fahrenheit'): string {
    const symbol = unit === 'celsius' ? '°C' : '°F';
    return `${Math.round(temp)}${symbol}`;
  }

  // Helper method to convert temperature between units
  static convertTemperature(temp: number, fromUnit: 'celsius' | 'fahrenheit', toUnit: 'celsius' | 'fahrenheit'): number {
    if (fromUnit === toUnit) return temp;
    
    if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
      return (temp * 9/5) + 32;
    } else {
      return (temp - 32) * 5/9;
    }
  }

  // Helper method to get threshold display based on current unit
  static getThresholdDisplay(
    thresholds: TemperatureThresholds, 
    unit: 'celsius' | 'fahrenheit'
  ): { cold: string; hot: string } {
    if (unit === 'celsius') {
      return {
        cold: `${Math.round(thresholds.coldThreshold)}°C`,
        hot: `${Math.round(thresholds.hotThreshold)}°C`
      };
    } else {
      const coldF = this.convertTemperature(thresholds.coldThreshold, 'celsius', 'fahrenheit');
      const hotF = this.convertTemperature(thresholds.hotThreshold, 'celsius', 'fahrenheit');
      return {
        cold: `${Math.round(coldF)}°F`,
        hot: `${Math.round(hotF)}°F`
      };
    }
  }

  // Method to validate temperature thresholds
  static validateThresholds(coldThreshold: number, hotThreshold: number): { isValid: boolean; error?: string } {
    if (coldThreshold >= hotThreshold) {
      return {
        isValid: false,
        error: 'Cold threshold must be less than hot threshold'
      };
    }
    
    if (coldThreshold < -50 || coldThreshold > 50) {
      return {
        isValid: false,
        error: 'Cold threshold must be between -50°C and 50°C'
      };
    }
    
    if (hotThreshold < 0 || hotThreshold > 60) {
      return {
        isValid: false,
        error: 'Hot threshold must be between 0°C and 60°C'
      };
    }
    
    return { isValid: true };
  }
}