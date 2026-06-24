/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { app, BrowserWindow, nativeTheme } from 'electron';
import started from 'electron-squirrel-startup';
import path from 'node:path';

if (started) {
    app.quit();
}

nativeTheme.themeSource = 'light';

const createWindow = () => {
    const preloadPath = path.join(__dirname, 'preload.js');

    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1280,
        minHeight: 800,
        frame: false,
        titleBarStyle: 'hidden',
        autoHideMenuBar: true,
        backgroundColor: '#00000000',
        webPreferences: {
            preload: preloadPath
        },
        trafficLightPosition: {
            x: 20,
            y: 16
        },
        vibrancy: 'sidebar',
        visualEffectState: 'active',
        transparent: true
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
        return;
    }

    mainWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
