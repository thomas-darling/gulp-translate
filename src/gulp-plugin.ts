import * as through from "through2";
import * as Vinyl from "vinyl";
import PluginError from "plugin-error";

import { Plugin } from "./plugin/plugin";
import { IPluginConfig } from "./plugin/plugin-config";
import { IPluginTask } from "./plugin/plugin-task";
import { GulpFile } from "./gulp-file";

import { IExportTaskConfig } from "./plugin/export/export-task-config";
import { IImportTaskConfig } from "./plugin/import/import-task-config";
import { ITranslateTaskConfig } from "./plugin/translate/translate-task-config";

/* tslint:disable-next-line: no-require-imports no-var-requires */
const packageJson: any = require("../package.json");

/**
 * Represents a Gulp plugin, implemented as a wrapper around the translate plugin.
 */
export class GulpPlugin
{
    private readonly plugin: Plugin;

    /**
     * Creates a new instance of the GulpPlugin type.
     * @param config The plugin configuration to use, or undefined to use the default.
     */
    public constructor(config?: IPluginConfig)
    {
        this.plugin = new Plugin(config);
    }

    /**
     * Exports the localized content from the HTML file being processed, into a localizable JSON file.
     * @param config The command configuration to use, or undefined to use the default.
     * @returns A stream transform for processing files.
     */
    public export(config: IExportTaskConfig): NodeJS.ReadWriteStream
    {
        return this.createTransform(this.plugin.export(config));
    }

    /**
     * Imports the localized content from a localized JSON file, into the HTML file being processed.
     * @param config The command configuration to use.
     * @returns A stream transform for processing files.
     */
    public import(config: IImportTaskConfig): NodeJS.ReadWriteStream
    {
        return this.createTransform(this.plugin.import(config));
    }

    /**
     * Simulates translation by creating an import file based on the content of the export file, optionally applying pseudo-localization to the content.
     * @param config The command configuration to use, or undefined to use the default.
     * @returns A stream transform for processing files.
     */
    public translate(config: ITranslateTaskConfig): NodeJS.ReadWriteStream
    {
        return this.createTransform(this.plugin.translate(config));
    }

    /**
     * Creates a stream transform that processes files using the specified task.
     */
    private createTransform(task: IPluginTask): NodeJS.ReadWriteStream
    {
        // Return the stream transform.
        return through.obj(async (vinyl: Vinyl, encoding: string, callback: (err?: any, data?: any) => void) =>
        {
            try
            {
                // Don't drop null-files from the stream.
                if (vinyl.isNull())
                {
                    callback(null, vinyl);

                    return;
                }

                // Process the buffer contents.
                if (!vinyl.isBuffer())
                {
                    throw new Error("This plugin command only supports buffers.");
                }

                if (task.process instanceof Function)
                {
                    // Process the file.
                    await task.process(new GulpFile(vinyl))

                        // Notify stream engine that we are done with this file and push it back into the stream.
                        .then((gulpFile: GulpFile) => callback(null, gulpFile.vinyl));
                }
                else
                {
                    // Notify stream engine that we are all done.
                    callback(null, vinyl);
                }
            }
            catch (error)
            {
                callback(new PluginError(packageJson.name, error.message));

                return;
            }
        },
        async (callback: () => void) =>
        {
            if (task.finalize instanceof Function)
            {
                // Finalize the task.
                await task.finalize()

                    // Notify stream engine that we are all done.
                    .then(gulpFile => callback());
            }
            else
            {
                // Notify stream engine that we are all done.
                callback();
            }
        });
    }
}
