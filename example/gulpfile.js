
/* How to run this example:
 * --------------------------------------------------------------------------------------------------------------------
 * 1. Open a command prompt in this folder.
 * 2. Execute the command: gulp
 *
 * This will execute all the tasks in the correct order, producing output in the 'translation' and 'artifacts' folders.
 * --------------------------------------------------------------------------------------------------------------------
 */

var gulp = require("gulp");
var del = require("del");
var rename = require("gulp-rename");
var translate = require("../lib/index");

// The configuration for the 'translate' plugin.
var translateConfig =
{
    templateLanguage: "aurelia",
    allowDirectAnnotation: true,
    prefixIdsInContentFiles: true
    // See 'readme.md' for more options.
};

/**
 * Cleans the artifacts folder.
 */
gulp.task("clean", function ()
{
    // Delete the artifacts and translation files.
    return del(["./artifacts/*", "./translation/*"]);
});

/**
 * Exports the localizable content from the templates into a JSON file,
 * which can then be sent to a translation system. Here we also remove
 * the annotations to produce a normal HTML file for the base language.
 */
gulp.task("localize.export", function ()
{
    return gulp

        // Get the source files.
        .src(["./source/**/*.html", "./source/**/content.json"])

        // Export localizable content from the template.
        .pipe(translate(translateConfig).export(
        {
            exportFilePath: "./translation/export/translation.json"
            // See 'readme.md' for more options.
        }))

        // Write the destination file.
        .pipe(gulp.dest("./artifacts"));
});

/**
 * Imports the localized content from a JSON file received from a
 * translation system, into the templates.
 */
gulp.task("localize.import", function ()
{
    return gulp

        // Get the source files.
        .src(["./source/**/*.html", "./source/**/content.json"])

        // Import localized content into the template.
        .pipe(translate(translateConfig).import(
        {
            preserveAnnotations: "none",
            importFilePath: "./translation/import/translation.pseudo.json",
            missingContentHandler: function (id, filePath) { return "external content for " + id }
            // See 'readme.md' for more options.
        }))

        // Rename the destination file.
        .pipe(rename({ suffix: ".pseudo" }))

        // Write the destination file.
        .pipe(gulp.dest("./artifacts"));
});

/**
 * Simulates translation by transforming an export file into an import file,
 * where the contents is copied unchanged.
 */
gulp.task("translate.copy", function ()
{
    return gulp

        // Get the source file.
        .src("./translation/export/translation.json")

        // Translate the contents.
        .pipe(translate(translateConfig).translate())

        // Write the destination file.
        .pipe(gulp.dest("./translation/import"));
});

/**
 * Simulates translation by transforming an export file into an import file,
 * where the contents is pseudo-translated, such that it can be used for
 * visually identifying content that may cause problems after translation.
 */
gulp.task("translate.pseudo", function ()
{
    return gulp

        // Get the source file.
        .src("./translation/export/translation.json")

        // Translate the contents.
        .pipe(translate(translateConfig).translate(
        {
            translator: "pseudo"
            // See 'readme.md' for more options.
        }))

        // Rename the destination file.
        .pipe(rename({ suffix: ".pseudo" }))

        // Write the destination file.
        .pipe(gulp.dest("./translation/import"));
});

/**
 * Runs all the tasks, in sequence.
 */
gulp.task("default", gulp.series("clean", "localize.export", "translate.copy", "translate.pseudo", "localize.import"));
