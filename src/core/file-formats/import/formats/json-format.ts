import chalk from "chalk";
import { IImportFileFormat, ImportFile } from "../import-file";

/**
 * Represents the JSON file format in which an ImportFile instance may be persisted.
 */
export class JsonImportFileFormat implements IImportFileFormat
{
    /**
     * Stringifies the specified ImportFile instance.
     * @param importFile The ImportFile to stringify.
     * @returns A string representing the ImportFile instance.
     */
    public stringify(importFile: ImportFile): string
    {
        return JSON.stringify(importFile.contents, null, 2);
    }

    /**
     * Parses the specified string, creating a new instance of the ImportFile type.
     * @param text The string to parse.
     * @returns The new instance of the ImportFile type.
     */
    public parse(text: string): ImportFile
    {
        const importFile = new ImportFile();
        const data = JSON.parse(text);

        for (const key of Object.keys(data))
        {
            // Does this key represent a content ID?
            if (typeof data[key] === "string")
            {
                importFile.set("./", key, data[key]);
            }

            // Otherwise it must represent a scope path.
            else
            {
                if (!/^\.\//.test(key))
                {
                    throw new Error(`Invalid scope path '${chalk.magenta(key)}'. Expected a string that begins with '${chalk.magenta("./")}'.`);
                }

                const contents = data[key];

                for (const id of Object.keys(contents))
                {
                    const content = contents[id];

                    if (typeof content !== "string")
                    {
                        throw new Error(`Invalid content for id '${chalk.cyan(id)}'. Expected a string.`);
                    }

                    importFile.set(key, id, content);
                }
            }
        }

        return importFile;
    }
}
