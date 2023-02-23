const path = window.require('path');

const getCrossPlatformAppDataFolder = () => {
    let configFilePath
    if (process.platform === "darwin") {
        configFilePath = path.join(
            window.process.env.HOME,
            "/Library/Application Support"
        )
    } else if (process.platform === "win32") {
        // Roaming包含在APPDATA中了
        configFilePath = window.process.env.APPDATA
    } else if (process.platform === "linux") {
        configFilePath = window.process.env.HOME
    }
    return configFilePath
};

export const SIYUAN_DATA_PATH = window.siyuan.config.system.dataDir;

export const PLUGIN_FOLDER = 'plugins';

export const VERSION = 'v0.1.1';

export const VERSION_URL = 'https://gitee.com/zuoez02/siyuan-plugin-system/raw/main/VERSION';

export const SCRIPT_URL = 'https://gitee.com/zuoez02/siyuan-plugin-system/raw/main/main.js';

export const PLUGIN_SYS_ABS_PATH = path.join(getCrossPlatformAppDataFolder(), '.siyuan', 'plugin.js');

