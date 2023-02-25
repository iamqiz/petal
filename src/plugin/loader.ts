import { Plugin } from "./plugin";
import { apiGenerate } from "./api";
import { modules } from "./module";
import { getAllPlugins } from "../worker/plugin";
import { IPlugin } from "../type";
import { internalPlugins } from "../internal";
import { log } from "../util";
import { injectable } from "inversify";

let components: { [key: string]: any };

@injectable()
export class PluginLoader {
    loadedPlugins: Map<string, Plugin>;

    constructor() {
        this.loadedPlugins = new Map();
    }

    async loadEnabledPlugins(plugins: IPlugin[]) {
        if (!plugins || !plugins.length) {
            return;
        }
        for (const p of plugins) {
            if (!p.enabled) {
                break;
            }
            await this.loadPlugin(p);
        };
    }

    async loadAllInternalPlugins() {
        internalPlugins.forEach((p) => {
            const plug = new p.plugin();
            if (!(plug instanceof Plugin)) {
                throw new Error(`Failed to load plugin ${p.name}`);
            }
            log(`Load internal plugin: ${p.key}(${p.name})`);
            plug.onload();
            this.loadedPlugins.set(p.key, plug);
        })
    }

    async loadAllLocalPlugins() {
        const plugins = await getAllPlugins();
        if (!plugins) {
            return;
        }
        for (const p of plugins) {
            await this.loadPlugin(p);
        }
    }

    async loadPlugin(plugin: IPlugin) {
        if (!components) {
            this.generateRequiredModules();
        }
        if (!plugin.enabled || (!plugin.plugin && !plugin.script)) {
            return;
        }
        if (plugin.plugin) {
            // internal plugin
            const plug = new plugin.plugin();
            if (!(plug instanceof Plugin)) {
                throw new Error(`Failed to load plugin ${plugin.name}`);
            }
            log(`Load internal plugin: ${plugin.key}(${plugin.name})`);
            await plug.onload();
            this.loadedPlugins.set(plugin.key, plug);
            return;
        }
        const exports: { [key: string]: any } = {};
        const module = { exports };
        function run(script: string, name: string) {
            return eval("(function anonymous(require,module,exports){".concat(script, "\n})\n//# sourceURL=").concat(name, "\n"));
        }
        const __require = (name: string) => {
            if (components[name]) {
                return components[name];
            }
            throw new Error(`module ${name} not found`);
        };
        const pluginName = plugin.key;
        run(plugin.script, plugin.key)(__require, module, exports);
        let pluginConstructor;
        if (!(pluginConstructor = (module.exports || exports).default || module.exports)) {
            throw new Error(`Failed to load plugin ${pluginName}. No exports detected.`);
        }
        const plug = new pluginConstructor();
        if (!(plug instanceof Plugin)) {
            throw new Error(`Failed to load plugin ${pluginName}`);
        }
        plug.onload();
        this.loadedPlugins.set(plugin.key, plug);
    }

    async unloadPlugin(key: string) {
        const plugin = this.loadedPlugins.get(key);
        if (!plugin) {
            return;
        }
        await plugin.onunload();
        this.loadedPlugins.delete(key);
    }

    generateRequiredModules() {
        components = {
            "siyuan": {
                ...modules,
                ...apiGenerate(),
            }
        };
    }
}