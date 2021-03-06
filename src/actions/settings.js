// @flow

import { AsyncStorage } from "react-native";
import { updateScoresWithUsername } from "./firebase/";

const USER_SETTINGS = "userSettings";

function saveSettingsToStorage(props: SaveType) {
  AsyncStorage.setItem(USER_SETTINGS, JSON.stringify(props));
}

export function getUserSettingsFromStorage() {
  return new Promise(async (resolve, reject) => {
    try {
      resolve(JSON.parse(await AsyncStorage.getItem(USER_SETTINGS)));
    } catch (err) {
      reject(err);
    }
  });
}

type SaveType = {
  username: string,
  soundsEnabled: boolean,
  themeName: string
};

export function saveSettings(props: SaveType) {
  const { username, soundsEnabled } = props;
  saveSettingsToStorage(props);
  updateScoresWithUsername(username);

  return {
    type: "SAVE_SETTINGS",
    payload: {
      username: username,
      soundsEnabled: soundsEnabled,
      theme: props.themeName
    }
  };
}

function getSettings(settings: SaveType) {
  return {
    type: "SAVE_SETTINGS",
    payload: settings
  };
}

export function loadSettings() {
  return async (dispatch: any) => {
    try {
      dispatch(saveSettings(await getUserSettingsFromStorage()));
    } catch (err) {
      if (__DEV__) {
        console.log("No settings or error getting user settings");
      }
    }
  };
}
