import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSessionFromJson } from './domain.js';

const sessionKey = 'journey3.net/session';

const loadLastSession = async (getNowUtc, getNewId) => {
    const json = await AsyncStorage.getItem(sessionKey);
    if (!json) {
        return null;
    }
    return createSessionFromJson(json, getNowUtc, getNewId);
};

const saveSession = async session => {
    return AsyncStorage.setItem(sessionKey, JSON.stringify(session));
};

export default {
    loadLastSession,
    saveSession
};