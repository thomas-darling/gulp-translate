/* tslint:disable: no-require-imports no-var-requires no-submodule-imports */
const csvStringify = require("csv-stringify/lib/sync");
const csvParse = require("csv-parse/lib/sync");
/* tslint:enable */
import { IContentFileFormat, ContentFile } from "../content-file";

/**
 * Represents the CSV file format in which a ContentFile instance may be persisted.
 */
export class CsvContentFileFormat implements IContentFileFormat
{
    /**
     * Stringifies the specified ContentFile instance.
     * @param contentFile The ContentFile to stringify.
     * @returns A string representing the ContentFile instance.
     */
    public stringify(contentFile: ContentFile): string
    {
        const data: any[] = [];

        for (const id of Object.keys(contentFile.contents))
        {
            const content = contentFile.contents[id];

            data.push({ id, content });
        }

        return csvStringify(data, {quotedString: true, columns: ["id", "content"]});
    }

    /**
     * Parses the specified string, creating a new instance of the ContentFile type.
     * @param text The string to parse.
     * @returns The new instance of the ContentFile type.
     */
    public parse(text: string): ContentFile
    {
        const contentFile = new ContentFile();
        const data = csvParse(text, {skip_empty_lines: true, columns: ["id", "content"]});

        for (let i = 0; i < data.length; i++)
        {
            const row = data[i];

            if (!row.id)
            {
                throw new Error(`Invalid data on row ${i + 1}.`);
            }

            contentFile.contents[row.id] = row.content;
        }

        return contentFile;
    }
}
