import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import chalk from "chalk";
import { JsonContentFileFormat } from "./formats/json-format";
import { CsvContentFileFormat } from "./formats/csv-format";

/**
 * Represents a file format in which a ContentFile instance may be persisted.
 */
export interface IContentFileFormat
{
    /**
     * Stringifies the specified ContentFile instance.
     * @param importFile The ContentFile to stringify.
     * @returns A string representing the ContentFile instance.
     */
    stringify(importFile: ContentFile): string;

    /**
     * Parses the specified string, creating a new instance of the ContentFile type.
     * @param text The string to parse.
     * @returns The new instance of the ContentFile type.
     */
    parse(text: string): ContentFile;
}

/**
 * Represents localizable or localized contents, where each content instance is identified by an id.
 */
export class ContentFile
{
    /**
     * Parses the specified text, creating a new instance of the ContentFile type.
     * @param text The string to parse.
     * @param fileNameExt The file name extension for the format to parse.
     * @returns The new instance of the ContentFile type.
     */
    public static parse(text: string, fileNameExt: string): ContentFile
    {
        const format = ContentFile.getFormat(fileNameExt);

        return format.parse(text);
    }

    /**
     * Loads the specified file, creating a new instance of the ContentFile type.
     * @param filePath The absolute path for the file to load.
     * @param encoding The file encoding to use, or undefined to use UTF8.
     * @returns The new instance of the ContentFile type.
     */
    public static load(filePath: string, encoding = "utf8"): ContentFile
    {
        const text = fs.readFileSync(filePath, { encoding });

        return this.parse(text, path.extname(filePath));
    }

    /**
     * Creates a new instance of the appropiate IExportFileFormat type, based on the specified file path.
     * @param fileNameExt The file name extension for which a format should be created.
     * @returns The new instance of the IExportFileFormat type.
     */
    private static getFormat(fileNameExt: string): IContentFileFormat
    {
        switch (fileNameExt)
        {
            case ".json":
                return new JsonContentFileFormat();

            case ".csv":
                return new CsvContentFileFormat();

            default:
                throw new Error(`The file format '${chalk.magenta(fileNameExt)}' is not supported.`);
        }
    }

    /**
     * The contents of the file.
     */
    public contents: { [id: string]: string } = {};

    /**
     * Sets the specified content.
     * @param id The id identifying the content.
     * @param content The content to set.
     */
    public set(id: string, content: string): void
    {
        this.contents[id] = content;
    }

    /**
     * Gets the content matching the specified id.
     * @param id The id identifying the content.
     * @returns The content matching the specified id, or undefined if no content is found.
     */
    public get(id: string): string | undefined
    {
        return this.contents[id];
    }

    /**
     * Serializes the contents to a JSON string.
     * @returns A JSON string representing the file contents.
     */
    public stringify(fileNameExt: string): string
    {
        const format = ContentFile.getFormat(fileNameExt);

        return format.stringify(this);
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
}
