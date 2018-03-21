import { IContentTranslator } from "../../core/content-translator/content-translator";

/**
 * Represents the task configuration.
 */
export interface ITranslateTaskConfig
{
    /**
     * The content translator to use, or undefined to use
     * no content translator.
     * Default is undefined.
     */
    translator?: "pseudo" | IContentTranslator;

    /**
     * The extension of the destination file name, used to
     * determine its format.
     * Default is the same format as the source file.
     */
    fileNameExtension?: string;
}

/**
 * Represents the task configuration.
 */
export class TranslateTaskConfig
{
    /**
     * Creates a new instance of the TranslateTaskConfig type.
     * @param config The config object from which the instance should be created.
     */
    public constructor(config: ITranslateTaskConfig)
    {
        if (config == undefined)
        {
            return;
        }

        if (config.translator != undefined)
        {
            this.translator = config.translator;
        }

        if (config.fileNameExtension != undefined)
        {
            this.fileNameExtension = config.fileNameExtension;
        }
    }

    /**
     * The content translator to use, or undefined to use
     * no content translator.
     */
    public translator?: "pseudo" | IContentTranslator;

    /**
     * The extension of the destination file name, used to
     * determine its format, or undefined to use the same
     * format as the source file.
     */
    public fileNameExtension?: string;
}
