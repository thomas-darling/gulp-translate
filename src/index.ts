import { IPluginConfig } from "./plugin/plugin-config";

import { GulpPlugin } from "./gulp-plugin";

// Export the plugin instance for use in the gulp pipeline.
export = (config: IPluginConfig) => new GulpPlugin(config);
