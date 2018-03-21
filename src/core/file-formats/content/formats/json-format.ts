import chalk from "chalk";
import { IContentFileFormat, ContentFile } from "../content-file";

/**
 * Represents the JSON file format in which a ContentFile instance may be persisted.
 */
export class JsonContentFileFormat implements IContentFileFormat
{
    /**
     * Stringifies the specified ContentFile instance.
     * @param contentFile The ContentFile to stringify.
     * @returns A string representing the ContentFile instance.
     */
    public stringify(contentFile: ContentFile): string
    {
        return JSON.stringify(contentFile.contents, null, 2);
    }

    /**
     * Parses the specified string, creating a new instance of the ContentFile type.
     * @param text The string to parse.
     * @returns The new instance of the ContentFile type.
     */
    public parse(text: string): ContentFile
    {
        const contentFile = new ContentFile();
        const data = JSON.parse(text);

        for (const id of Object.keys(data))
        {
            const content = data[id];

            if (typeof content !== "string")
            {
                throw new Error(`Invalid content for id '${chalk.cyan(id)}'. Expected a string.`);
            }

            contentFile.contents[id] = content;
        }

        return contentFile;
    }
}
