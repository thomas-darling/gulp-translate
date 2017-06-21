const csvStringify = require("csv-stringify/lib/sync");
const csvParse = require("csv-parse/lib/sync");
import {IImportFileFormat, ImportFile} from "../import-file";

/**
 * Represents the CSV file format in which a ImportFile instance may be persisted.
 */
export class CsvImportFileFormat implements IImportFileFormat
{
    /**
     * Stringifies the specified ImportFile instance.
     * @param importFile The ImportFile to stringify.
     * @returns A string representing the ImportFile instance.
     */
    public stringify(importFile: ImportFile): string
    {
        let data: any[] = [];

        for (let path of Object.keys(importFile.contents))
        {
            const contents = importFile.contents[path];

            for (let id of Object.keys(contents))
            {
                const content = contents[id];

                data.push({
                    path: path,
                    id: id,
                    content: content
                });
            };
        }

        return csvStringify(data, {quotedString: true, columns: ["path", "id", "content"]});
    }

    /**
     * Parses the specified string, creating a new instance of the ImportFile type.
     * @param text The string to parse.
     * @returns The new instance of the ImportFile type.
     */
    public parse(text: string): ImportFile
    {
        const importFile = new ImportFile();
        const data = csvParse(text, {skip_empty_lines: true, columns: ["path", "id", "content"]});

        for (let i = 0; i < data.length; i++)
        {
            const row = data[i];

            if (!row.id)
            {
                throw new Error(`Invalid data on row ${i + 1}.`);
            }

            importFile.set(row.path || "./", row.id, row.content);
        }

        return importFile;
    }
}
