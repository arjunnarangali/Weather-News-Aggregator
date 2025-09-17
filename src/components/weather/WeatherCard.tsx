import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { WeatherData, TemperatureUnit } from '../../types/weather';
import { TemperatureThresholds } from '../../context/AppContext';
import { WeatherUtils } from '../../utils/weatherUtils';

interface WeatherCardProps {
  weather: WeatherData;
  unit: TemperatureUnit;
  temperatureThresholds: TemperatureThresholds;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather, unit, temperatureThresholds }) => {
  const condition = WeatherUtils.determineWeatherCondition(weather.main.temp, unit, temperatureThresholds);
  const thresholdDisplay = WeatherUtils.getThresholdDisplay(temperatureThresholds, unit);
  
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'cold': return '#3498db'; // Blue
      case 'hot': return '#e74c3c';  // Red
      case 'cool': return '#2ecc71'; // Green
      default: return '#95a5a6';     // Gray
    }
  };
  
  const getConditionDescription = (condition: string) => {
    switch (condition) {
      case 'cold': return `Cold (≤ ${thresholdDisplay.cold})`;
      case 'hot': return `Hot (≥ ${thresholdDisplay.hot})`;
      case 'cool': return `Cool (${thresholdDisplay.cold} - ${thresholdDisplay.hot})`;
      default: return condition;
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.city}>{weather.name}</Text>
      <View style={styles.mainInfo}>
        <Image
          source={{
            uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`
          }}
          style={styles.weatherIcon}
        />
        <Text style={styles.temperature}>
          {WeatherUtils.getTemperatureDisplay(weather.main.temp, unit)}
        </Text>
      </View>
      <Text style={styles.description}>{weather.weather[0].description}</Text>
      <View style={styles.conditionContainer}>
        <Text style={styles.conditionLabel}>Weather Mood:</Text>
        <Text style={[styles.condition, { color: getConditionColor(condition) }]}>
          {getConditionDescription(condition)}
        </Text>
      </View>
      <Text style={styles.hint}>
        🔧 Customize temperature thresholds in Settings
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  city: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  weatherIcon: {
    width: 60,
    height: 60,
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  description: {
    fontSize: 16,
    textTransform: 'capitalize',
    marginBottom: 10,
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  condition: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});