import { File } from "./file";

/**
 * Represents a task for processing files.
 */
export interface IPluginTask
{
    /**
     * Processes the specified file.
     * @param file The file to process.
     * @returns A promise that will be resolved with the processed file.
     */
    process(file: File): Promise<File>;

    /**
     * Finalizes the task.
     * @returns A promise that will be resolved when the task has finalized its work.
     */
    finalize?(): Promise<void>;
}
