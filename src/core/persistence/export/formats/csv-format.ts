const csvStringify = require("csv-stringify/lib/sync");
const csvParse = require("csv-parse/lib/sync");
import {IExportFileFormat, ExportFile, Content} from "../export-file";

/**
 * Represents the CSV file format in which a ExportFile instance may be persisted.
 */
export class CsvExportFileFormat implements IExportFileFormat
{
    /**
     * Stringifies the specified ExportFile instance.
     * @param exportFile The ExportFile to stringify.
     * @returns A string representing the ExportFile instance.
     */
    public stringify(exportFile: ExportFile): string
    {
        let data: any[] = [];

        for (let id of Object.keys(exportFile.contents))
        {
            const content = exportFile.contents[id];

            data.push({
                id: id,
                content: content.content,
                hint: content.hint,
                context: content.context ? content.context.map(c => `"${c}"`).join(",") : undefined,
                sources: content.sources.map(c => `"${c}"`).join(",")
            });
        }

        return csvStringify(data, {quotedString: true, columns: ["id", "content", "hint", "context", "sources"]});
    }

    /**
     * Parses the specified string, creating a new instance of the ExportFile type.
     * @param text The string to parse.
     * @returns The new instance of the ExportFile type.
     */
    public parse(text: string): ExportFile
    {
        const exportFile = new ExportFile();
        const data = csvParse(text, {skip_empty_lines: true, columns: ["id", "content", "hint", "context", "sources"]});

        for (let i = 0; i < data.length; i++)
        {
            const row = data[i];

            if (!row.id)
            {
                throw new Error(`Invalid data on row ${i + 1}.`);
            }

            exportFile.contents[row.id] = new Content(row.content, row.hint || undefined, row.context, row.sources);
        }

        return exportFile;
    }
}
