import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import * as chalk from "chalk";
import {JsonImportFileFormat} from "./formats/json-format";
import {CsvImportFileFormat} from "./formats/csv-format";

/**
 * Represents a file format in which an ImportFile instance may be persisted.
 */
export interface IImportFileFormat
{
    /**
     * Stringifies the specified ImportFile instance.
     * @param importFile The ImportFile to stringify.
     * @returns A string representing the ImportFile instance.
     */
    stringify(importFile: ImportFile): string;

    /**
     * Parses the specified string, creating a new instance of the ImportFile type.
     * @param text The string to parse.
     * @returns The new instance of the ImportFile type.
     */
    parse(text: string): ImportFile
}

/**
 * Represents localized contents to be imported into templates, where each content instance is identified by an id,
 * and scoped to a file or folder path.
 */
export class ImportFile
{
    /**
     * The contents of the file.
     */
    public contents: { [path: string]: { [id: string]: string } } = {};

    /**
     * Sets the specified content, scoped to the specified path.
     * @param scopePath The relative file or folder path for which the content should be returned.
     * @param id The id identifying the content.
     * @param content The content to set.
     */
    public set(scopePath: string, id: string, content: string): void
    {
        const scope = this.contents[scopePath] || (this.contents[scopePath] = {});
        scope[id] = content;
    }

    /**
     * Gets the content matching the specified id and scope path.
     * @param scopePath The relative file or folder path for which the content should be returned.
     * @param id The id identifying the content.
     * @returns The content matching the specified path and id, or undefined if no content is found.
     */
    public get(scopePath: string, id: string): string|undefined
    {
        // Get the set of paths in the file that contain the specified path.
        // The path length is used as betterness criteria.
        const basePaths = Object.keys(this.contents)
            .filter(p => scopePath.indexOf(p) === 0)
            .sort((a, b) => b.length - a.length);

        let content: string;

        for (let basePath of basePaths)
        {
            content = this.contents[basePath][id];

            if (content != null)
            {
                return content;
            }
        }

        return undefined;
    }

    /**
     * Serializes the contents to a JSON string.
     * @returns A JSON string representing the file contents.
     */
    public stringify(fileNameExt: string): string
    {
        const format = ImportFile.getFormat(fileNameExt);

        return format.stringify(this);
    }

    /**
     * Parses the specified text, creating a new instance of the ImportFile type.
     * @param text The string to parse.
     * @param fileNameExt The file name extension for the format to parse.
     * @returns The new instance of the ImportFile type.
     */
    public static parse(text: string, fileNameExt: string): ImportFile
    {
        const format = ImportFile.getFormat(fileNameExt);

        return format.parse(text);
    }

    /**
     * Saves the contents to the specified file.
     * @param filePath The absolute path for the file to which the contents should be saved.
     * @param encoding The file encoding to use, or undefined to use UTF8.
     */
    public save(filePath: string, encoding = "utf8"): void
    {
        const text = this.stringify(path.extname(filePath));

        mkdirp(path.dirname(filePath), () =>
        {
            fs.writeFileSync(filePath, text, { encoding });
        });
    }

    /**
     * Loads the specified file, creating a new instance of the ImportFile type.
     * @param filePath The absolute path for the file to load.
     * @param encoding The file encoding to use, or undefined to use UTF8.
     * @returns The new instance of the ImportFile type.
     */
    public static load(filePath: string, encoding = "utf8"): ImportFile
    {
        const text = fs.readFileSync(filePath, { encoding });

        return this.parse(text, path.extname(filePath));
    }

    /**
     * Creates a new instance of the appropiate IExportFileFormat type, based on the specified file path.
     * @param filePath The absolute path for the file to load.
     * @returns The new instance of the IExportFileFormat type.
     */
    private static getFormat(fileNameExt): IImportFileFormat
    {
        switch (fileNameExt)
        {
            case ".json":
                return new JsonImportFileFormat();

            case ".csv":
                return new CsvImportFileFormat();

            default:
                throw new Error(`The file format '${chalk.magenta(fileNameExt)}' is not supported.`);
        }
    }
}
