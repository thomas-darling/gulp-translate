import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import * as chalk from "chalk";
import {JsonExportFileFormat} from "./formats/json-format";
import {CsvExportFileFormat} from "./formats/csv-format";

/**
 * Represents a localizable content instance parsed from one or more templates.
 */
export class Content
{
    /**
     * Creates a new instance of the Content type.
     * @param content The exported from the template.
     * @param hint The hint exported along with the content.
     * @param context The contexts exported along with the content.
     * @param sources The relative paths for the HTML files containing an instance of this content.
     */
    public constructor(content: string, hint?: string, context?: string[], sources?: string[])
    {
        this.content = content;
        this.hint = hint;
        this.context = context || [];
        this.sources = sources || [];

    }

    /**
     * The content exported from the template.
     */
    public content: string;

    /**
     * The hint exported along with the content.
     */
    public hint?: string;

    /**
     * The contexts exported along with the content.
     */
    public context?: string[];

    /**
     * The sets of relative paths for the HTML files containing an instance of this content.
     */
    public sources: string[];
}

/**
 * Represents a file format in which an ExportFile instance may be persisted.
 */
export interface IExportFileFormat
{
    /**
     * Stringifies the specified ExportFile instance.
     * @param exportFile The ExportFile to stringify.
     * @returns A string representing the ExportFile instance.
     */
    stringify(exportFile: ExportFile): string;

    /**
     * Parses the specified string, creating a new instance of the ExportFile type.
     * @param text The string to parse.
     * @returns The new instance of the ExportFile type.
     */
    parse(text: string): ExportFile
}

/**
 * Represents localizable contents exported from templates, where each content instance is identified by an id,
 * and represented by an object containing the content, its hint text and the list of files in which it was found.
 */
export class ExportFile
{
    public contents: { [id: string]: Content } = {};

    /**
     * Sets the specified content, hint and source.
     * @param source The relative path for the file from which the content was exported.
     * @param id The id identifying the content.
     * @param content The content to set.
     * @param hint The hint text for the content.
     * @param context The context text for the content.
     */
    public set(source: string, id: string, content: string, hint?: string, context?: string): void
    {
        const item = this.contents[id] || (this.contents[id] = new Content(content, hint));

        if (item.sources.indexOf(source) < 0)
        {
            item.sources.push(source);
        }

        if (item.context == null)
        {
            item.context = [];
        }

        if (context && item.context.indexOf(context) < 0)
        {
            item.context.push(context);
        }
    }

    /**
     * Gets the content instance matching the specified id.
     * @param id The id identifying the content.
     * @returns The content instance matching the specified id, or undefined if no instance is found.
     */
    public get(id: string): Content|undefined
    {
        return this.contents[id];
    }

    /**
     * Serializes the contents to a JSON string.
     * @returns A JSON string representing the file contents.
     */
    public stringify(fileNameExt: string): string
    {
        const format = ExportFile.getFormat(fileNameExt);

        return format.stringify(this);
    }

    /**
     * Parses the specified text, creating a new instance of the ExportFile type.
     * @param text The string to parse.
     * @param fileNameExt The file name extension for the format to parse.
     * @returns The new instance of the ExportFile type.
     */
    public static parse(text: string, fileNameExt: string): ExportFile
    {
        const format = ExportFile.getFormat(fileNameExt);

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
     * Loads the specified file, creating a new instance of the ExportFile type.
     * @param filePath The absolute path for the file to load.
     * @param encoding The file encoding to use, or undefined to use UTF8.
     * @returns The new instance of the ExportFile type.
     */
    public static load(filePath: string, encoding = "utf8"): ExportFile
    {
        const text = fs.readFileSync(filePath, { encoding });

        return this.parse(text, path.extname(filePath));
    }

    /**
     * Creates a new instance of the appropiate IExportFileFormat type, based on the specified file path.
     * @param filePath The absolute path for the file to load.
     * @returns The new instance of the IExportFileFormat type.
     */
    private static getFormat(fileNameExt): IExportFileFormat
    {
        switch (fileNameExt)
        {
            case ".json":
                return new JsonExportFileFormat();

            case ".csv":
                return new CsvExportFileFormat();

            default:
                throw new Error(`The file format '${chalk.magenta(fileNameExt)}' is not supported.`);
        }
    }
}
