import chalk from "chalk";
import { IExportFileFormat, ExportFile, Content } from "../export-file";

/**
 * Represents the JSON file format in which an ExportFile instance may be persisted.
 */
export class JsonExportFileFormat implements IExportFileFormat
{
    /**
     * Stringifies the specified ExportFile instance.
     * @param exportFile The ExportFile to stringify.
     * @returns A string representing the ExportFile instance.
     */
    public stringify(exportFile: ExportFile): string
    {
        return JSON.stringify(exportFile.contents, (key, value) =>
            (key === "context" || key === "sources") && value.length === 0 ? undefined : value, 2);
    }

    /**
     * Parses the specified string, creating a new instance of the ExportFile type.
     * @param text The string to parse.
     * @returns The new instance of the ExportFile type.
     */
    public parse(text: string): ExportFile
    {
        const exportFile = new ExportFile();
        const data = JSON.parse(text);

        for (const id of Object.keys(data))
        {
            const content = data[id];

            if (typeof content.content !== "string")
            {
                throw new Error(`Invalid content for id '${chalk.cyan(id)}'. Expected a string.`);
            }

            if (content.hint != null && typeof content.hint !== "string")
            {
                throw new Error(`Invalid hint for id '${chalk.cyan(id)}'. Expected a string.`);
            }

            if (content.context != null)
            {
                if (!(content.context instanceof Array))
                {
                    throw new Error(`Invalid context for id '${chalk.cyan(id)}'. Expected an array.`);
                }

                for (const context of content.context)
                {
                    if (typeof context !== "string")
                    {
                        throw new Error(`Invalid context '${chalk.cyan(context)}' for id '${chalk.cyan(id)}'. Expected a string.`);
                    }
                }
            }

            if (content.sources != null)
            {
                if (!(content.sources instanceof Array))
                {
                    throw new Error(`Invalid sources for id '${chalk.cyan(id)}'. Expected an array.`);
                }

                for (const source of content.sources)
                {
                    if (typeof source !== "string")
                    {
                        throw new Error(`Invalid source '${source}' for id '${chalk.cyan(id)}'. Expected a string.`);
                    }

                    if (!/^\.\//.test(source))
                    {
                        throw new Error(`Invalid source '${chalk.magenta(source)}'. Expected a string that begins with '${chalk.magenta("./")}'.`);
                    }
                }
            }

            exportFile.contents[id] = new Content(content.content, content.hint, content.context, content.sources);
        }

        return exportFile;
    }
}
