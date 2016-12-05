import {IContentTranslator} from "../../core/content-translator/content-translator";

/**
 * Represents the command configuration.
 */
export interface ITranslateCommandConfig
{
    /**
     * The content translator to use, or undefined to use
     * no content translator.
     * Default is undefined.
     */
    translator?: "pseudo"|IContentTranslator;

    /**
     * The extension of the destination file name, used to
     * determine its format.
     * Default is the same as the source file.
     */
    fileNameExtension?: string;
}

/**
 * Represents the command configuration.
 */
export class TranslateCommandConfig
{
    /**
     * Creates a new instance of the TranslateCommandConfig type.
     * @param config The config object from which the instance should be created.
     */
    public constructor(config: ITranslateCommandConfig)
    {
        if (config == undefined)
            return;

        if (config.translator != undefined)
            this.translator = config.translator;

        if (config.fileNameExtension != undefined)
            this.fileNameExtension = config.fileNameExtension;
    }

    /**
     * The content translator to use, or undefined to use
     * no content translator.
     * Default is undefined.
     */
    translator?: "pseudo"|IContentTranslator;

    /**
     * The extension of the destination file name, used to
     * determine its format.
     * Default is the same as the source file.
     */
    fileNameExtension?: string;
}
