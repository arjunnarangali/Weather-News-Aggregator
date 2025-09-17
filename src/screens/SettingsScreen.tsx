import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppContext } from '../context/AppContext';
import { WeatherUtils } from '../utils/weatherUtils';
import { NewsCategory } from '../types/news';
import { TemperatureUnit } from '../types/weather';

export const SettingsScreen: React.FC = () => {
  const { state, dispatch } = useAppContext();
  
  // Local state for temperature threshold editing
  const [editingThresholds, setEditingThresholds] = useState(false);
  const [localColdThreshold, setLocalColdThreshold] = useState(state.settings.temperatureThresholds.coldThreshold);
  const [localHotThreshold, setLocalHotThreshold] = useState(state.settings.temperatureThresholds.hotThreshold);

  const toggleTemperatureUnit = () => {
    const newUnit: TemperatureUnit = 
      state.settings.temperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius';
    dispatch({ type: 'SET_TEMPERATURE_UNIT', payload: newUnit });
  };

  const toggleNewsCategory = (category: NewsCategory) => {
    const currentCategories = state.settings.selectedNewsCategories;
    const isSelected = currentCategories.includes(category);
    
    // If trying to disable the last category, show warning
    if (isSelected && currentCategories.length === 1) {
      Alert.alert(
        'Disable All News?',
        'You are about to disable all news categories. This will hide all news from the home screen. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Yes, Disable All', 
            style: 'destructive',
            onPress: () => {
              const newCategories = currentCategories.filter(c => c !== category);
              dispatch({ type: 'SET_NEWS_CATEGORIES', payload: newCategories });
            }
          },
        ]
      );
      return;
    }
    
    let newCategories: NewsCategory[];
    if (isSelected) {
      newCategories = currentCategories.filter(c => c !== category);
    } else {
      newCategories = [...currentCategories, category];
    }
    
    dispatch({ type: 'SET_NEWS_CATEGORIES', payload: newCategories });
  };

  const enableAllCategories = () => {
    const allCategories: NewsCategory[] = [
      'general', 'business', 'entertainment', 
      'health', 'science', 'sports', 'technology'
    ];
    dispatch({ type: 'SET_NEWS_CATEGORIES', payload: allCategories });
  };

  const disableAllCategories = () => {
    Alert.alert(
      'Disable All News Categories?',
      'This will hide all news from the home screen. You can re-enable categories anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disable All', 
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'SET_NEWS_CATEGORIES', payload: [] });
          }
        },
      ]
    );
  };

  const startEditingThresholds = () => {
    setLocalColdThreshold(state.settings.temperatureThresholds.coldThreshold);
    setLocalHotThreshold(state.settings.temperatureThresholds.hotThreshold);
    setEditingThresholds(true);
  };

  const saveThresholds = () => {
    const validation = WeatherUtils.validateThresholds(localColdThreshold, localHotThreshold);
    
    if (!validation.isValid) {
      Alert.alert('Invalid Thresholds', validation.error);
      return;
    }

    dispatch({
      type: 'SET_TEMPERATURE_THRESHOLDS',
      payload: {
        coldThreshold: localColdThreshold,
        hotThreshold: localHotThreshold,
      }
    });
    
    setEditingThresholds(false);
    
    Alert.alert(
      'Thresholds Updated',
      'Temperature thresholds have been updated successfully. Weather-based news filtering will use the new thresholds.'
    );
  };

  const cancelEditingThresholds = () => {
    setLocalColdThreshold(state.settings.temperatureThresholds.coldThreshold);
    setLocalHotThreshold(state.settings.temperatureThresholds.hotThreshold);
    setEditingThresholds(false);
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults?',
      'This will reset temperature thresholds to default values (Cold: ≤10°C, Hot: ≥30°C).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            dispatch({
              type: 'SET_TEMPERATURE_THRESHOLDS',
              payload: { coldThreshold: 10, hotThreshold: 30 }
            });
            setLocalColdThreshold(10);
            setLocalHotThreshold(30);
            setEditingThresholds(false);
          }
        }
      ]
    );
  };

  const newsCategories: NewsCategory[] = [
    'general', 'business', 'entertainment', 
    'health', 'science', 'sports', 'technology'
  ];

  const hasNoCategories = state.settings.selectedNewsCategories.length === 0;
  const thresholdDisplay = WeatherUtils.getThresholdDisplay(
    state.settings.temperatureThresholds, 
    state.settings.temperatureUnit
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Temperature Unit</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>
            Use {state.settings.temperatureUnit === 'celsius' ? 'Fahrenheit' : 'Celsius'}
          </Text>
          <Switch
            value={state.settings.temperatureUnit === 'fahrenheit'}
            onValueChange={toggleTemperatureUnit}
          />
        </View>
        <Text style={styles.currentUnit}>
          Current: {state.settings.temperatureUnit === 'celsius' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weather Condition Thresholds</Text>
          {!editingThresholds && (
            <TouchableOpacity onPress={startEditingThresholds} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.thresholdDescription}>
          Customize when weather is considered "cold", "cool", or "hot" for news filtering.
        </Text>

        {!editingThresholds ? (
          <View style={styles.thresholdDisplay}>
            <View style={styles.thresholdItem}>
              <Text style={styles.thresholdLabel}>❄️ Cold:</Text>
              <Text style={[styles.thresholdValue, { color: '#3498db' }]}>≤ {thresholdDisplay.cold}</Text>
            </View>
            <View style={styles.thresholdItem}>
              <Text style={styles.thresholdLabel}>🌤️ Cool:</Text>
              <Text style={[styles.thresholdValue, { color: '#2ecc71' }]}>
                {thresholdDisplay.cold} - {thresholdDisplay.hot}
              </Text>
            </View>
            <View style={styles.thresholdItem}>
              <Text style={styles.thresholdLabel}>🔥 Hot:</Text>
              <Text style={[styles.thresholdValue, { color: '#e74c3c' }]}>≥ {thresholdDisplay.hot}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.thresholdEditor}>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>
                ❄️ Cold Threshold: ≤ {Math.round(localColdThreshold)}°C
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={-10}
                maximumValue={25}
                value={localColdThreshold}
                onValueChange={setLocalColdThreshold}
                step={1}
                minimumTrackTintColor="#3498db"
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor="#3498db"
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>
                🔥 Hot Threshold: ≥ {Math.round(localHotThreshold)}°C
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={20}
                maximumValue={50}
                value={localHotThreshold}
                onValueChange={setLocalHotThreshold}
                step={1}
                minimumTrackTintColor="#e74c3c"
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor="#e74c3c"
              />
            </View>

            <Text style={styles.previewText}>
              🌤️ Cool range: {Math.round(localColdThreshold + 1)}°C - {Math.round(localHotThreshold - 1)}°C
            </Text>

            <View style={styles.thresholdButtons}>
              <TouchableOpacity onPress={cancelEditingThresholds} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={resetToDefaults} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveThresholds} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>News Categories</Text>
          <Text style={styles.categoryCount}>
            {state.settings.selectedNewsCategories.length} of {newsCategories.length} selected
          </Text>
        </View>

        {hasNoCategories && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ No news categories selected. News will not be displayed on the home screen.
            </Text>
          </View>
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.enableAllButton]}
            onPress={enableAllCategories}
          >
            <Text style={styles.actionButtonText}>Enable All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.disableAllButton]}
            onPress={disableAllCategories}
          >
            <Text style={[styles.actionButtonText, styles.disableAllButtonText]}>
              Disable All
            </Text>
          </TouchableOpacity>
        </View>

        {newsCategories.map((category) => (
          <TouchableOpacity
            key={category}
            style={styles.categoryRow}
            onPress={() => toggleNewsCategory(category)}
          >
            <Text style={styles.categoryLabel}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            <Switch
              value={state.settings.selectedNewsCategories.includes(category)}
              onValueChange={() => toggleNewsCategory(category)}
            />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 16,
  },
  currentUnit: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  editButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  thresholdDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  thresholdDisplay: {
    marginTop: 10,
  },
  thresholdItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  thresholdLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  thresholdValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  thresholdEditor: {
    marginTop: 10,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  previewText: {
    fontSize: 14,
    color: '#2ecc71',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  thresholdButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 5,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
    marginLeft: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  enableAllButton: {
    backgroundColor: '#0066cc',
  },
  disableAllButton: {
    backgroundColor: '#fff',
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  disableAllButtonText: {
    color: '#dc3545',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryLabel: {
    fontSize: 16,
  },
});