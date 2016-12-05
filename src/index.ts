import {Plugin} from "./plugin/plugin";
import {IPluginConfig} from "./plugin/plugin-config";

// Export the plugin instance for use in the gulp pipeline.
export = (config: IPluginConfig) => new Plugin(config);
